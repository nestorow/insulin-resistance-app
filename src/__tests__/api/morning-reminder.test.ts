/**
 * @jest-environment node
 *
 * Route handlers use the Fetch API's global `Request` / `Response`,
 * which exist in Node 18+ but not in jsdom. Switch to node env for
 * this suite only.
 */
// Cron auth: the route must reject anything without the right bearer
// token, even if the request looks otherwise innocent. Without this gate
// anyone on the internet could trigger an unbounded push fan-out.

const executeMock = jest.fn<Promise<{ rows: unknown[] }>, unknown[]>(
  async () => ({ rows: [] })
);
jest.mock("@/lib/db", () => ({
  db: { execute: (...args: unknown[]) => executeMock(...args) },
}));

const sendPushMock = jest.fn<
  Promise<{ ok: true } | { ok: false; gone: true }>,
  unknown[]
>(async () => ({ ok: true }));
jest.mock("@/lib/web-push", () => ({
  sendPush: (...args: unknown[]) => sendPushMock(...args),
  publicVapidKey: () => "test-pub-key",
}));

import { GET } from "@/app/api/cron/morning-reminder/route";

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockResolvedValue({ rows: [] });
  sendPushMock.mockReset();
  sendPushMock.mockResolvedValue({ ok: true });
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.CRON_SECRET;
  } else {
    process.env.CRON_SECRET = ORIGINAL_SECRET;
  }
});

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/morning-reminder", { headers });
}

describe("GET /api/cron/morning-reminder", () => {
  it("rejects when CRON_SECRET is unset (deny-by-default)", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq({ authorization: "Bearer anything" }));
    expect(res.status).toBe(401);
  });

  it("rejects a wrong bearer token", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(makeReq({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("rejects when no Authorization header is present", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(makeReq({}));
    expect(res.status).toBe(401);
  });

  it("accepts the matching bearer and reports counts", async () => {
    process.env.CRON_SECRET = "correct-secret";
    executeMock.mockResolvedValueOnce({
      rows: [
        { endpoint: "https://push.example/1", keys_p256dh: "p", keys_auth: "a" },
        { endpoint: "https://push.example/2", keys_p256dh: "p2", keys_auth: "a2" },
      ],
    });
    const res = await GET(makeReq({ authorization: "Bearer correct-secret" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; sent: number; gone: number };
    expect(body.ok).toBe(true);
    expect(body.sent).toBe(2);
    expect(body.gone).toBe(0);
    expect(sendPushMock).toHaveBeenCalledTimes(2);
  });

  it("garbage-collects subscriptions that the push service marks gone (404/410)", async () => {
    process.env.CRON_SECRET = "correct-secret";
    executeMock.mockResolvedValueOnce({
      rows: [
        { endpoint: "https://push.example/stale", keys_p256dh: "p", keys_auth: "a" },
      ],
    });
    sendPushMock.mockResolvedValueOnce({ ok: false, gone: true });

    const res = await GET(makeReq({ authorization: "Bearer correct-secret" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { gone: number };
    expect(body.gone).toBe(1);

    // 2nd execute call should be the DELETE for the stale endpoint.
    const lastCall = executeMock.mock.calls.at(-1)?.[0] as {
      sql: string;
      args: unknown[];
    };
    expect(lastCall.sql).toMatch(/DELETE FROM push_subscriptions/);
    expect(lastCall.args).toEqual(["https://push.example/stale"]);
  });
});

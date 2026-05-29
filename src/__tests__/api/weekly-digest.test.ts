/**
 * @jest-environment node
 */

import type { SendResult } from "@/lib/email";
import type { ProgressSnapshot } from "@/lib/gamification";

const executeMock = jest.fn();
jest.mock("@/lib/db", () => ({
  db: { execute: (...args: unknown[]) => executeMock(...args) },
}));

const sendDigestMock = jest.fn<Promise<SendResult>, unknown[]>(
  async () => ({ ok: true })
);
jest.mock("@/lib/email", () => ({
  sendDigest: (...args: unknown[]) => sendDigestMock(...args),
}));

const getProgressMock = jest.fn<Promise<ProgressSnapshot>, unknown[]>(
  async () => ({
    currentStreak: 5,
    longestStreak: 5,
    totalXp: 60,
    level: 2,
    xpForCurrentLevel: 30,
    xpForNextLevel: 120,
    badgesEarned: [],
  })
);
jest.mock("@/lib/gamification", () => ({
  getProgress: (...args: unknown[]) => getProgressMock(...args),
  BADGES: [],
}));

import { GET } from "@/app/api/cron/weekly-digest/route";

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  executeMock.mockReset();
  sendDigestMock.mockReset().mockResolvedValue({ ok: true });
  getProgressMock.mockClear();
});

afterAll(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL_SECRET;
});

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/cron/weekly-digest", { headers });
}

describe("GET /api/cron/weekly-digest", () => {
  it("rejects without CRON_SECRET configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeReq({ authorization: "Bearer x" }));
    expect(res.status).toBe(401);
  });

  it("rejects wrong bearer", async () => {
    process.env.CRON_SECRET = "right";
    const res = await GET(makeReq({ authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
  });

  it("sends a digest per opted-in recipient", async () => {
    process.env.CRON_SECRET = "right";
    executeMock.mockImplementation(async (call: { sql: string }) => {
      if (/FROM users/.test(call.sql)) {
        return {
          rows: [
            { id: "u1", email: "a@example.com", name: "Алекс" },
            { id: "u2", email: "b@example.com", name: null },
          ],
        };
      }
      if (/FROM symptom_log/.test(call.sql)) return { rows: [{ n: 3 }] };
      if (/FROM user_badges/.test(call.sql)) return { rows: [] };
      return { rows: [] };
    });

    const res = await GET(makeReq({ authorization: "Bearer right" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      sent: number;
      skipped: number;
      failed: number;
    };
    expect(body.sent).toBe(2);
    expect(body.skipped).toBe(0);
    expect(body.failed).toBe(0);
    expect(sendDigestMock).toHaveBeenCalledTimes(2);
  });

  it("counts skipped (no-config) separately from failed", async () => {
    process.env.CRON_SECRET = "right";
    executeMock.mockImplementation(async (call: { sql: string }) => {
      if (/FROM users/.test(call.sql)) {
        return { rows: [{ id: "u1", email: "a@example.com", name: "X" }] };
      }
      if (/FROM symptom_log/.test(call.sql)) return { rows: [{ n: 0 }] };
      return { rows: [] };
    });
    sendDigestMock.mockResolvedValueOnce({
      ok: false,
      skipped: true,
      reason: "no-config",
    });

    const res = await GET(makeReq({ authorization: "Bearer right" }));
    const body = (await res.json()) as {
      sent: number;
      skipped: number;
      failed: number;
    };
    expect(body.sent).toBe(0);
    expect(body.skipped).toBe(1);
    expect(body.failed).toBe(0);
  });
});

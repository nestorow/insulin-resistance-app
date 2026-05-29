// Verify logAudit emits the expected SQL + arg shape and never throws on
// DB errors (audit is observability, not a gate).

const executeMock = jest.fn<Promise<{ rows: unknown[] }>, unknown[]>(
  async () => ({ rows: [] })
);

jest.mock("@/lib/db", () => ({
  db: {
    execute: (...args: unknown[]) => executeMock(...args),
  },
}));

import { logAudit } from "@/lib/audit";

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockResolvedValue({ rows: [] });
});

describe("logAudit", () => {
  it("inserts a row with action + user_id + uuid", async () => {
    await logAudit({ userId: "user-1", action: "onboarding.save" });
    expect(executeMock).toHaveBeenCalledTimes(1);
    const call = executeMock.mock.calls[0][0] as {
      sql: string;
      args: unknown[];
    };
    expect(call.sql).toMatch(/INSERT INTO audit_log/);
    // args: [id, user_id, action, target_id, metadata]
    expect(call.args).toHaveLength(5);
    expect(call.args[1]).toBe("user-1");
    expect(call.args[2]).toBe("onboarding.save");
    expect(call.args[0]).toMatch(/^[0-9a-f-]{36}$/); // uuid v4
  });

  it("serializes metadata as JSON", async () => {
    await logAudit({
      userId: "user-1",
      action: "markers.save",
      targetId: "marker-id",
      metadata: { date: "2026-05-28", fieldsPresent: 3 },
    });
    const call = executeMock.mock.calls[0][0] as {
      args: unknown[];
    };
    expect(call.args[3]).toBe("marker-id");
    expect(JSON.parse(call.args[4] as string)).toEqual({
      date: "2026-05-28",
      fieldsPresent: 3,
    });
  });

  it("stores null for target_id + metadata when omitted", async () => {
    await logAudit({ userId: "user-1", action: "onboarding.clear" });
    const call = executeMock.mock.calls[0][0] as {
      args: unknown[];
    };
    expect(call.args[3]).toBeNull();
    expect(call.args[4]).toBeNull();
  });

  it("swallows DB errors (audit failures must not break the operation)", async () => {
    executeMock.mockRejectedValueOnce(new Error("boom"));
    await expect(
      logAudit({ userId: "user-1", action: "markers.save" })
    ).resolves.toBeUndefined();
  });
});

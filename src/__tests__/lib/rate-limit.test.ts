import { checkRateLimit } from "@/lib/rate-limit";

// In the test environment UPSTASH_REDIS_REST_URL / TOKEN are not set, so
// the limiter is unconfigured and every check should pass-through with
// the `bypassed` flag. This matches local-dev + preview-deploy behavior
// where Upstash secrets aren't provisioned — we never want to lock users
// out of their own data due to missing infra.

describe("checkRateLimit — unconfigured environment", () => {
  it("returns ok:true with bypassed:true when Upstash env is missing", async () => {
    const result = await checkRateLimit("write", "user-123");
    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(true);
  });

  it("works for both limiter kinds", async () => {
    expect((await checkRateLimit("write", "u1")).ok).toBe(true);
    expect((await checkRateLimit("auth", "u1")).ok).toBe(true);
  });

  it("returns a fresh result object each call (no shared state)", async () => {
    const a = await checkRateLimit("write", "user-a");
    const b = await checkRateLimit("write", "user-a");
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

// BYOK key management — validates format check + encryption round-trip.
// The db module is mocked so we can assert SQL shapes; encryption uses
// the real implementation with the test ENCRYPTION_KEY from jest.setup.

const executeMock = jest.fn();
jest.mock("@/lib/db", () => ({
  db: { execute: (...args: unknown[]) => executeMock(...args) },
}));

// The action imports authOptions from @/lib/auth, which transitively
// pulls in next-auth/providers/google (ESM). Stub the auth module so
// the action loads without dragging the provider chain into jsdom.
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(async () => ({ user: { id: "user-1" } })),
}));

import {
  setAnthropicKeyAction,
  clearAnthropicKeyAction,
  hasAnthropicKeyAction,
  maskedAnthropicKeyAction,
} from "@/lib/actions/anthropic-key";
import { decrypt } from "@/lib/encryption";

beforeEach(() => {
  executeMock.mockReset();
  executeMock.mockResolvedValue({ rows: [] });
});

describe("setAnthropicKeyAction", () => {
  it("rejects obviously malformed input", async () => {
    const r = await setAnthropicKeyAction("not-a-key");
    expect(r).toEqual({ ok: false, reason: "invalid" });
    expect(executeMock).not.toHaveBeenCalled();
  });

  it("rejects empty string", async () => {
    const r = await setAnthropicKeyAction("");
    expect(r).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects placeholder text from a stray paste", async () => {
    const r = await setAnthropicKeyAction("sk-ant-api-PLACEHOLDER");
    expect(r.ok).toBe(false);
  });

  it("accepts a well-formed key and writes encrypted blob", async () => {
    // Anthropic key format: sk-ant-api03-<long random>
    const sample =
      "sk-ant-api03-" + "ABCDefgh1234567890_-".repeat(3);
    const r = await setAnthropicKeyAction(sample);
    expect(r).toEqual({ ok: true });

    // The first execute call should be the UPDATE writing the blob.
    const update = executeMock.mock.calls.find((c) =>
      /UPDATE users SET anthropic_api_key_encrypted/.test(
        (c[0] as { sql: string }).sql
      )
    );
    expect(update).toBeDefined();
    const blob = (update![0] as { args: unknown[] }).args[0] as string;
    expect(blob).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/); // iv:ct:tag

    // The blob round-trips back to the original key.
    expect(decrypt(blob)).toBe(sample);
  });

  it("trims whitespace before validating", async () => {
    const sample =
      "  sk-ant-api03-" + "ABCDefgh1234567890_-".repeat(3) + "  ";
    const r = await setAnthropicKeyAction(sample);
    expect(r.ok).toBe(true);
  });
});

describe("hasAnthropicKeyAction", () => {
  it("returns false when column is null", async () => {
    executeMock.mockResolvedValueOnce({
      rows: [{ anthropic_api_key_encrypted: null }],
    });
    expect(await hasAnthropicKeyAction()).toBe(false);
  });

  it("returns true when a key blob exists", async () => {
    executeMock.mockResolvedValueOnce({
      rows: [{ anthropic_api_key_encrypted: "iv:ct:tag" }],
    });
    expect(await hasAnthropicKeyAction()).toBe(true);
  });

  it("returns false when no row exists", async () => {
    executeMock.mockResolvedValueOnce({ rows: [] });
    expect(await hasAnthropicKeyAction()).toBe(false);
  });
});

describe("maskedAnthropicKeyAction", () => {
  it("returns null when no key", async () => {
    executeMock.mockResolvedValueOnce({
      rows: [{ anthropic_api_key_encrypted: null }],
    });
    expect(await maskedAnthropicKeyAction()).toBeNull();
  });

  it("returns a stable mask derived from the blob tail", async () => {
    executeMock.mockResolvedValueOnce({
      rows: [{ anthropic_api_key_encrypted: "iv:ct:abc123def456" }],
    });
    const mask = await maskedAnthropicKeyAction();
    expect(mask).toBe("key-def456");
  });
});

describe("clearAnthropicKeyAction", () => {
  it("issues an UPDATE setting the column to NULL", async () => {
    const r = await clearAnthropicKeyAction();
    expect(r).toEqual({ ok: true });
    const call = executeMock.mock.calls[0][0] as { sql: string };
    expect(call.sql).toMatch(
      /UPDATE users SET anthropic_api_key_encrypted = NULL/
    );
  });
});

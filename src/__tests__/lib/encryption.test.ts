import { encrypt, decrypt } from "@/lib/encryption";

// Key is set in jest.setup.ts; this suite verifies round-trip + tamper
// detection + format invariants. The missing-key path is exercised
// separately via jest.isolateModules.

describe("encrypt / decrypt", () => {
  it("round-trips a string", () => {
    const plaintext = "HOMA-IR 4.2";
    const ct = encrypt(plaintext);
    expect(ct).not.toBe(plaintext);
    expect(decrypt(ct)).toBe(plaintext);
  });

  it("round-trips JSON payloads (the real marker use-case)", () => {
    const payload = {
      homaIr: 4.2,
      fastingInsulin: 18,
      hba1c: 5.7,
      triglycerides: 150,
      hdl: 45,
    };
    const ct = encrypt(JSON.stringify(payload));
    expect(JSON.parse(decrypt(ct))).toEqual(payload);
  });

  it("uses a fresh IV — two encrypts of the same plaintext differ", () => {
    const a = encrypt("same input");
    const b = encrypt("same input");
    expect(a).not.toBe(b);
  });

  it("emits the iv:ciphertext:tag wire format", () => {
    const ct = encrypt("test");
    const parts = ct.split(":");
    expect(parts).toHaveLength(3);
    // IV is 12 bytes → 24 hex chars; tag is 16 bytes → 32 hex chars.
    expect(parts[0]).toMatch(/^[0-9a-f]{24}$/);
    expect(parts[2]).toMatch(/^[0-9a-f]{32}$/);
  });

  it("rejects tampered ciphertext (GCM auth tag mismatch)", () => {
    const ct = encrypt("HbA1c 5.7");
    const [iv, body, tag] = ct.split(":");
    // Flip one byte of the ciphertext body
    const flipped =
      body.slice(0, -2) + (body.slice(-2) === "00" ? "ff" : "00");
    expect(() => decrypt(`${iv}:${flipped}:${tag}`)).toThrow();
  });

  it("rejects malformed input", () => {
    expect(() => decrypt("notvalid")).toThrow(/Malformed/);
    expect(() => decrypt("only:two")).toThrow(/Malformed/);
  });
});

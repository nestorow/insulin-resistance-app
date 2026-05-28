import crypto from "crypto";

// Encryption-at-rest for sensitive medical data (blood markers).
// Pattern ported from thyroid-rehab/src/lib/encryption.ts.
//
// AES-256-GCM is authenticated encryption — each ciphertext carries an
// auth tag that detects tampering. IV is randomized per record so two
// identical plaintexts (e.g. same HbA1c twice) encrypt to different
// blobs, preventing equality inference attacks.
//
// Wire format: `<iv_hex>:<ciphertext_hex>:<tag_hex>` — all hex so the
// blob can ride in any TEXT column and survive copy/paste.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV is the GCM spec recommendation

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
        "Generate with: `node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`"
    );
  }
  return Buffer.from(hex, "hex");
}

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${encrypted}:${tag.toString("hex")}`;
}

export function decrypt(data: string): string {
  const [ivHex, encryptedHex, tagHex] = data.split(":");
  if (!ivHex || !encryptedHex || !tagHex) {
    throw new Error("Malformed ciphertext (expected iv:data:tag)");
  }
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

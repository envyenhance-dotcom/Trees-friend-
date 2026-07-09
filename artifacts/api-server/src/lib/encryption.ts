import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const keyStr = process.env.COURIER_ENCRYPTION_KEY;

  if (!keyStr) {
    // In development only, warn loudly but don't crash so the server still starts.
    // In production this should be set as a Replit secret.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "COURIER_ENCRYPTION_KEY must be set in production. " +
        "Generate a 32+ character random string and add it as a Replit secret.",
      );
    }
    console.warn(
      "[encryption] WARNING: COURIER_ENCRYPTION_KEY is not set. " +
      "Using an insecure development key. Set this secret before going to production.",
    );
    // Deterministic dev-only key — never ship this to production
    return Buffer.from("dev-only-key-not-for-production!!"); // exactly 32 bytes
  }

  if (keyStr.length < KEY_LENGTH) {
    throw new Error(
      `COURIER_ENCRYPTION_KEY must be at least ${KEY_LENGTH} characters long (got ${keyStr.length}).`,
    );
  }

  return Buffer.from(keyStr.slice(0, KEY_LENGTH));
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Format: iv:authTag:encrypted (all base64)
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(":");
  if (!ivB64 || !authTagB64 || !encryptedB64) throw new Error("Invalid encrypted data format");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function maskKey(key: string): string {
  if (key.length <= 4) return "****";
  return "••••" + key.slice(-4);
}

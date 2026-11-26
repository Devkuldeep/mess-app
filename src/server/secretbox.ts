// AES-256-GCM encryption for secrets at rest (Google refresh tokens).
// Key: TOKEN_ENCRYPTION_KEY = 32 random bytes, base64 (`openssl rand -base64 32`).
// Format: "v1.<iv>.<tag>.<ciphertext>" (base64url). The version prefix leaves
// room for key rotation. No "server-only" import so it stays unit-testable;
// only server code imports it.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(raw = process.env.TOKEN_ENCRYPTION_KEY): Buffer {
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  const k = Buffer.from(raw, "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (base64)");
  return k;
}

export function encryptSecret(plain: string, rawKey?: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(rawKey), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), enc.toString("base64url")].join(".");
}

export function decryptSecret(box: string, rawKey?: string): string {
  const [v, iv, tag, data] = box.split(".");
  if (v !== "v1" || !iv || !tag || !data) throw new Error("bad secret format");
  const d = createDecipheriv("aes-256-gcm", key(rawKey), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(data, "base64url")), d.final()]).toString("utf8");
}

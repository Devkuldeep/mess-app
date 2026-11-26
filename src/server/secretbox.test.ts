import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret } from "./secretbox.ts";

const k = randomBytes(32).toString("base64");

test("secretbox round-trips and uses a fresh IV", () => {
  const a = encryptSecret("1//refresh-token", k);
  const b = encryptSecret("1//refresh-token", k);
  assert.notEqual(a, b);
  assert.ok(a.startsWith("v1."));
  assert.equal(decryptSecret(a, k), "1//refresh-token");
});

test("secretbox rejects tampering and wrong keys", () => {
  const box = encryptSecret("secret", k);
  const parts = box.split(".");
  parts[3] = Buffer.from("SECRET").toString("base64url");
  assert.throws(() => decryptSecret(parts.join("."), k));
  assert.throws(() => decryptSecret(box, randomBytes(32).toString("base64")));
  assert.throws(() => encryptSecret("x", Buffer.from("short").toString("base64")), /32 bytes/);
});

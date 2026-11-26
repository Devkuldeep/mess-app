import { test } from "node:test";
import assert from "node:assert/strict";
import { assetLinks, normalizeFingerprint } from "./assetlinks.ts";

const FP = "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5";

test("normalizeFingerprint accepts colon/lowercase/plain hex", () => {
  assert.equal(normalizeFingerprint(FP.toLowerCase()), FP);
  assert.equal(normalizeFingerprint(FP.replace(/:/g, "")), FP);
  assert.equal(normalizeFingerprint("AB:CD"), null);
  assert.equal(normalizeFingerprint("not a fingerprint"), null);
});

test("assetLinks builds a TWA statement and dedupes fingerprints", () => {
  const r = assetLinks("in.messmanager.app", `${FP}, ${FP.toLowerCase()}, junk`);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].target, { namespace: "android_app", package_name: "in.messmanager.app", sha256_cert_fingerprints: [FP] });
  assert.deepEqual(r[0].relation, ["delegate_permission/common.handle_all_urls"]);
});

test("assetLinks is empty when not configured or invalid", () => {
  assert.deepEqual(assetLinks(undefined, FP), []);
  assert.deepEqual(assetLinks("in.messmanager.app", ""), []);
  assert.deepEqual(assetLinks("not a package", FP), []);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { customerSchema, fieldError, orgSettingsSchema, parseForm, signupSchema } from "./validation.ts";

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

test("signup: one error per field, password never echoed", () => {
  const r = parseForm(signupSchema, fd({ name: "  ", phone: "12345", password: "short" }));
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.deepEqual(r.state.fieldErrors, { name: "nameRequired", phone: "invalidPhone", password: "passwordShort", consent: "consentRequired" });
  assert.equal(r.state.values?.phone, "12345");
  assert.equal(r.state.values?.password, undefined);
});

test("signup: valid input is cleaned and typed", () => {
  const r = parseForm(signupSchema, fd({ name: " Ravi ", phone: "+91 98765 43210", password: "password123", consent: "on" }));
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.data.name, "Ravi");
  assert.equal(r.data.phone, "9876543210");
});

test("customer: optional fields become null, bad plan/date flagged", () => {
  const good = parseForm(customerSchema, fd({ name: "Aman", phone: "", diet: "nonveg", planId: "", startDate: "2026-11-26" }));
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.data.phone, null);
    assert.equal(good.data.address, null);
    assert.equal(good.data.planId, null);
    assert.equal(good.data.diet, "nonveg");
  }
  const bad = parseForm(customerSchema, fd({ name: "Aman", phone: "999", planId: "x", startDate: "2026-02-30" }));
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(bad.state.fieldErrors, { phone: "invalidPhone", planId: "planInvalid", startDate: "invalidDate" });
});

test("org settings: numbers checked, UPI format, too long text", () => {
  const r = parseForm(orgSettingsSchema, fd({ name: "x".repeat(81), phone: "", upiId: "not-upi", skipCutoffHour: "25", wastageTargetPct: "abc" }));
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.state.fieldErrors, { name: "tooLong", upiId: "upiInvalid", skipCutoffHour: "invalidValue", wastageTargetPct: "targetInvalid" });
  const ok = parseForm(orgSettingsSchema, fd({ name: "Sharma Mess", phone: "9876543210", upiId: "sharma@okaxis", skipCutoffHour: "21", wastageTargetPct: "5" }));
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual([ok.data.skipCutoffHour, ok.data.wastageTargetPct, ok.data.upiId], [21, 5, "sharma@okaxis"]);
});

test("fieldError echoes submitted values except passwords", () => {
  const s = fieldError("phone", "phoneTaken", fd({ name: "Ravi", phone: "9876543210", password: "secret123" }));
  assert.deepEqual(s.fieldErrors, { phone: "phoneTaken" });
  assert.deepEqual(s.values, { name: "Ravi", phone: "9876543210" });
});

test("secret-looking fields (…Secret/Token/Pin) are never echoed", () => {
  const f = fd({ name: "x", accountSecret: "1234567890", apiToken: "abc", upiPin: "1111", phone: "98" });
  const s = fieldError("phone", "phoneTaken", f);
  assert.deepEqual(Object.keys(s.values ?? {}).sort(), ["name", "phone"]);
});

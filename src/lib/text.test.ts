import { test } from "node:test";
import assert from "node:assert/strict";
import { initials } from "./text.ts";

test("initials: Latin and Hindi names, one word, extra spaces", () => {
  assert.equal(initials("Aman Verma"), "AV");
  assert.equal(initials("  priya   singh  kumar "), "PS");
  assert.equal(initials("Kavya"), "K");
  assert.equal(initials(""), "");
  assert.equal(initials("रवि कुमार"), "रकु");
  assert.equal(initials("क्षमा शर्मा"), "क्षश");
});

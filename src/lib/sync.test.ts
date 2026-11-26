import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOp } from "./sync.ts";

test("parseOp: wastage validation", () => {
  const dish = "11111111-1111-4111-8111-111111111111";
  const ok = parseOp({ opId: "w1", kind: "wastage", date: "2026-11-26", meal: "lunch", reason: "none", items: [{ dishId: dish, cooked: "4.5", leftover: 0.5, label: "  Bhindi " }] });
  assert.deepEqual(ok, { opId: "w1", kind: "wastage", date: "2026-11-26", meal: "lunch", reason: "none", note: undefined, items: [{ dishId: dish, label: "Bhindi", cooked: 4.5, leftover: 0.5 }] });
  const base = { opId: "w", kind: "wastage", date: "2026-11-26", meal: "lunch", reason: "none" };
  assert.equal(parseOp({ ...base, items: [{ dishId: dish, cooked: 1, leftover: 2 }] }), null); // leftover > cooked
  assert.equal(parseOp({ ...base, items: [{ dishId: dish, cooked: -1, leftover: 0 }] }), null);
  assert.equal(parseOp({ ...base, items: [] }), null);
  assert.equal(parseOp({ ...base, reason: "hack", items: [{ dishId: dish, cooked: 1, leftover: 0 }] }), null);
  assert.equal(parseOp({ ...base, items: [{ dishId: dish, cooked: 1, leftover: 0 }, { dishId: dish, cooked: 1, leftover: 0 }] }), null); // duplicate dish
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { roundQty, suggestCooking, wastageReport, type DishInfo, type Entry } from "./wastage.ts";

const rice: DishInfo = { id: "rice", name: "Chawal", unit: "kg", perTiffin: 0.08, costPerUnit: 50 };
const roti: DishInfo = { id: "roti", name: "Roti", unit: "count", perTiffin: 4, costPerUnit: 2 };
const sabzi: DishInfo = { id: "sabzi", name: "Sabzi", unit: "kg", perTiffin: 0.15, costPerUnit: null };

const e = (date: string, tiffins: number, items: Entry["items"], reason: Entry["reason"] = "none", meal: Entry["meal"] = "lunch"): Entry =>
  ({ date, meal, tiffins, reason, items });

test("report: ₹-weighted %, loss, kg, worst dish and variety", () => {
  const entries = [
    e("2026-11-20", 40, [
      { dishId: "rice", label: null, cooked: 4, leftover: 1, costPerUnit: 50 },
      { dishId: "roti", label: null, cooked: 160, leftover: 10, costPerUnit: 2 },
      { dishId: "sabzi", label: "Bhindi", cooked: 6, leftover: 2, costPerUnit: null },
    ], "disliked"),
    e("2026-11-21", 40, [
      { dishId: "rice", label: null, cooked: 4, leftover: 0, costPerUnit: 50 },
      { dishId: "sabzi", label: "Aloo", cooked: 6, leftover: 0.3, costPerUnit: null },
    ]),
    e("2026-11-01", 40, [{ dishId: "rice", label: null, cooked: 9, leftover: 9, costPerUnit: 50 }]), // out of range
  ];
  const r = wastageReport(entries, [rice, roti, sabzi], ["2026-11-20", "2026-11-21", "2026-11-22"]);
  assert.equal(r.days, 3);
  assert.equal(r.daysLogged, 2);
  assert.equal(r.loss, 50 + 20);
  // costed items only: (1*50 + 10*2) / (8*50 + 160*2) = 70 / 720
  assert.ok(Math.abs(r.pct! - 70 / 720) < 1e-9);
  assert.equal(r.wastedKg, 1 + 2 + 0.3);
  assert.equal(r.byDish[0].dishId, "rice");
  assert.equal(r.byLabel[0].label, "Bhindi");
  assert.ok(Math.abs(r.byLabel[0].pct - 2 / 6) < 1e-9);
  assert.deepEqual(r.reasons, [{ reason: "disliked", times: 1 }]);
  assert.equal(r.byDay[2].pct, null);
});

test("report: empty range", () => {
  const r = wastageReport([], [rice], ["2026-11-20"]);
  assert.equal(r.pct, null);
  assert.equal(r.loss, 0);
  assert.equal(r.daysLogged, 0);
});

test("suggestion: learning mode uses dish default + 10% buffer", () => {
  const [s] = suggestCooking(50, "lunch", [rice], []);
  assert.equal(s.confidence, "learning");
  assert.equal(s.qty, roundQty(50 * 0.08 * 1.1, "kg")); // 4.4
  assert.equal(s.qty, 4.4);
});

test("suggestion: learns eaten-per-tiffin from history, buffer from variability", () => {
  // eaten per tiffin: 0.07, 0.07, 0.07, 0.07 → steady → minimum 3% buffer
  const hist = [1, 2, 3, 4].map((i) => e(`2026-11-1${i}`, 40, [{ dishId: "rice", label: null, cooked: 3.2, leftover: 0.4, costPerUnit: 50 }]));
  const [s] = suggestCooking(50, "lunch", [rice], hist);
  assert.equal(s.confidence, "medium");
  assert.equal(s.perTiffin, 0.07);
  assert.equal(s.bufferPct, 0.03);
  assert.equal(s.qty, roundQty(50 * 0.07 * 1.03, "kg")); // 3.605 → 3.7
  // other meal's history is ignored
  assert.equal(suggestCooking(50, "dinner", [rice], hist)[0].confidence, "learning");
});

test("roundQty", () => {
  assert.equal(roundQty(161.2, "count"), 162);
  assert.equal(roundQty(3.61, "kg"), 3.7);
  assert.equal(roundQty(12.1, "kg"), 12.5);
  assert.equal(roundQty(0, "kg"), 0);
});

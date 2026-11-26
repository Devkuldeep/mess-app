import { test } from "node:test";
import assert from "node:assert/strict";
import { billing, scheduledMeals, skipKey, type SchedCustomer } from "./schedule.ts";
import { addDays, isISODate, isSkipLocked, monthEnd, todayIn } from "./dates.ts";

const ravi: SchedCustomer = { id: "ravi", startDate: "2026-11-01", endDate: null, meals: "both", pricePerMeal: 60 };
const amit: SchedCustomer = { id: "amit", startDate: "2026-11-16", endDate: "2026-11-20", meals: "lunch", pricePerMeal: 70 };
const none: SchedCustomer = { id: "none", startDate: "2026-11-01", endDate: null, meals: null, pricePerMeal: 0 };

test("dates", () => {
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(monthEnd("2028-02-10"), "2028-02-29");
  assert.ok(isISODate("2026-11-30"));
  assert.ok(!isISODate("2026-11-31"));
  assert.ok(!isISODate("26-11-30"));
  // 2026-11-26 15:00 UTC = 20:30 IST
  assert.equal(todayIn("Asia/Kolkata", new Date("2026-11-26T15:00:00Z")), "2026-11-26");
  assert.equal(todayIn("Asia/Kolkata", new Date("2026-11-26T19:00:00Z")), "2026-11-27");
});

test("skip cutoff: meal on D locks at (D-1) cutoff hour, local time", () => {
  const at = (iso: string) => new Date(iso);
  // 20:30 IST on the 26th, cutoff 21 → the 27th is still open
  assert.equal(isSkipLocked("2026-11-27", 21, "Asia/Kolkata", at("2026-11-26T15:00:00Z")), false);
  // 21:30 IST on the 26th → the 27th is locked, the 28th is open
  assert.equal(isSkipLocked("2026-11-27", 21, "Asia/Kolkata", at("2026-11-26T16:00:00Z")), true);
  assert.equal(isSkipLocked("2026-11-28", 21, "Asia/Kolkata", at("2026-11-26T16:00:00Z")), false);
  // today and past are always locked
  assert.equal(isSkipLocked("2026-11-26", 21, "Asia/Kolkata", at("2026-11-26T01:00:00Z")), true);
});

test("scheduledMeals honours plan, start/end, holidays, skips", () => {
  const holidays = new Set(["2026-11-08", "2026-11-18"]);
  const skips = new Set([skipKey("ravi", "2026-11-10", "dinner")]);
  const s = scheduledMeals([ravi, amit, none], "2026-11-01", "2026-11-30", holidays, skips);
  const count = (id: string) => s.filter((m) => m.customerId === id).length;
  assert.equal(count("ravi"), 30 * 2 - 2 * 2 - 1);
  assert.equal(count("amit"), 5 - 1); // 16..20, minus the 18th holiday
  assert.equal(count("none"), 0);
  assert.ok(!s.some((m) => m.customerId === "amit" && m.meal === "dinner"));
});

test("billing: month bill, running balance, payments after month end ignored", () => {
  const bills = billing([ravi, amit], "2026-12-15", new Set(), new Set(), [
    { customerId: "ravi", amount: 3000, paidOn: "2026-11-05" },
    { customerId: "ravi", amount: 1000, paidOn: "2026-12-02" },
    { customerId: "ravi", amount: 999, paidOn: "2027-01-01" },
  ]);
  const r = bills.find((b) => b.customerId === "ravi")!;
  assert.equal(r.monthMeals, 62);
  assert.equal(r.monthAmount, 62 * 60);
  assert.equal(r.totalCharged, (60 + 62) * 60);
  assert.equal(r.totalPaid, 4000);
  assert.equal(r.monthPaid, 1000);
  assert.equal(r.balance, (60 + 62) * 60 - 4000);
  const a = bills.find((b) => b.customerId === "amit")!;
  assert.equal(a.monthMeals, 0);
  assert.equal(a.balance, 5 * 70);
});

test("billing balance counts meals only up to asOf", () => {
  const [r] = billing([ravi], "2026-11-01", new Set(), new Set(), [{ customerId: "ravi", amount: 1000, paidOn: "2026-11-02" }], "2026-11-10");
  assert.equal(r.monthMeals, 60); // full month bill
  assert.equal(r.totalCharged, 10 * 2 * 60); // served so far
  assert.equal(r.balance, 1200 - 1000);
});

test("billing excludes customers who start after the month", () => {
  const bills = billing([amit], "2026-10-10", new Set(), new Set(), []);
  assert.equal(bills.length, 0);
});

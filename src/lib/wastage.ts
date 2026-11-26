// Pure wastage maths: reports and cooking-quantity suggestions.
// No DB access — unit-tested in wastage.test.ts.
import type { ISODate } from "./dates.ts";
import type { MealName } from "./schedule.ts";

export type Unit = "kg" | "litre" | "count";
export type Reason = "none" | "late_skip" | "not_taken" | "disliked" | "overcooked" | "other";
export const REASONS: Exclude<Reason, "none">[] = ["late_skip", "not_taken", "disliked", "overcooked", "other"];

export type DishInfo = { id: string; name: string; unit: Unit; perTiffin: number; costPerUnit: number | null };

export type EntryItem = { dishId: string; label: string | null; cooked: number; leftover: number; costPerUnit: number | null };
export type Entry = { date: ISODate; meal: MealName; tiffins: number; reason: Reason; items: EntryItem[] };

/** Leftover quick-pick fractions of what was cooked. */
export const LEFTOVER_STEPS = [0, 0.1, 0.25, 0.5] as const;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

// ─────────────────────────── Report ───────────────────────────

export type DishStat = { dishId: string; name: string; unit: Unit; cooked: number; leftover: number; pct: number; loss: number };
export type LabelStat = { label: string; dishName: string; times: number; pct: number };
export type DayStat = { date: ISODate; pct: number | null; loss: number };

export type WastageReport = {
  days: number;            // days in range
  daysLogged: number;      // days with at least one entry
  /** Leftover share of what was cooked. ₹-weighted when costs are known, else mean of item %. 0..1 */
  pct: number | null;
  loss: number;            // ₹
  wastedKg: number;        // kg + litre leftovers (count units excluded)
  byDish: DishStat[];      // worst first
  byLabel: LabelStat[];    // worst varieties first (e.g. "Bhindi")
  byDay: DayStat[];
  reasons: { reason: Reason; times: number }[];
};

function pctOf(items: EntryItem[]): number | null {
  const costed = items.filter((i) => i.costPerUnit && i.cooked > 0);
  if (costed.length > 0) {
    const cooked = costed.reduce((s, i) => s + i.cooked * i.costPerUnit!, 0);
    const left = costed.reduce((s, i) => s + i.leftover * i.costPerUnit!, 0);
    return cooked > 0 ? left / cooked : null;
  }
  const plain = items.filter((i) => i.cooked > 0);
  return plain.length ? plain.reduce((s, i) => s + i.leftover / i.cooked, 0) / plain.length : null;
}

export function wastageReport(entries: Entry[], dishes: DishInfo[], dayList: ISODate[]): WastageReport {
  const dish = new Map(dishes.map((d) => [d.id, d]));
  const inRange = new Set(dayList);
  const list = entries.filter((e) => inRange.has(e.date));
  const items = list.flatMap((e) => e.items);

  const byDish = new Map<string, DishStat>();
  const byLabel = new Map<string, { label: string; dishName: string; times: number; cooked: number; leftover: number }>();
  let loss = 0;
  let wastedKg = 0;
  for (const it of items) {
    const d = dish.get(it.dishId);
    if (!d) continue;
    const s = byDish.get(d.id) ?? { dishId: d.id, name: d.name, unit: d.unit, cooked: 0, leftover: 0, pct: 0, loss: 0 };
    s.cooked += it.cooked;
    s.leftover += it.leftover;
    const l = it.leftover * (it.costPerUnit ?? 0);
    s.loss += l;
    loss += l;
    if (d.unit !== "count") wastedKg += it.leftover;
    byDish.set(d.id, s);
    if (it.label) {
      const key = `${d.id}|${it.label.trim().toLowerCase()}`;
      const b = byLabel.get(key) ?? { label: it.label.trim(), dishName: d.name, times: 0, cooked: 0, leftover: 0 };
      b.times += 1;
      b.cooked += it.cooked;
      b.leftover += it.leftover;
      byLabel.set(key, b);
    }
  }
  for (const s of byDish.values()) {
    s.pct = s.cooked > 0 ? s.leftover / s.cooked : 0;
    s.cooked = r2(s.cooked);
    s.leftover = r2(s.leftover);
    s.loss = Math.round(s.loss);
  }

  const reasonCount = new Map<Reason, number>();
  for (const e of list) if (e.reason !== "none") reasonCount.set(e.reason, (reasonCount.get(e.reason) ?? 0) + 1);

  return {
    days: dayList.length,
    daysLogged: new Set(list.map((e) => e.date)).size,
    pct: pctOf(items),
    loss: Math.round(loss),
    wastedKg: r1(wastedKg),
    byDish: [...byDish.values()].sort((a, b) => b.loss - a.loss || b.pct - a.pct),
    byLabel: [...byLabel.values()]
      .filter((b) => b.cooked > 0)
      .map((b) => ({ label: b.label, dishName: b.dishName, times: b.times, pct: b.leftover / b.cooked }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 5),
    byDay: dayList.map((date) => {
      const its = list.filter((e) => e.date === date).flatMap((e) => e.items);
      return { date, pct: its.length ? pctOf(its) : null, loss: Math.round(its.reduce((s, i) => s + i.leftover * (i.costPerUnit ?? 0), 0)) };
    }),
    reasons: [...reasonCount].map(([reason, times]) => ({ reason, times })).sort((a, b) => b.times - a.times),
  };
}

// ─────────────────────── Cooking suggestion ───────────────────────

export type Confidence = "learning" | "medium" | "good";
export type Suggestion = {
  dishId: string;
  name: string;
  unit: Unit;
  qty: number;            // what to cook
  perTiffin: number;      // learned (or default) eaten per tiffin
  bufferPct: number;      // safety margin applied, 0..1
  samples: number;        // past entries used
  confidence: Confidence;
};

const MIN_SAMPLES = 3;
const BUFFER_MIN = 0.03;
const BUFFER_MAX = 0.15;
const BUFFER_DEFAULT = 0.1;

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function roundQty(n: number, unit: Unit): number {
  if (n <= 0) return 0;
  if (unit === "count") return Math.ceil(n);
  if (n >= 10) return Math.ceil(n * 2) / 2; // 0.5 steps for big pots
  return Math.ceil(n * 10) / 10;
}

/**
 * How much of each dish to cook for `tiffins`.
 * perTiffin = median of what was actually eaten per tiffin ((cooked - leftover) / tiffins)
 * on past entries for the same meal; falls back to the dish default until
 * MIN_SAMPLES entries exist. Buffer = how much that varies (coefficient of
 * variation), clamped to 3–15%.
 */
export function suggestCooking(tiffins: number, meal: MealName, dishes: DishInfo[], history: Entry[]): Suggestion[] {
  return dishes.map((d) => {
    const rates = history
      .filter((e) => e.meal === meal && e.tiffins > 0)
      .flatMap((e) => e.items.filter((i) => i.dishId === d.id && i.cooked > 0).map((i) => (i.cooked - i.leftover) / e.tiffins));
    const samples = rates.length;
    let perTiffin = d.perTiffin;
    let bufferPct = BUFFER_DEFAULT;
    if (samples >= MIN_SAMPLES) {
      perTiffin = median(rates);
      const mean = rates.reduce((s, x) => s + x, 0) / samples;
      const sd = Math.sqrt(rates.reduce((s, x) => s + (x - mean) ** 2, 0) / samples);
      bufferPct = Math.min(BUFFER_MAX, Math.max(BUFFER_MIN, mean > 0 ? sd / mean : BUFFER_DEFAULT));
    }
    return {
      dishId: d.id,
      name: d.name,
      unit: d.unit,
      qty: roundQty(tiffins * perTiffin * (1 + bufferPct), d.unit),
      perTiffin: Math.round(perTiffin * 1000) / 1000,
      bufferPct: r2(bufferPct),
      samples,
      confidence: samples < MIN_SAMPLES ? "learning" : samples < 10 ? "medium" : "good",
    };
  });
}

export type NewDish = Omit<DishInfo, "id"> & { variety: boolean };

export const DEFAULT_DISHES: NewDish[] = [
  { name: "Dal", unit: "kg", perTiffin: 0.06, costPerUnit: 120, variety: true },
  { name: "Chawal", unit: "kg", perTiffin: 0.08, costPerUnit: 50, variety: false },
  { name: "Sabzi", unit: "kg", perTiffin: 0.15, costPerUnit: 40, variety: true },
  { name: "Roti", unit: "count", perTiffin: 4, costPerUnit: 2, variety: false },
];

// Pure meal-scheduling and billing logic. No database access here, so it is
// unit-tested directly (schedule.test.ts) and shared by every screen.
import { eachDay, monthEnd, monthStart, type ISODate } from "./dates.ts";

export type MealName = "lunch" | "dinner";
export type PlanMeals = MealName | "both";

export type SchedCustomer = {
  id: string;
  startDate: ISODate;
  endDate: ISODate | null;
  meals: PlanMeals | null; // null = no plan assigned
  pricePerMeal: number;
};

export type ScheduledMeal = { customerId: string; date: ISODate; meal: MealName };

export const skipKey = (customerId: string, date: ISODate, meal: MealName) =>
  `${customerId}|${date}|${meal}`;

export function mealsOf(plan: PlanMeals | null): MealName[] {
  if (plan === "both") return ["lunch", "dinner"];
  return plan ? [plan] : [];
}

/**
 * Every meal a customer should receive between two dates (inclusive):
 * inside their start/end dates, has a plan, not a holiday, not skipped.
 */
export function scheduledMeals(
  customers: SchedCustomer[],
  from: ISODate,
  to: ISODate,
  holidays: ReadonlySet<ISODate>,
  skips: ReadonlySet<string>,
): ScheduledMeal[] {
  const out: ScheduledMeal[] = [];
  for (const c of customers) {
    const meals = mealsOf(c.meals);
    if (meals.length === 0) continue;
    const start = c.startDate > from ? c.startDate : from;
    const end = c.endDate && c.endDate < to ? c.endDate : to;
    if (start > end) continue;
    for (const date of eachDay(start, end)) {
      if (holidays.has(date)) continue;
      for (const meal of meals) {
        if (!skips.has(skipKey(c.id, date, meal))) out.push({ customerId: c.id, date, meal });
      }
    }
  }
  return out;
}

export type Bill = {
  customerId: string;
  monthMeals: number;
  monthAmount: number;
  totalCharged: number;
  totalPaid: number;
  monthPaid: number;
  /** Charged up to `asOf` minus paid. > 0 = customer owes; < 0 = advance. */
  balance: number;
};

export type PaymentRow = { customerId: string; amount: number; paidOn: ISODate };

const money = (n: number) => Math.round(n * 100) / 100;

/**
 * Bill for the whole month containing `month` (monthMeals/monthAmount, includes
 * upcoming days), plus a running balance: meals served from the customer's
 * start date up to min(asOf, month end), × price, minus payments made by then.
 */
export function billing(
  customers: SchedCustomer[],
  month: ISODate,
  holidays: ReadonlySet<ISODate>,
  skips: ReadonlySet<string>,
  payments: PaymentRow[],
  asOf?: ISODate,
): Bill[] {
  const mStart = monthStart(month);
  const mEnd = monthEnd(month);
  const upto = asOf && asOf < mEnd ? asOf : mEnd;
  const bills = new Map<string, Bill>();
  for (const c of customers) {
    if (c.startDate > mEnd) continue;
    bills.set(c.id, { customerId: c.id, monthMeals: 0, monthAmount: 0, totalCharged: 0, totalPaid: 0, monthPaid: 0, balance: 0 });
  }
  const price = new Map(customers.map((c) => [c.id, c.pricePerMeal]));
  const earliest = customers.reduce<ISODate | null>((m, c) => (m === null || c.startDate < m ? c.startDate : m), null);
  if (earliest) {
    for (const s of scheduledMeals(customers, earliest, mEnd, holidays, skips)) {
      const b = bills.get(s.customerId);
      if (!b) continue;
      const p = price.get(s.customerId) ?? 0;
      if (s.date <= upto) b.totalCharged += p;
      if (s.date >= mStart) {
        b.monthMeals += 1;
        b.monthAmount += p;
      }
    }
  }
  for (const pay of payments) {
    const b = bills.get(pay.customerId);
    if (!b || pay.paidOn > mEnd) continue; // payments made later don't count for this month
    b.totalPaid += pay.amount;
    if (pay.paidOn >= mStart) b.monthPaid += pay.amount;
  }
  for (const b of bills.values()) {
    b.monthAmount = money(b.monthAmount);
    b.totalCharged = money(b.totalCharged);
    b.totalPaid = money(b.totalPaid);
    b.monthPaid = money(b.monthPaid);
    b.balance = money(b.totalCharged - b.totalPaid);
  }
  return [...bills.values()];
}

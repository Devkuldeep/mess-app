// Calendar dates are plain "YYYY-MM-DD" strings everywhere in the app.
// Postgres DATE columns come back from Prisma as JS Dates at UTC midnight;
// convert at the boundary with toDbDate / fromDbDate.

export type ISODate = string;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function toDbDate(s: ISODate): Date {
  return new Date(`${s}T00:00:00Z`);
}

export function fromDbDate(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = toDbDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fromDbDate(d);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((toDbDate(a).getTime() - toDbDate(b).getTime()) / 86_400_000);
}

/** Local date and hour in a timezone, e.g. { date: "2026-11-26", hour: 21 }. */
export function localNow(tz: string, now: Date = new Date()): { date: ISODate; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) };
}

export function todayIn(tz: string, now?: Date): ISODate {
  return localNow(tz, now).date;
}

/** A meal on `date` can be changed until (date - 1) at `cutoffHour`, local time. */
export function isSkipLocked(date: ISODate, cutoffHour: number, tz: string, now?: Date): boolean {
  const { date: today, hour } = localNow(tz, now);
  const dayBefore = addDays(date, -1);
  if (today > dayBefore) return true;
  if (today < dayBefore) return false;
  return hour >= cutoffHour;
}

export function monthStart(s: ISODate): ISODate {
  return `${s.slice(0, 7)}-01`;
}

export function monthEnd(s: ISODate): ISODate {
  const [y, m] = s.split("-").map(Number);
  return fromDbDate(new Date(Date.UTC(y, m, 0)));
}

export function addMonths(s: ISODate, n: number): ISODate {
  const [y, m] = s.split("-").map(Number);
  return fromDbDate(new Date(Date.UTC(y, m - 1 + n, 1)));
}

export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

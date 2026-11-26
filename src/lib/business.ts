// ┌──────────────────────────────────────────────────────────────────────┐
// │  FILL THIS IN BEFORE LAUNCH. Every legal/public page reads from here. │
// │  Anything still in [SQUARE BRACKETS] is a placeholder:                │
// │    npm run check:legal   → lists what's left                          │
// │  Have a lawyer review /privacy, /terms and /refund once filled.       │
// └──────────────────────────────────────────────────────────────────────┘

export const BUSINESS = {
  appName: "Mess Manager",

  // Who runs the service (shown as the "Company"/"we" in the policies)
  legalName: "[BUSINESS LEGAL NAME]",
  entityType: "[sole proprietorship / partnership firm / private limited company]",
  address: "[FULL ADDRESS, CITY, STATE – PIN CODE]",
  /** Courts of this city have jurisdiction (Terms → Governing law). */
  jurisdictionCity: "[CITY]",
  state: "[STATE]",
  /** Optional. Leave "" if not registered. */
  gstin: "",

  // Contact
  supportEmail: "[support@yourdomain.in]",
  supportPhone: "[+91 XXXXX XXXXX]",
  supportHours: "[Mon–Sat, 10:00 AM – 7:00 PM IST]",
  domain: "[yourdomain.in]",

  // DPDP Act 2023 – Grievance Officer (can be you)
  grievanceOfficerName: "[GRIEVANCE OFFICER NAME]",
  grievanceEmail: "[grievance@yourdomain.in]",
  /** Days to resolve a grievance. Check the current DPDP Rules for the maximum. */
  grievanceResponseDays: "[30]",

  // Data handling
  hostingProvider: "[HOSTING PROVIDER, e.g. Vercel / AWS Mumbai]",
  databaseProvider: "[DATABASE PROVIDER, e.g. Neon / AWS RDS]",
  dataRegion: "[India / other region]",
  /** Days we keep an org's data after the account is closed, before deleting it. */
  retentionDaysAfterClose: "[90]",

  // Billing & refunds (also see PLANS below)
  trialDays: "14",
  /** Working days to process an approved refund. */
  refundProcessingDays: "[7]",
  /** Grace period after a failed renewal before the account is limited. */
  graceDays: "[7]",

  /** Date these policies take effect (shown as "Last updated"). */
  effectiveDate: "[DD Month YYYY]",
} as const;

/** Bump when Terms/Privacy change materially; new signups record this version. */
export const TERMS_VERSION = "2026-11-26";

export type Plan = { name: string; price: string; period: string; customers: string; features: string[]; highlight?: boolean };

// From docs/init-2.md. Prices are placeholders — decide after talking to 5–10 mess owners.
export const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "[₹299]",
    period: "/month",
    customers: "[Up to 30 customers]",
    features: ["Daily cooking count", "Delivery checklist (works offline)", "Payments & WhatsApp reminders", "Customer skip link", "Data export"],
  },
  {
    name: "Growth",
    price: "[₹599]",
    period: "/month",
    customers: "[Up to 100 customers]",
    features: ["Everything in Starter", "Staff & delivery logins", "Wastage tracking & cooking suggestions"],
    highlight: true,
  },
  {
    name: "Pro",
    price: "[₹999]",
    period: "/month",
    customers: "[Unlimited customers]",
    features: ["Everything in Growth", "[Priority support]", "[Features coming: custom domain, advanced reports]"],
  },
];

const PLACEHOLDER = /\[[^\]]+\]/;

/** Every field that still contains a [PLACEHOLDER], as "path: value". */
export function findPlaceholders(): string[] {
  const out: string[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string") {
      if (PLACEHOLDER.test(v)) out.push(`${path}: ${v}`);
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  walk(BUSINESS, "BUSINESS");
  walk(PLANS, "PLANS");
  return out;
}

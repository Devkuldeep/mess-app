// Form validation shared by Server Actions (and usable in the browser).
// Error messages are i18n keys (src/lib/i18n.ts), so the UI shows them in
// Hindi or English. A Server Action returns `FormState`; <ActionForm> puts each
// field's error under that field and refills what the user typed.
import * as z from "zod";
import { isISODate } from "./dates.ts";
import { dictionaries, type Dict } from "./i18n.ts";
import { normalizePhone, UPI_RE } from "./links.ts";
import { isUuid } from "./sync.ts";

export type ErrorKey = keyof Dict;

export type FormState =
  | {
      /** Whole-form error (e.g. wrong login), shown above the submit button. */
      error?: ErrorKey;
      /** Per-field errors, keyed by input `name`. */
      fieldErrors?: Partial<Record<string, ErrorKey>>;
      /** What the user submitted, so the form can be refilled after an error. Never contains passwords. */
      values?: Record<string, string>;
      ok?: boolean;
    }
  | undefined;

const err = (k: ErrorKey) => ({ error: k });
const isErrorKey = (s: string): s is ErrorKey => s in dictionaries.en;

/** Fields never echoed back to the browser. */
const SECRET_FIELDS = new Set(["password", "newPassword", "currentPassword"]);
/** By convention, names ending in Secret/Token/Pin (FormSensitiveInput) aren't echoed either. */
const SECRET_SUFFIX = /(Secret|Token|Pin)$/;
export const isSecretField = (name: string) => SECRET_FIELDS.has(name) || SECRET_SUFFIX.test(name);

// ───────────── field builders ─────────────

export const f = {
  requiredText: (min: number, max: number, key: ErrorKey) => z.string().trim().min(min, err(key)).max(max, err("tooLong")),
  optionalText: (max: number) => z.string().trim().max(max, err("tooLong")).transform((v) => v || null),
  phone: () => z.string().trim().refine((v) => !!normalizePhone(v), err("invalidPhone")).transform((v) => normalizePhone(v)!),
  optionalPhone: () =>
    z.string().trim().refine((v) => v === "" || !!normalizePhone(v), err("invalidPhone")).transform((v) => (v ? normalizePhone(v)! : null)),
  date: () => z.string().refine((v) => isISODate(v), err("invalidDate")),
  intIn: (min: number, max: number, key: ErrorKey) =>
    z.string().trim().min(1, err(key)).transform(Number).pipe(z.number(err(key)).int(err(key)).min(min, err(key)).max(max, err(key))),
};

// ───────────── schemas ─────────────

export const signupSchema = z.object({
  name: f.requiredText(1, 80, "nameRequired"),
  phone: f.phone(),
  password: z.string().min(8, err("passwordShort")).max(200, err("tooLong")),
  consent: z.literal("on", err("consentRequired")),
});

export const loginSchema = z.object({
  phone: z.string().trim().min(1, err("phoneRequired")),
  password: z.string().min(1, err("passwordRequired")),
});

export const orgSetupSchema = z.object({
  name: f.requiredText(2, 80, "messNameInvalid"),
  slug: z.string().trim().max(40, err("tooLong")),
});

export const orgSettingsSchema = z.object({
  name: f.requiredText(2, 80, "messNameInvalid"),
  phone: f.optionalPhone(),
  upiId: z.string().trim().refine((v) => v === "" || UPI_RE.test(v), err("upiInvalid")).transform((v) => v || null),
  skipCutoffHour: f.intIn(0, 23, "invalidValue"),
  wastageTargetPct: f.intIn(1, 50, "targetInvalid"),
});

export const customerSchema = z.object({
  name: f.requiredText(1, 80, "nameRequired"),
  phone: f.optionalPhone(),
  address: f.optionalText(300),
  area: f.optionalText(60),
  notes: f.optionalText(300),
  diet: z.string().transform((v) => (v === "nonveg" ? ("nonveg" as const) : ("veg" as const))),
  planId: z.string().refine((v) => v === "" || isUuid(v), err("planInvalid")).transform((v) => v || null),
  startDate: f.date(),
});

// ───────────── parsing ─────────────

type ParseResult<S extends z.ZodObject> = { ok: true; data: z.output<S> } | { ok: false; state: NonNullable<FormState> };

/**
 * Read the schema's fields from FormData (missing → ""), validate, and either
 * return typed data or a FormState with one error per field + echoed values.
 */
export function parseForm<S extends z.ZodObject>(schema: S, fd: FormData): ParseResult<S> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(schema.shape)) {
    const v = fd.get(key);
    raw[key] = typeof v === "string" ? v : "";
  }
  const r = schema.safeParse(raw);
  if (r.success) return { ok: true, data: r.data };
  const fieldErrors: Partial<Record<string, ErrorKey>> = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = isErrorKey(issue.message) ? issue.message : "invalidValue";
  }
  return { ok: false, state: { fieldErrors, values: echo(raw) } };
}

/** A FormState for one field (e.g. "phone number already registered" from the DB). */
export function fieldError(field: string, key: ErrorKey, fd: FormData): NonNullable<FormState> {
  const raw: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) raw[k] = v;
  return { fieldErrors: { [field]: key }, values: echo(raw) };
}

function echo(raw: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(raw).filter(([k]) => !isSecretField(k)));
}

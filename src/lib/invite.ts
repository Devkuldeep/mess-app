// Staff invites: pure helpers (no DB), shared by the server and tests.
/** Same values as the Prisma `Role` enum (kept local so src/lib has no generated imports). */
export type Role = "owner" | "manager" | "delivery";

export const INVITE_DAYS = 7;
/** Roles an owner can invite or switch to. Owners are never created by invite. */
export const STAFF_ROLES = ["manager", "delivery"] as const satisfies readonly Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];

export const isStaffRole = (v: unknown): v is StaffRole => v === "manager" || v === "delivery";

export function inviteExpiry(now: Date, days = INVITE_DAYS): Date {
  return new Date(now.getTime() + days * 86_400_000);
}

export const isInviteExpired = (expiresAt: Date, now: Date) => expiresAt.getTime() <= now.getTime();

/** Looks like a token we issued (base64url, 32 chars) — cheap check before a DB lookup. */
export const isInviteToken = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{32}$/.test(v);

/** "98•••••210" — enough for the invitee to recognise their number on a shared screen. */
export function maskPhone(phone: string): string {
  return phone.length < 6 ? phone : `${phone.slice(0, 2)}•••••${phone.slice(-3)}`;
}

/** Where a member lands after joining: delivery staff only have the delivery list. */
export const homeFor = (role: Role) => (role === "delivery" ? "/delivery" : "/today");

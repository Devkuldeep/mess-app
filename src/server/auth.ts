// Sessions + tenant context (the Data Access Layer entry point).
//
// Rule: every query on tenant data uses `ctx.orgId` from requireMember().
// Never trust an orgId coming from a form, URL or request body.
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "mess_session";
const SESSION_DAYS = 60;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; name: string; phone: string };

/** Current user or null. Deduplicated per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, name: true, phone: true } } },
  });
  if (!s || s.expiresAt < new Date()) return null;
  return s.user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export type OrgCtx = {
  user: SessionUser;
  orgId: string;
  role: Role;
  org: { id: string; name: string; slug: string; phone: string | null; upiId: string | null; brandColor: string; skipCutoffHour: number; timezone: string; wastageTargetPct: number };
};

/** Signed-in member of an org. Redirects to /login or /onboarding otherwise. */
export const getMember = cache(async (): Promise<OrgCtx | null> => {
  const user = await getUser();
  if (!user) return null;
  // MVP: one org per user (first membership). Org switcher comes later.
  const m = await db.member.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { org: true },
  });
  if (!m) return null;
  const { org } = m;
  return {
    user,
    orgId: org.id,
    role: m.role,
    org: {
      id: org.id, name: org.name, slug: org.slug, phone: org.phone, upiId: org.upiId,
      brandColor: org.brandColor, skipCutoffHour: org.skipCutoffHour, timezone: org.timezone, wastageTargetPct: org.wastageTargetPct,
    },
  };
});

export async function requireMember(roles?: Role[]): Promise<OrgCtx> {
  const user = await requireUser();
  const ctx = await getMember();
  if (!ctx || ctx.user.id !== user.id) redirect("/onboarding");
  if (roles && !roles.includes(ctx.role)) redirect("/delivery"); // every role can open /delivery
  return ctx;
}

/** Owner or manager. */
export const requireStaff = () => requireMember(["owner", "manager"]);

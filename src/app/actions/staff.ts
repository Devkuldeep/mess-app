"use server";
// Staff invites and team management. Owner-only, except joinWithInvite (the
// invitee, authenticated by the invite token + their phone's password).
import { randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { createSession, getUser, requireMember } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import { Prisma } from "@/generated/prisma/client";
import { TERMS_VERSION } from "@/lib/business";
import { homeFor, inviteExpiry, isInviteExpired, isInviteToken, isStaffRole } from "@/lib/invite";
import { isUuid } from "@/lib/sync";
import { fieldError, inviteSchema, joinLoginSchema, joinSignupSchema, parseForm, type FormState } from "@/lib/validation";

const owner = () => requireMember(["owner"]);

// ───────────── owner side ─────────────

export async function createInvite(fd: FormData): Promise<FormState> {
  const ctx = await owner();
  const p = parseForm(inviteSchema, fd);
  if (!p.ok) return p.state;
  const { name, phone, role } = p.data;
  if (phone === ctx.user.phone) return fieldError("phone", "ownerPhone", fd);
  const member = await db.member.findFirst({ where: { orgId: ctx.orgId, user: { phone } }, select: { userId: true } });
  if (member) return fieldError("phone", "alreadyStaff", fd);

  // Re-inviting the same phone replaces the old link (new token, new expiry).
  const data = { name, role, token: randomBytes(24).toString("base64url"), createdBy: ctx.user.id, expiresAt: inviteExpiry(new Date()) };
  await db.invite.upsert({
    where: { orgId_phone: { orgId: ctx.orgId, phone } },
    create: { orgId: ctx.orgId, phone, ...data },
    update: data,
  });
  refresh();
  return { ok: true };
}

export async function cancelInvite(fd: FormData) {
  const ctx = await owner();
  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return;
  await db.invite.deleteMany({ where: { id, orgId: ctx.orgId } });
  refresh();
}

export async function changeRole(fd: FormData) {
  const ctx = await owner();
  const userId = String(fd.get("userId") ?? "");
  const role = fd.get("role");
  if (!isUuid(userId) || !isStaffRole(role)) return;
  // Owners (including yourself) can't be changed here.
  await db.member.updateMany({ where: { orgId: ctx.orgId, userId, role: { not: "owner" } }, data: { role } });
  refresh();
}

export async function removeMember(fd: FormData) {
  const ctx = await owner();
  const userId = String(fd.get("userId") ?? "");
  if (!isUuid(userId) || userId === ctx.user.id) return;
  const { count } = await db.member.deleteMany({ where: { orgId: ctx.orgId, userId, role: { not: "owner" } } });
  // Sign them out everywhere if this was their only mess (shared phones: don't leave a live session).
  if (count && (await db.member.count({ where: { userId } })) === 0) {
    await db.session.deleteMany({ where: { userId } });
  }
  refresh();
}

// ───────────── invitee side (/join/<token>) ─────────────

/**
 * One action for the three join cases (field `mode`):
 *  - "session": already signed in with the invited phone → just join
 *  - "login":   the phone has an account → check its password, sign in, join
 *  - "signup":  new account for the invited phone (name, password, consent)
 */
export async function joinWithInvite(_: FormState, fd: FormData): Promise<FormState> {
  const token = fd.get("inviteToken");
  if (!isInviteToken(token)) return { error: "inviteInvalid" };
  const invite = await db.invite.findUnique({ where: { token } });
  if (!invite || isInviteExpired(invite.expiresAt, new Date())) return { error: "inviteInvalid" };

  const mode = fd.get("mode");
  let userId: string;
  let newSession = true;

  if (mode === "session") {
    const user = await getUser();
    if (!user || user.phone !== invite.phone) return { error: "inviteWrongUser" };
    userId = user.id;
    newSession = false;
  } else if (mode === "login") {
    const p = parseForm(joinLoginSchema, fd);
    if (!p.ok) return p.state;
    const user = await db.user.findUnique({ where: { phone: invite.phone } });
    if (!user || !(await verifyPassword(p.data.password, user.passwordHash))) return { fieldErrors: { password: "invalidLogin" } };
    userId = user.id;
  } else if (mode === "signup") {
    const p = parseForm(joinSignupSchema, fd);
    if (!p.ok) return p.state;
    try {
      const user = await db.user.create({
        data: {
          name: p.data.name, phone: invite.phone, passwordHash: await hashPassword(p.data.password),
          termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION,
        },
      });
      userId = user.id;
    } catch (e) {
      // Someone created an account for this phone meanwhile → ask for the password instead.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "joinExisting" };
      throw e;
    }
  } else {
    return { error: "invalidValue" };
  }

  // MVP: one mess per account (getMember uses the first membership).
  const existing = await db.member.findFirst({ where: { userId }, select: { orgId: true } });
  if (existing && existing.orgId !== invite.orgId) return { error: "inviteOtherMess" };

  if (!existing) {
    const ok = await db.$transaction(async (tx) => {
      // Deleting first makes the invite single-use even if two taps race.
      const { count } = await tx.invite.deleteMany({ where: { id: invite.id } });
      if (!count) return false;
      await tx.member.create({ data: { orgId: invite.orgId, userId, role: invite.role } });
      return true;
    });
    if (!ok) return { error: "inviteInvalid" };
  } else {
    await db.invite.deleteMany({ where: { id: invite.id } });
  }

  if (newSession) await createSession(userId);
  redirect(homeFor(invite.role));
}

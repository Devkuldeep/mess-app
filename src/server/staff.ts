// Staff (members + pending invites) — org-scoped reads.
// Invite tokens are secrets: only the owner's staff screen and the /join page see them.
import "server-only";
import { db } from "./db";
import type { OrgCtx } from "./auth";

export async function listStaff(ctx: OrgCtx) {
  const [members, invites] = await Promise.all([
    db.member.findMany({
      where: { orgId: ctx.orgId },
      include: { user: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.invite.findMany({ where: { orgId: ctx.orgId }, orderBy: { createdAt: "desc" } }),
  ]);
  return {
    members: members.map((m) => ({ userId: m.userId, name: m.user.name, phone: m.user.phone, role: m.role, joinedAt: m.createdAt })),
    invites: invites.map((i) => ({ id: i.id, name: i.name, phone: i.phone, role: i.role, token: i.token, expiresAt: i.expiresAt })),
  };
}

export async function countStaff(orgId: string) {
  return db.member.count({ where: { orgId, role: { not: "owner" } } });
}

/** Public lookup for /join/<token>. Returns only what the join page needs. */
export async function getInvite(token: string) {
  const i = await db.invite.findUnique({
    where: { token },
    include: { org: { select: { name: true } } },
  });
  if (!i) return null;
  const account = await db.user.findUnique({ where: { phone: i.phone }, select: { id: true } });
  return { id: i.id, orgId: i.orgId, orgName: i.org.name, name: i.name, phone: i.phone, role: i.role, expiresAt: i.expiresAt, hasAccount: !!account };
}

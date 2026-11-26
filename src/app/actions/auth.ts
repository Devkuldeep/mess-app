"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { createSession, destroySession, requireUser } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import { normalizePhone, SLUG_RE, slugify } from "@/lib/links";
import { isLang, LANG_COOKIE, type Dict } from "@/lib/i18n";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_DISHES } from "@/lib/wastage";
import { TERMS_VERSION } from "@/lib/business";

export type FormState = { error?: keyof Dict; ok?: boolean } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name").slice(0, 80);
  const phone = normalizePhone(str(fd, "phone"));
  const password = String(fd.get("password") ?? "");
  if (!phone) return { error: "invalidPhone" };
  if (password.length < 8) return { error: "passwordShort" };
  if (fd.get("consent") !== "on") return { error: "consentRequired" };
  try {
    const user = await db.user.create({
      data: {
        name: name || phone, phone, passwordHash: await hashPassword(password),
        termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION, // DPDP consent record
      },
    });
    await createSession(user.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "phoneTaken" };
    throw e;
  }
  redirect("/onboarding");
}

// Same response time whether or not the phone exists.
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const phone = normalizePhone(str(fd, "phone"));
  const password = String(fd.get("password") ?? "");
  const user = phone ? await db.user.findUnique({ where: { phone } }) : null;
  const ok = await verifyPassword(password, user?.passwordHash ?? (await DUMMY_HASH));
  if (!user || !ok) return { error: "invalidLogin" };
  await createSession(user.id);
  redirect("/today");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function createOrg(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = str(fd, "name").slice(0, 80);
  const slug = slugify(str(fd, "slug") || name);
  if (name.length < 2) return { error: "messName" };
  if (!SLUG_RE.test(slug)) return { error: "messLinkHint" };
  try {
    await db.$transaction(async (tx) => {
      const org = await tx.org.create({ data: { name, slug, phone: user.phone } });
      await tx.member.create({ data: { orgId: org.id, userId: user.id, role: "owner" } });
      await tx.plan.createMany({
        data: [
          { orgId: org.id, name: "Lunch + Dinner", meals: "both", pricePerMeal: 60 },
          { orgId: org.id, name: "Lunch", meals: "lunch", pricePerMeal: 70 },
          { orgId: org.id, name: "Dinner", meals: "dinner", pricePerMeal: 70 },
        ],
      });
      await tx.dish.createMany({
        data: DEFAULT_DISHES.map((d, i) => ({ orgId: org.id, name: d.name, unit: d.unit, perTiffin: d.perTiffin, costPerUnit: d.costPerUnit, variety: d.variety, sortOrder: i })),
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "slugTaken" };
    throw e;
  }
  redirect("/today");
}

export async function setLang(fd: FormData) {
  const lang = fd.get("lang");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

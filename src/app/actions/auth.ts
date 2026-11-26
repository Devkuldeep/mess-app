"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/server/db";
import { createSession, destroySession, requireUser } from "@/server/auth";
import { hashPassword, verifyPassword } from "@/server/password";
import { normalizePhone, SLUG_RE, slugify } from "@/lib/links";
import { isLang, LANG_COOKIE } from "@/lib/i18n";
import { fieldError, loginSchema, orgSetupSchema, parseForm, signupSchema, type FormState } from "@/lib/validation";
import { Prisma } from "@/generated/prisma/client";
import { DEFAULT_DISHES } from "@/lib/wastage";
import { TERMS_VERSION } from "@/lib/business";

export type { FormState } from "@/lib/validation";

export async function signup(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(signupSchema, fd);
  if (!parsed.ok) return parsed.state;
  const { name, phone, password } = parsed.data;
  try {
    const user = await db.user.create({
      data: {
        name, phone, passwordHash: await hashPassword(password),
        termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION, // DPDP consent record
      },
    });
    await createSession(user.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fieldError("phone", "phoneTaken", fd);
    throw e;
  }
  redirect("/onboarding");
}

// Same response time whether or not the phone exists.
const DUMMY_HASH = hashPassword("dummy-password-for-timing");

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = parseForm(loginSchema, fd);
  if (!parsed.ok) return parsed.state;
  const phone = normalizePhone(parsed.data.phone);
  const user = phone ? await db.user.findUnique({ where: { phone } }) : null;
  const ok = await verifyPassword(parsed.data.password, user?.passwordHash ?? (await DUMMY_HASH));
  // Don't say which one was wrong (phone or password); keep the phone filled in.
  if (!user || !ok) return { error: "invalidLogin", values: { phone: parsed.data.phone } };
  await createSession(user.id);
  redirect("/today");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function createOrg(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseForm(orgSetupSchema, fd);
  if (!parsed.ok) return parsed.state;
  const { name } = parsed.data;
  const slug = slugify(parsed.data.slug || name);
  if (!SLUG_RE.test(slug)) return fieldError("slug", "slugInvalid", fd);
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
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return fieldError("slug", "slugTaken", fd);
    throw e;
  }
  redirect("/today");
}

export async function setLang(fd: FormData) {
  const lang = fd.get("lang");
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}

"use server";
import { refresh } from "next/cache";
import { db } from "@/server/db";
import { requireMember } from "@/server/auth";
import { isISODate, toDbDate } from "@/lib/dates";
import { isUuid } from "@/lib/sync";
import { orgSettingsSchema, parseForm, type FormState } from "@/lib/validation";

const s = (fd: FormData, k: string, max: number) => String(fd.get(k) ?? "").trim().slice(0, max);
const owner = () => requireMember(["owner"]);
const staff = () => requireMember(["owner", "manager"]);

export async function updateOrg(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await owner();
  const parsed = parseForm(orgSettingsSchema, fd);
  if (!parsed.ok) return parsed.state;
  await db.org.update({ where: { id: ctx.orgId }, data: parsed.data });
  refresh();
  return { ok: true };
}

export async function savePlan(fd: FormData) {
  const ctx = await staff();
  const id = String(fd.get("id") ?? "");
  const name = s(fd, "name", 60);
  const price = Number(fd.get("pricePerMeal"));
  const meals = fd.get("meals");
  if (!name || !(price >= 0 && price < 100000)) return;
  if (id) {
    if (!isUuid(id)) return;
    await db.plan.updateMany({ where: { id, orgId: ctx.orgId }, data: { name, pricePerMeal: price } });
  } else {
    if (meals !== "lunch" && meals !== "dinner" && meals !== "both") return;
    await db.plan.create({ data: { orgId: ctx.orgId, name, meals, pricePerMeal: price } });
  }
  refresh();
}

export async function deletePlan(fd: FormData) {
  const ctx = await staff();
  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return;
  if ((await db.customer.count({ where: { orgId: ctx.orgId, planId: id } })) > 0) return; // in use
  await db.plan.deleteMany({ where: { id, orgId: ctx.orgId } });
  refresh();
}

export async function addHoliday(fd: FormData) {
  const ctx = await staff();
  const date = String(fd.get("date") ?? "");
  if (!isISODate(date)) return;
  const reason = s(fd, "reason", 100) || null;
  await db.holiday.upsert({
    where: { orgId_date: { orgId: ctx.orgId, date: toDbDate(date) } },
    create: { orgId: ctx.orgId, date: toDbDate(date), reason },
    update: { reason },
  });
  refresh();
}

export async function removeHoliday(fd: FormData) {
  const ctx = await staff();
  const date = String(fd.get("date") ?? "");
  if (!isISODate(date)) return;
  await db.holiday.deleteMany({ where: { orgId: ctx.orgId, date: toDbDate(date) } });
  refresh();
}

const UNITS = new Set(["kg", "litre", "count"]);

/** Add or edit a dish. Unit can't change after creation (it would corrupt history). */
export async function saveDish(fd: FormData) {
  const ctx = await staff();
  const id = String(fd.get("id") ?? "");
  const name = s(fd, "name", 40);
  const perTiffin = Number(fd.get("perTiffin"));
  const costRaw = String(fd.get("costPerUnit") ?? "").trim();
  const cost = costRaw === "" ? null : Number(costRaw);
  const variety = fd.get("variety") === "on";
  if (!name || !(perTiffin > 0 && perTiffin < 1000) || (cost !== null && !(cost >= 0 && cost < 100000))) return;
  try {
    if (id) {
      if (!isUuid(id)) return;
      await db.dish.updateMany({ where: { id, orgId: ctx.orgId }, data: { name, perTiffin, costPerUnit: cost, variety } });
    } else {
      const unit = String(fd.get("unit") ?? "");
      if (!UNITS.has(unit)) return;
      // Re-adding a removed dish brings it back (keeps its history and unit).
      const old = await db.dish.findUnique({ where: { orgId_name: { orgId: ctx.orgId, name } } });
      if (old) {
        if (old.archived) await db.dish.update({ where: { id: old.id }, data: { archived: false, perTiffin, costPerUnit: cost, variety } });
        refresh();
        return;
      }
      const max = await db.dish.aggregate({ where: { orgId: ctx.orgId }, _max: { sortOrder: true } });
      await db.dish.create({
        data: { orgId: ctx.orgId, name, unit: unit as "kg" | "litre" | "count", perTiffin, costPerUnit: cost, variety, sortOrder: (max._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch {
    return; // duplicate name
  }
  refresh();
}

/** Remove from the daily entry. Kept in the DB so old reports still work. */
export async function archiveDish(fd: FormData) {
  const ctx = await staff();
  const id = String(fd.get("id") ?? "");
  if (!isUuid(id)) return;
  await db.dish.updateMany({ where: { id, orgId: ctx.orgId }, data: { archived: true } });
  refresh();
}

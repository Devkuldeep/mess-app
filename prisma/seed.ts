// Demo data: `npm run db:seed`. Login: 9876543210 / password123
import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/server/password";
import { addDays, monthStart, toDbDate, todayIn } from "../src/lib/dates";
import { DEFAULT_DISHES } from "../src/lib/wastage";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const phone = "9876543210";
  if (await db.user.findUnique({ where: { phone } })) {
    await seedWastage();
    console.log("Already seeded. Login: 9876543210 / password123");
    return;
  }
  const today = todayIn("Asia/Kolkata");
  const start = monthStart(addDays(monthStart(today), -1)); // first of last month

  const user = await db.user.create({ data: { phone, name: "Ramesh Sharma", passwordHash: await hashPassword("password123") } });
  const org = await db.org.create({ data: { name: "Sharma Tiffin Service", slug: "sharma-tiffin", phone, upiId: "sharmatiffin@okaxis" } });
  await db.member.create({ data: { orgId: org.id, userId: user.id, role: "owner" } });

  const delivery = await db.user.create({ data: { phone: "9876500000", name: "Raju (delivery)", passwordHash: await hashPassword("password123") } });
  await db.member.create({ data: { orgId: org.id, userId: delivery.id, role: "delivery" } });

  const both = await db.plan.create({ data: { orgId: org.id, name: "Lunch + Dinner", meals: "both", pricePerMeal: 60 } });
  const lunch = await db.plan.create({ data: { orgId: org.id, name: "Lunch", meals: "lunch", pricePerMeal: 70 } });
  const dinner = await db.plan.create({ data: { orgId: org.id, name: "Dinner", meals: "dinner", pricePerMeal: 70 } });

  const people = [
    { name: "Aman Verma", phone: "9811111111", area: "Sector 5", address: "PG House 12, Sector 5", plan: both, diet: "veg" },
    { name: "Priya Singh", phone: "9822222222", area: "Sector 5", address: "Flat 3B, Green Apts, Sector 5", plan: lunch, diet: "veg", notes: "No onion, no garlic" },
    { name: "Rahul Gupta", phone: "9833333333", area: "Sector 7", address: "Hostel Block C, Room 214", plan: both, diet: "nonveg" },
    { name: "Neha Joshi", phone: "9844444444", area: "Sector 7", address: "Shanti PG, Sector 7", plan: dinner, diet: "veg", notes: "Less spicy" },
    { name: "Vikram Patel", phone: "9855555555", area: "Civil Lines", address: "Office: 2nd floor, Tech Park", plan: lunch, diet: "nonveg" },
    { name: "Sana Khan", phone: "9866666666", area: "Civil Lines", address: "House 45, Civil Lines", plan: both, diet: "nonveg" },
    { name: "Arjun Mehta", phone: "9877777777", area: "Sector 5", address: "Room 8, Sai PG", plan: both, diet: "veg" },
    { name: "Kavya Rao", phone: "9888888888", area: null, address: "Pickup from mess", plan: lunch, diet: "veg", notes: "Jain food" },
  ] as const;

  const customers = [];
  for (const [i, p] of people.entries()) {
    customers.push(await db.customer.create({
      data: {
        orgId: org.id, name: p.name, phone: p.phone, area: p.area, address: p.address, planId: p.plan.id,
        diet: p.diet, notes: "notes" in p ? p.notes : null,
        startDate: toDbDate(i < 6 ? start : addDays(today, -10)), portalToken: randomBytes(18).toString("base64url"),
      },
    }));
  }

  await db.holiday.create({ data: { orgId: org.id, date: toDbDate(addDays(start, 14)), reason: "Festival" } });
  await db.skip.createMany({
    data: [
      { orgId: org.id, customerId: customers[0].id, date: toDbDate(addDays(today, 1)), meal: "dinner", byCustomer: true },
      { orgId: org.id, customerId: customers[2].id, date: toDbDate(addDays(today, 1)), meal: "lunch", byCustomer: true },
      { orgId: org.id, customerId: customers[1].id, date: toDbDate(addDays(today, -3)), meal: "lunch" },
    ],
  });
  await db.payment.createMany({
    data: customers.slice(0, 5).map((c, i) => ({
      id: randomUUID(), orgId: org.id, customerId: c.id, amount: [3500, 1800, 3600, 1500, 2000][i],
      paidOn: toDbDate(addDays(start, 3)), method: i % 2 ? ("cash" as const) : ("upi" as const),
    })),
  });

  await seedWastage();
  console.log("Seeded. Owner: 9876543210 / password123 · Delivery: 9876500000 / password123");
  console.log(`Customer link example: /c/${customers[0].portalToken}`);
}

/** ~3 weeks of realistic leftovers so the report and suggestions have data. */
async function seedWastage() {
  const org = await db.org.findUniqueOrThrow({ where: { slug: "sharma-tiffin" } });
  if ((await db.wastageEntry.count({ where: { orgId: org.id } })) > 0) return;
  if ((await db.dish.count({ where: { orgId: org.id } })) === 0) {
    await db.dish.createMany({
      data: DEFAULT_DISHES.map((d, i) => ({ orgId: org.id, name: d.name, unit: d.unit, perTiffin: d.perTiffin, costPerUnit: d.costPerUnit, variety: d.variety, sortOrder: i })),
    });
  }
  const dishes = await db.dish.findMany({ where: { orgId: org.id } });
  const today = todayIn(org.timezone);
  const sabzis = ["Bhindi", "Aloo Gobhi", "Paneer", "Lauki", "Rajma", "Mix Veg", "Baingan"];
  const dals = ["Arhar", "Moong", "Chana", "Masoor"];
  let seed = 7;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); // deterministic
  for (let back = 21; back >= 1; back--) {
    const date = addDays(today, -back);
    for (const meal of ["lunch", "dinner"] as const) {
      const tiffins = meal === "lunch" ? 7 : 5;
      const sabzi = sabzis[(back + (meal === "dinner" ? 3 : 0)) % sabzis.length];
      const items = dishes.map((d) => {
        const per = d.perTiffin.toNumber();
        const cooked = d.unit === "count" ? Math.ceil(tiffins * per * 1.25) : Math.round(tiffins * per * 1.3 * 10) / 10;
        // Lauki and Baingan are disliked → more left over.
        const disliked = d.name === "Sabzi" && (sabzi === "Lauki" || sabzi === "Baingan");
        const frac = disliked ? 0.35 + rand() * 0.15 : 0.04 + rand() * 0.14;
        const leftover = d.unit === "count" ? Math.floor(cooked * frac) : Math.round(cooked * frac * 100) / 100;
        return { dishId: d.id, label: d.name === "Sabzi" ? sabzi : d.name === "Dal" ? dals[back % dals.length] : null, cooked, leftover, costPerUnit: d.costPerUnit };
      });
      const disliked = sabzi === "Lauki" || sabzi === "Baingan";
      const entry = await db.wastageEntry.create({
        data: { orgId: org.id, date: toDbDate(date), meal, tiffins, reason: disliked ? "disliked" : back % 5 === 0 ? "late_skip" : "overcooked" },
      });
      await db.wastageItem.createMany({ data: items.map((i) => ({ ...i, orgId: org.id, entryId: entry.id })) });
    }
  }
}

main().finally(() => db.$disconnect());

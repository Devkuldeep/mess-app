import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { requireStaff } from "@/server/auth";
import { listPlans } from "@/server/data";
import { getT } from "@/server/i18n";
import { todayIn } from "@/lib/dates";

export const metadata = { title: "Add customer" };

export default function NewCustomerPage() {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <NewCustomer />
    </Suspense>
  );
}

async function NewCustomer() {
  const ctx = await requireStaff();
  const [{ t }, plans] = await Promise.all([getT(), listPlans(ctx)]);
  return (
    <>
      <PageHeader title={t.addCustomer} back="/customers" />
      <main className="mx-auto max-w-md p-4">
        <CustomerForm t={t} plans={plans} v={{ startDate: todayIn(ctx.org.timezone) }} />
      </main>
    </>
  );
}

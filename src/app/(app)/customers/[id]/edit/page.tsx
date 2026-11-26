import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConnectivityFallback } from "@/components/sync-bar";
import { PageHeader, WAITING } from "@/components/page-header";
import { CustomerForm } from "@/components/customer-form";
import { requireStaff } from "@/server/auth";
import { getCustomer, listPlans } from "@/server/data";
import { getT } from "@/server/i18n";
import { fromDbDate, todayIn } from "@/lib/dates";

export const metadata = { title: "Edit customer" };

export default function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  return (
    <Suspense fallback={<ConnectivityFallback waiting={WAITING} />}>
      <EditCustomer params={props.params} />
    </Suspense>
  );
}

async function EditCustomer({ params }: { params: PageProps<"/customers/[id]/edit">["params"] }) {
  const ctx = await requireStaff();
  const { id } = await params;
  const [{ t, lang }, c, plans] = await Promise.all([getT(), getCustomer(ctx, id), listPlans(ctx)]);
  if (!c) notFound();
  return (
    <>
      <PageHeader title={c.name} sub={t.edit} back={`/customers/${c.id}`} />
      <main className="mx-auto max-w-md p-4">
        <CustomerForm t={t} lang={lang} today={todayIn(ctx.org.timezone)} plans={plans} v={{ ...c, startDate: fromDbDate(c.startDate) }} />
      </main>
    </>
  );
}

import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SyncBar } from "@/components/sync-bar";
import { getMember } from "@/server/auth";
import { getT } from "@/server/i18n";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Suspense fallback={null}>
        <Bar />
      </Suspense>
      {children}
      <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-16 border-t border-line bg-card" />}>
        <Nav />
      </Suspense>
    </div>
  );
}

async function Bar() {
  const { t } = await getT();
  return (
    <div>
      <SyncBar offlineText={t.offline} pendingText={t.pendingSync} syncNow={t.syncNow} />
    </div>
  );
}

async function Nav() {
  const [{ t }, ctx] = await Promise.all([getT(), getMember()]);
  return (
    <BottomNav
      staff={ctx?.role !== "delivery"}
      labels={{ today: t.navToday, delivery: t.navDelivery, customers: t.navCustomers, payments: t.navPayments, more: t.navMore }}
    />
  );
}

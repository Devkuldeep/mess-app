"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBike, IconMore, IconPot, IconRupee, IconUsers } from "./icons";

const TABS = [
  { href: "/today", key: "today", Icon: IconPot, staffOnly: true },
  { href: "/delivery", key: "delivery", Icon: IconBike, staffOnly: false },
  { href: "/customers", key: "customers", Icon: IconUsers, staffOnly: true },
  { href: "/payments", key: "payments", Icon: IconRupee, staffOnly: true },
  { href: "/more", key: "more", Icon: IconMore, staffOnly: false },
] as const;

export type NavLabels = Record<(typeof TABS)[number]["key"], string>;

export function BottomNav({ labels, staff }: { labels: NavLabels; staff: boolean }) {
  const path = usePathname();
  const tabs = TABS.filter((t) => staff || !t.staffOnly);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto flex max-w-md">
        {tabs.map(({ href, key, Icon }) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted aria-[current=page]:text-brand-ink"
              >
                <span className="flex h-8 w-14 items-center justify-center rounded-full transition [[aria-current=page]_&]:bg-brand-soft">
                  <Icon className="size-6" />
                </span>
                {labels[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

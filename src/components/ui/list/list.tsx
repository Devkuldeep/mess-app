// List primitives (server-renderable). One row = one tap target (48px+),
// secondary actions on the right — see .claude/skills/mobile-ui/SKILL.md.
//
//   <ListSection title="ग्राहक" action={<Link href="/customers">सब देखें</Link>}>
//     <ListItem href="/customers/1" leading={<ListAvatar name="Aman Verma" />}
//               title="Aman Verma" subtitle="Sector 5" meta="₹3,220" metaTone="bad" />
//   </ListSection>
import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/text";
import {
  listAvatarVariants, listItemVariants, listMetaVariants, listVariants,
  type ListAvatarVariants, type ListItemVariants, type ListMetaTone, type ListVariants,
} from "./list-variants";

export function List({ className, variant, dividers, ...rest }: HTMLAttributes<HTMLUListElement> & ListVariants) {
  return <ul className={cn(listVariants({ variant, dividers }), className)} {...rest} />;
}

/** A titled group of rows (section heading + optional action like "सब देखें"). */
export function ListSection({
  title, action, children, className, listClassName, variant,
}: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; listClassName?: string } & ListVariants) {
  return (
    <section className={cn("space-y-2", className)}>
      {(title || action) && (
        <div className="flex min-h-8 items-end justify-between gap-2 px-1">
          {title && <h2 className="section-title">{title}</h2>}
          {action && <div className="text-sm font-medium text-brand-ink">{action}</div>}
        </div>
      )}
      <List variant={variant} className={listClassName}>{children}</List>
    </section>
  );
}

export type ItemContent = {
  /** Icon tile or <ListAvatar/>. */
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right side value, e.g. "₹3,220". */
  meta?: ReactNode;
  metaTone?: ListMetaTone;
  /** Small line under meta (e.g. a date). */
  metaSub?: ReactNode;
  /** Far right: buttons/badges. Links get a chevron automatically. */
  trailing?: ReactNode;
};

type ListItemProps = ItemContent &
  Omit<ListItemVariants, "interactive" | "card"> & {
    /** Navigates when tapped. */
    href?: string;
    /** Makes the row a button (client components only). */
    onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
    /** Set when the parent List has variant="cards". */
    card?: boolean;
    className?: string;
    /** Extra props for the <li>. */
    liProps?: HTMLAttributes<HTMLLIElement>;
  };

export function ListItem({ href, onClick, density, disabled, card, className, liProps, ...content }: ListItemProps) {
  const interactive = !!(href || onClick);
  const cls = cn(listItemVariants({ density, disabled, card, interactive }), className);
  const inner = <ItemInner {...content} chevron={!!href && !content.trailing} />;
  return (
    <li {...liProps}>
      {href ? (
        <Link href={href} className={cls} aria-disabled={disabled || undefined}>
          {inner}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} disabled={!!disabled} className={cls}>
          {inner}
        </button>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </li>
  );
}

/** The row's inside, reusable by SwipeItem and custom rows. */
export function ItemInner({ leading, title, subtitle, meta, metaTone, metaSub, trailing, chevron }: ItemContent & { chevron?: boolean }) {
  return (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        {subtitle && <span className="block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      {(meta !== undefined || metaSub) && (
        <span className="flex shrink-0 flex-col items-end tabular-nums">
          {meta !== undefined && <span className={listMetaVariants({ tone: metaTone })}>{meta}</span>}
          {metaSub && <span className="text-xs text-muted">{metaSub}</span>}
        </span>
      )}
      {trailing}
      {chevron && (
        <svg className="size-5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );
}

/** Round avatar: initials from `name` (Hindi-aware), or your own icon as children. */
export function ListAvatar({ name, children, tone, size, className }: ListAvatarVariants & { name?: string; children?: ReactNode; className?: string }) {
  return (
    <span aria-hidden className={cn(listAvatarVariants({ tone, size }), className)}>
      {children ?? (name ? initials(name) : "?")}
    </span>
  );
}

/** Square icon tile for leading icons (settings-style rows). */
export function ListIcon({ children, tone = "brand", className }: { children: ReactNode; tone?: ListAvatarVariants["tone"]; className?: string }) {
  return <span aria-hidden className={cn(listAvatarVariants({ tone, size: "md" }), "rounded-xl", className)}>{children}</span>;
}

/** Empty state: one line + the main action. */
export function ListEmpty({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed border-line bg-card p-6 text-center", className)}>
      <p className="text-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

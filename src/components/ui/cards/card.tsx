// Card primitives (server-renderable). Pass `href` to make the whole card a link.
//
//   <Card href="/wastage/report">
//     <CardHeader><CardTitle>बर्बादी</CardTitle><CardDescription>इस हफ़्ते</CardDescription></CardHeader>
//     <CardContent>…</CardContent>
//   </Card>
import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { cardVariants, type CardVariants } from "./card-variants";

type CardProps = HTMLAttributes<HTMLDivElement> & Omit<CardVariants, "interactive"> & {
  /** Whole card becomes a link (tap feedback + focus ring added). */
  href?: string;
  /** Render as <section> (with a heading inside) instead of <div>. */
  as?: "div" | "section" | "article";
};

export function Card({ className, variant, padding, href, as: Tag = "div", children, ...rest }: CardProps) {
  if (href) {
    return (
      <Link href={href} className={cn(cardVariants({ variant, padding, interactive: true }), className)}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={cn(cardVariants({ variant, padding }), className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Title row with an optional action on the right (a link, chip or icon button). */
export function CardHeader({ className, children, action, ...rest }: HTMLAttributes<HTMLDivElement> & { action?: ReactNode }) {
  return (
    <div className={cn("mb-3 flex items-start gap-3", className)} {...rest}>
      <div className="min-w-0 flex-1 space-y-0.5">{children}</div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg leading-snug font-semibold", className)} {...rest} />;
}

export function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-muted", className)} {...rest} />;
}

export function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-3", className)} {...rest} />;
}

/** Actions at the bottom; separated by a line. Buttons stretch on phones. */
export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex gap-2 border-t border-line pt-3 [&>*]:flex-1", className)} {...rest} />;
}

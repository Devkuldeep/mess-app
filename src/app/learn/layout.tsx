import { ReaderShell } from "@/components/learn/reader-shell";
import { SiteFooter } from "@/components/site-footer";

// Public reading pages for docs/work-flow-story: static (no cookies/session),
// prerendered at build time. Reader settings live in the client shell.
export default function LearnLayout({ children }: LayoutProps<"/learn">) {
  return (
    <ReaderShell>
      {children}
      <SiteFooter compact />
    </ReaderShell>
  );
}

// Dev-only living reference for lists (src/components/ui/list).
// http://localhost:3000/dev/list — 404 in production builds.
import Link from "next/link";
import { notFound } from "next/navigation";
import { List, ListAvatar, ListEmpty, ListIcon, ListItem, ListSection } from "@/components/ui";
import { SwipeDemo } from "./swipe-demo";

export const metadata = { title: "List · design system", robots: { index: false } };

export default function DevListPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">List</h1>
        <p className="text-sm text-muted">src/components/ui/list · dev only</p>
      </header>

      <ListSection title="ग्राहक (inset, links)" action={<Link href="/customers">सब देखें</Link>}>
        <ListItem href="/customers" leading={<ListAvatar name="Aman Verma" />} title="Aman Verma" subtitle="Sector 5 · दोनों" meta="₹3,220" metaTone="bad" metaSub="20 नव." />
        <ListItem href="/customers" leading={<ListAvatar name="रवि कुमार" tone="ok" />} title="रवि कुमार" subtitle="Civil Lines · दोपहर" meta="साफ़" metaTone="ok" />
        <ListItem href="/customers" leading={<ListAvatar name="क्षमा शर्मा" tone="warn" />} title="क्षमा शर्मा" subtitle="बहुत लंबा पता जो एक लाइन में नहीं आएगा और कट जाना चाहिए" meta="₹770" metaTone="warn" />
      </ListSection>

      <ListSection title="सेटिंग जैसी (compact, icons)">
        <ListItem density="compact" href="/more/mess" leading={<ListIcon>🏠</ListIcon>} title="मेस की जानकारी" />
        <ListItem density="compact" href="/more/plans" leading={<ListIcon tone="ok">📋</ListIcon>} title="प्लान" meta="3" metaTone="muted" />
        <ListItem density="compact" leading={<ListIcon tone="muted">🔒</ListIcon>} title="बंद है" disabled />
      </ListSection>

      <section className="space-y-2">
        <h2 className="section-title">variant=&quot;cards&quot;</h2>
        <List variant="cards">
          <ListItem card title="दोपहर" subtitle="24 टिफ़िन" meta="12:30" />
          <ListItem card title="रात" subtitle="18 टिफ़िन" meta="8:00" />
        </List>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">SwipeItem — बाएं: कॉल/हटाएं, दाएं: डिलीवर · Tab से भी</h2>
        <SwipeDemo />
      </section>

      <section className="space-y-2">
        <h2 className="section-title">ListEmpty</h2>
        <ListEmpty action={<Link href="/customers/new" className="btn-primary">ग्राहक जोड़ें</Link>}>अभी कोई ग्राहक नहीं है</ListEmpty>
      </section>
    </main>
  );
}

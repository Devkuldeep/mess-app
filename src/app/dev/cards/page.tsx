// Dev-only living reference for cards (src/components/ui/cards).
// http://localhost:3000/dev/cards — 404 in production builds.
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardSkeleton, CardTitle, StatCard } from "@/components/ui";

export const metadata = { title: "Cards · design system", robots: { index: false } };

const variants = ["default", "outline", "soft", "brand", "elevated", "danger", "success", "warning"] as const;

export default function DevCardsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-4 pb-24">
      <header>
        <h1 className="text-2xl font-bold">Cards</h1>
        <p className="text-sm text-muted">src/components/ui/cards · dev only</p>
      </header>

      <section className="space-y-2">
        <h2 className="section-title">StatCard — count-up, tone, trend, link</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard lang="hi" label="आज के टिफ़िन" value={42} icon="🍱" hint="दोपहर 24 · रात 18" />
          <StatCard lang="hi" label="बाकी" value={21070} format="money" tone="bad" trend={0.12} goodWhen="down" href="/payments" />
          <StatCard lang="hi" label="बर्बादी" value={0.084} format="percent" tone="warn" trend={-0.03} goodWhen="down" hint="लक्ष्य 5%" />
          <StatCard lang="hi" label="इस महीने आए" value={48500} format="money" tone="ok" trend={0.2} />
          <StatCard lang="hi" label="छुट्टी" value={0} hint="कोई नहीं" variant="soft" />
          <StatCard lang="hi" label="अभी पता नहीं" value={null} animate={false} variant="outline" />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Card — header, action, footer</h2>
        <Card as="section">
          <CardHeader action={<a href="/wastage/report" className="text-sm font-medium text-brand-ink">रिपोर्ट</a>}>
            <CardTitle>बर्बादी</CardTitle>
            <CardDescription>पिछले 7 दिन</CardDescription>
          </CardHeader>
          <CardContent>
            <p>सबसे ज़्यादा: सब्ज़ी (19%)</p>
          </CardContent>
          <CardFooter>
            <button className="btn">बाद में</button>
            <button className="btn-primary">आज भरें</button>
          </CardFooter>
        </Card>
        <Card href="/today" variant="brand">
          <CardTitle>पूरा कार्ड एक लिंक</CardTitle>
          <CardDescription>दबाने पर हल्का सिकुड़ता है</CardDescription>
        </Card>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">Variants</h2>
        <div className="grid grid-cols-2 gap-3">
          {variants.map((v) => (
            <Card key={v} variant={v} padding="sm">
              <p className="font-medium">{v}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="section-title">CardSkeleton (Suspense fallback)</h2>
        <div className="grid grid-cols-2 gap-3">
          <CardSkeleton stat />
          <CardSkeleton lines={3} />
        </div>
      </section>
    </main>
  );
}

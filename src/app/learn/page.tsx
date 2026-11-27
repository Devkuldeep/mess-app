import Link from "next/link";
import type { Metadata } from "next";
import { Markdown } from "@/components/learn/markdown";
import { ContinueReading } from "@/components/learn/reader-memory";
import { getStory, learnRepo } from "@/server/learn";
import { INTRO_FILE, pad2, STORY_DIR } from "@/lib/learn";
import { plainText, type Block } from "@/lib/markdown";

export const metadata: Metadata = {
  title: "App kaise banta hai: A se Z (developer story)",
  description:
    "Ek IT company ek asli app idea se production aur growth tak kaise banati hai: business, requirements, design, architecture, code, testing, security, DevOps aur operations. Kahani + developer deep dive, Hinglish mein.",
};

export default async function LearnHome() {
  const { intro, chapters } = await getStory();
  const links = { from: `${STORY_DIR}/${INTRO_FILE}`, chapters: new Set(chapters.map((c) => c.slug)), repo: learnRepo() };
  const { title, lead, rest } = splitIntro(intro);
  const minutes = chapters.reduce((s, c) => s + c.minutes, 0);
  const first = chapters[0];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pt-8 pb-12">
      <section className="space-y-4">
        <p className="text-sm font-semibold tracking-wide text-brand-ink uppercase">Seekho · Work-flow story</p>
        <h1 className="text-3xl leading-tight font-bold text-balance sm:text-4xl">{title}</h1>
        {lead && (
          <div className="prose-reader text-muted">
            <Markdown blocks={lead} links={links} />
          </div>
        )}
        <p className="text-sm text-muted">
          {chapters.length} chapters · {minutes >= 60 ? `~${Math.floor(minutes / 60)} ghante ${minutes % 60} min` : `~${minutes} min`} padhai · Hinglish
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          {first && (
            <Link href={`/learn/${first.slug}`} className="btn-primary">
              Shuru se padho →
            </Link>
          )}
          <a href="#chapters" className="btn-secondary">
            Saare chapters
          </a>
        </div>
        <ContinueReading />
      </section>

      <section aria-labelledby="chapters" className="mt-12">
        <h2 id="chapters" className="mb-4 text-xl font-bold">
          Chapters
        </h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {chapters.map((c) => (
            <li key={c.slug}>
              <Link href={`/learn/${c.slug}`} className="card group flex h-full gap-3 p-4 transition hover:border-brand/50">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft font-bold text-brand-ink tabular-nums">
                  {pad2(c.num)}
                </span>
                <span className="min-w-0 space-y-1">
                  <span className="block leading-snug font-semibold group-hover:text-brand-ink">{c.title}</span>
                  {c.summary && <span className="line-clamp-2 block text-sm text-muted">{c.summary}</span>}
                  <span className="block text-xs text-muted">~{c.minutes} min</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {rest.length > 0 && (
        <article className="reader-article prose-reader mx-auto mt-12">
          <Markdown blocks={rest} links={links} />
        </article>
      )}
    </main>
  );
}

/** The README's h1 + opening quote become the hero; its "Chapters" table is replaced by the cards. */
function splitIntro(blocks: Block[]) {
  let title = "Ek IT company ye app A se Z kaise banati hai";
  let lead: Block[] | null = null;
  const rest: Block[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    if (b.t === "heading" && b.level === 1) {
      const t = b.text.replace(/^Work-flow story:\s*/i, "");
      title = t.charAt(0).toUpperCase() + t.slice(1);
      continue;
    }
    if (!lead && b.t === "quote" && rest.length === 0) {
      // Drop the "you can also read this on the website" note: we are on the website.
      lead = b.c.filter((x) => !(x.t === "paragraph" && plainText(x.c).trimStart().startsWith("🌐")));
      continue;
    }
    if (b.t === "heading" && b.level === 2 && b.text.trim().toLowerCase() === "chapters") {
      if (blocks[i + 1]?.t === "table") i++;
      continue;
    }
    rest.push(b);
  }
  return { title, lead, rest };
}

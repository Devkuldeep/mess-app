import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Markdown } from "@/components/learn/markdown";
import { RememberChapter } from "@/components/learn/reader-memory";
import { getChapter, getStory, learnRepo } from "@/server/learn";
import { pad2, STORY_DIR } from "@/lib/learn";
import type { Block } from "@/lib/markdown";

export async function generateStaticParams() {
  const { chapters } = await getStory();
  return chapters.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/learn/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ch = await getChapter(slug);
  if (!ch) return {};
  return { title: `${pad2(ch.meta.num)}. ${ch.meta.title}`, description: ch.meta.summary };
}

export default async function ChapterPage({ params }: PageProps<"/learn/[slug]">) {
  const { slug } = await params;
  const [ch, story] = await Promise.all([getChapter(slug), getStory()]);
  if (!ch) notFound();

  const { meta, blocks } = ch;
  const idx = story.chapters.findIndex((c) => c.slug === slug);
  const prev = idx > 0 ? story.chapters[idx - 1] : null;
  const next = story.chapters[idx + 1] ?? null;
  const links = { from: `${STORY_DIR}/${meta.file}`, chapters: new Set(story.chapters.map((c) => c.slug)), repo: learnRepo() };
  const body = blocks.filter((b) => !(b.t === "heading" && b.level === 1));
  const toc = blocks.filter((b): b is Extract<Block, { t: "heading" }> => b.t === "heading" && b.level === 2);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 xl:grid xl:grid-cols-[minmax(0,1fr)_15rem] xl:gap-10">
      <RememberChapter slug={meta.slug} num={pad2(meta.num)} title={meta.title} />
      <article className="reader-article mx-auto w-full">
        <header className="mb-6 space-y-2">
          <p className="text-sm font-semibold tracking-wide text-brand-ink uppercase">
            Chapter {pad2(meta.num)} / {pad2(story.chapters.length)}
          </p>
          <h1 className="reader-title">{meta.title}</h1>
          <p className="text-sm text-muted">~{meta.minutes} min padhai</p>
        </header>

        {toc.length > 2 && (
          <details className="toc-mobile xl:hidden">
            <summary>Is chapter mein ({toc.length})</summary>
            <TocList toc={toc} />
          </details>
        )}

        <div className="prose-reader">
          <Markdown blocks={body} links={links} />
        </div>

        <nav aria-label="Chapters" className="mt-12 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link href={`/learn/${prev.slug}`} className="card block p-4 hover:border-brand/50">
              <span className="block text-sm text-muted">← Pichhla</span>
              <span className="block font-semibold">
                {pad2(prev.num)}. {prev.title}
              </span>
            </Link>
          ) : (
            <Link href="/learn" className="card block p-4 hover:border-brand/50">
              <span className="block text-sm text-muted">← Shuruaat</span>
              <span className="block font-semibold">Saare chapters aur kirdaar</span>
            </Link>
          )}
          {next && (
            <Link href={`/learn/${next.slug}`} className="card block p-4 text-right hover:border-brand/50 sm:col-start-2">
              <span className="block text-sm text-muted">Agla →</span>
              <span className="block font-semibold">
                {pad2(next.num)}. {next.title}
              </span>
            </Link>
          )}
        </nav>
        <p className="mt-6 text-center">
          <a href="#content" className="text-sm text-muted underline-offset-2 hover:underline">
            ↑ Upar jao
          </a>
        </p>
      </article>

      {toc.length > 2 && (
        <aside className="hidden xl:block" aria-label="Is chapter mein">
          <nav className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto text-sm">
            <p className="mb-2 font-semibold text-muted">Is chapter mein</p>
            <TocList toc={toc} />
          </nav>
        </aside>
      )}
    </div>
  );
}

function TocList({ toc }: { toc: Extract<Block, { t: "heading" }>[] }) {
  return (
    <ol className="toc-list">
      {toc.map((h) => (
        <li key={h.id}>
          <a href={`#${h.id}`}>{h.text}</a>
        </li>
      ))}
    </ol>
  );
}

// Loads the work-flow story (docs/work-flow-story/*.md) for the public /learn pages.
// Cached for the life of the deployment: the pages prerender at build time, and
// next.config.ts traces the .md files into the server bundle in case a page
// ever renders at request time.
import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";
import { parseMarkdown, type Block } from "@/lib/markdown";
import { chapterMeta, isChapterFile, isIntroFile, slugOf, type ChapterMeta } from "@/lib/learn";

async function storyFiles(): Promise<string[]> {
  // Literal path segments keep the file trace scoped to this folder (a computed path traces the whole project).
  return (await readdir(path.join(process.cwd(), "docs", "work-flow-story"))).filter(isChapterFile).sort();
}

export type Story = { intro: Block[]; chapters: ChapterMeta[] };

export async function getStory(): Promise<Story> {
  "use cache";
  cacheLife("max");
  const files = await storyFiles();
  const docs = await Promise.all(files.map(async (f) => ({ f, blocks: parseMarkdown(await readFile(path.join(process.cwd(), "docs", "work-flow-story", f), "utf8")) })));
  return {
    intro: docs.find((d) => isIntroFile(d.f))?.blocks ?? [],
    chapters: docs.filter((d) => !isIntroFile(d.f)).map((d) => chapterMeta(d.f, d.blocks)),
  };
}

export async function getChapter(slug: string): Promise<{ meta: ChapterMeta; blocks: Block[] } | null> {
  "use cache";
  cacheLife("max");
  const file = (await storyFiles()).find((f) => !isIntroFile(f) && slugOf(f) === slug);
  if (!file) return null;
  const blocks = parseMarkdown(await readFile(path.join(process.cwd(), "docs", "work-flow-story", file), "utf8"));
  return { meta: chapterMeta(file, blocks), blocks };
}

/** Where links inside the story point: GitHub repo can be overridden for forks. */
export const learnRepo = () => process.env.LEARN_REPO_URL || undefined;

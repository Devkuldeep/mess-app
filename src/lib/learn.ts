// /learn: the work-flow story (docs/work-flow-story/*.md) as public pages.
// Pure helpers shared by the server loader (src/server/learn.ts) and tests.
import { blocksText, plainText, type Block } from "./markdown.ts";

export const STORY_DIR = "docs/work-flow-story";
export const INTRO_FILE = "00-README.md";
/** Links to docs outside the story go to the public GitHub repo. */
export const DEFAULT_REPO = "https://github.com/Devkuldeep/mess-app";

export type ChapterMeta = { slug: string; file: string; num: number; title: string; summary: string; minutes: number };

export const isChapterFile = (f: string) => /^\d{2}-[\w-]+\.md$/.test(f);
export const isIntroFile = (f: string) => f.toLowerCase() === INTRO_FILE.toLowerCase();
export const slugOf = (file: string) => file.replace(/\.md$/, "").toLowerCase();
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Title (without "01. "), number, a one-line summary and reading time (Hinglish ≈ 180 words/min). */
export function chapterMeta(file: string, blocks: Block[]): ChapterMeta {
  const h1 = blocks.find((b): b is Extract<Block, { t: "heading" }> => b.t === "heading" && b.level === 1);
  const title = (h1?.text ?? file).replace(/^\d{1,2}\.\s*/, "");
  const para = blocks.find((b): b is Extract<Block, { t: "paragraph" }> => b.t === "paragraph");
  const words = blocksText(blocks).split(/\s+/).filter(Boolean).length;
  return {
    slug: slugOf(file),
    file,
    num: parseInt(file.slice(0, 2), 10),
    title,
    summary: clip(para ? plainText(para.c) : "", 160),
    minutes: Math.max(1, Math.round(words / 180)),
  };
}

export function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > max * 0.5 ? space : max).trimEnd()}…`; // end on a whole word when we can
}

export type LinkOptions = {
  /** Repo-relative path of the file the link is written in, e.g. "docs/work-flow-story/01-x.md". */
  from: string;
  /** Slugs that have a /learn page. */
  chapters: ReadonlySet<string>;
  repo?: string;
  branch?: string;
};

/**
 * Where a Markdown link should point on the website:
 *  - another chapter → /learn/<slug>, the intro → /learn
 *  - any other repo file/folder → GitHub (the repo is public)
 *  - http(s)/mailto and #anchors → unchanged
 */
export function resolveDocLink(href: string, o: LinkOptions): { href: string; external: boolean; repoPath?: string } {
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return { href, external: /^https?:/i.test(href) };
  if (href.startsWith("#")) return { href, external: false };
  const hashAt = href.indexOf("#");
  const pathPart = hashAt === -1 ? href : href.slice(0, hashAt);
  const anchor = hashAt === -1 ? "" : href.slice(hashAt);
  const resolved = normalizePath(`${dirname(o.from)}/${pathPart}`);

  if (resolved === STORY_DIR) return { href: `/learn${anchor}`, external: false };
  if (resolved.startsWith(`${STORY_DIR}/`)) {
    const file = resolved.slice(STORY_DIR.length + 1);
    if (isIntroFile(file)) return { href: `/learn${anchor}`, external: false };
    const slug = slugOf(file);
    if (o.chapters.has(slug)) return { href: `/learn/${slug}${anchor}`, external: false };
  }
  const kind = pathPart.endsWith("/") || !/\.[a-z0-9]+$/i.test(resolved) ? "tree" : "blob";
  return { href: `${o.repo ?? DEFAULT_REPO}/${kind}/${o.branch ?? "main"}/${resolved}${anchor}`, external: true, repoPath: resolved };
}

function dirname(p: string): string {
  const k = p.lastIndexOf("/");
  return k === -1 ? "" : p.slice(0, k);
}

/** POSIX-style "a/b/../c/./d" → "a/c/d" (no leading slash, no trailing slash). */
export function normalizePath(p: string): string {
  const out: string[] = [];
  for (const seg of p.split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

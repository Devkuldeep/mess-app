import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { chapterMeta, clip, isChapterFile, isIntroFile, normalizePath, resolveDocLink, slugOf, STORY_DIR } from "./learn.ts";
import { parseMarkdown, type Block, type Inline } from "./markdown.ts";

const chapters = new Set(["01-idea-aur-business", "02-discovery-requirements"]);
const from = `${STORY_DIR}/01-idea-aur-business.md`;
const opts = { from, chapters, repo: "https://github.com/acme/app" };

test("chapter and intro links stay on the site", () => {
  assert.deepEqual(resolveDocLink("02-discovery-requirements.md", opts), { href: "/learn/02-discovery-requirements", external: false });
  assert.deepEqual(resolveDocLink("02-discovery-requirements.md#namuna", opts), { href: "/learn/02-discovery-requirements#namuna", external: false });
  assert.deepEqual(resolveDocLink("00-README.md", opts), { href: "/learn", external: false });
  assert.deepEqual(resolveDocLink("#checklist", opts), { href: "#checklist", external: false });
});

test("other repo docs go to GitHub (blob for files, tree for folders)", () => {
  assert.deepEqual(resolveDocLink("../plan/core-domain-v2.md", opts), {
    href: "https://github.com/acme/app/blob/main/docs/plan/core-domain-v2.md",
    external: true,
    repoPath: "docs/plan/core-domain-v2.md",
  });
  assert.equal(resolveDocLink("../plan/", opts).href, "https://github.com/acme/app/tree/main/docs/plan");
  assert.equal(resolveDocLink("../roadmap.md#decision-register", opts).href, "https://github.com/acme/app/blob/main/docs/roadmap.md#decision-register");
});

test("absolute URLs are untouched", () => {
  assert.deepEqual(resolveDocLink("https://web.dev", opts), { href: "https://web.dev", external: true });
  assert.deepEqual(resolveDocLink("mailto:a@b.c", opts), { href: "mailto:a@b.c", external: false });
});

test("normalizePath, slugOf, file filters, clip", () => {
  assert.equal(normalizePath("docs/work-flow-story/../plan/./x.md"), "docs/plan/x.md");
  assert.equal(slugOf("00-README.md"), "00-readme");
  assert.equal(isChapterFile("07-developer-ka-din.md"), true);
  assert.equal(isChapterFile("notes.md"), false);
  assert.equal(isIntroFile("00-README.md"), true);
  assert.equal(clip("ek do teen char", 9), "ek do…");
  assert.equal(clip("chhota", 50), "chhota");
});

test("chapterMeta: title without number, summary from first paragraph, reading time", () => {
  const m = chapterMeta("03-design-ux.md", parseMarkdown("# 03. Design (UX/UI)\n## 📖 Kahani\nSana ne sketches banaye."));
  assert.equal(m.title, "Design (UX/UI)");
  assert.equal(m.num, 3);
  assert.equal(m.slug, "03-design-ux");
  assert.equal(m.summary, "Sana ne sketches banaye.");
  assert.equal(m.minutes, 1);
});

// The real story: every file parses, has one h1, and every relative link points somewhere real.
test("docs/work-flow-story: parses, one h1 each, chapter links resolve", () => {
  const dir = new URL("../../docs/work-flow-story/", import.meta.url);
  const files = readdirSync(dir).filter(isChapterFile).sort();
  assert.ok(files.length >= 10, "story chapters found");
  const slugs = new Set(files.filter((f) => !isIntroFile(f)).map(slugOf));
  const links: string[] = [];
  const walkInline = (c: Inline[]) => c.forEach((n) => (n.t === "link" ? links.push(n.href) : "c" in n && walkInline(n.c)));
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.t === "heading" || b.t === "paragraph") walkInline(b.c);
      else if (b.t === "list") b.items.forEach((i) => walk(i.c));
      else if (b.t === "quote") walk(b.c);
      else if (b.t === "table") [b.head, ...b.rows].forEach((r) => r.forEach(walkInline));
    }
  };
  for (const f of files) {
    const blocks = parseMarkdown(readFileSync(new URL(f, dir), "utf8"));
    assert.equal(blocks.filter((b) => b.t === "heading" && b.level === 1).length, 1, `${f}: exactly one h1`);
    links.length = 0;
    walk(blocks);
    for (const href of links) {
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const r = resolveDocLink(href, { from: `${STORY_DIR}/${f}`, chapters: slugs });
      if (r.external) continue; // repo docs: checked by the docs link check
      const slug = r.href.replace(/^\/learn\/?/, "").replace(/#.*$/, "");
      assert.ok(slug === "" || slugs.has(slug), `${f}: link ${href} → ${r.href}`);
    }
  }
});

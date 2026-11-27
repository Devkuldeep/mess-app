import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInline, parseMarkdown, plainText, slugify, type Block } from "./markdown.ts";

const kinds = (bs: Block[]) => bs.map((b) => b.t);

test("headings: level, plain text, emoji-free unique ids", () => {
  const bs = parseMarkdown("# 01. Idea\n## 📖 Kahani\n## 📖 Kahani\n### 1. Problem pehle");
  assert.deepEqual(kinds(bs), ["heading", "heading", "heading", "heading"]);
  const ids = bs.map((b) => (b.t === "heading" ? b.id : ""));
  assert.deepEqual(ids, ["01-idea", "kahani", "kahani-2", "1-problem-pehle"]);
  assert.equal(bs[0].t === "heading" && bs[0].level, 1);
});

test("slugify keeps Devanagari letters with their vowel signs", () => {
  assert.equal(slugify("आज का हिसाब!"), "आज-का-हिसाब");
  assert.equal(slugify("✅ ✨"), "section");
});

test("paragraph lines join; inline bold, italic, code, link, strike, escapes", () => {
  const [p] = parseMarkdown("Ek **bold** aur *italic*\n`code` [link](a.md) ~~old~~ \\*star\\*");
  assert.equal(p.t, "paragraph");
  if (p.t !== "paragraph") return;
  assert.deepEqual(
    p.c.map((n) => n.t),
    ["text", "strong", "text", "em", "text", "code", "text", "link", "text", "del", "text"],
  );
  assert.equal(plainText(p.c), "Ek bold aur italic code link old *star*");
});

test("a lone * or ** stays literal; ** inside code does not open bold", () => {
  assert.equal(plainText(parseInline("5 * 3 = 15")), "5 * 3 = 15");
  assert.equal(plainText(parseInline("glob `src/**/*.ts` ok")), "glob src/**/*.ts ok");
  assert.deepEqual(parseInline("a ** b").map((n) => n.t), ["text"]);
});

test("link text can hold formatting; href keeps the #anchor", () => {
  const [l] = parseInline("[**PRD** ka namuna](02-x.md#namuna)");
  assert.equal(l.t, "link");
  if (l.t !== "link") return;
  assert.equal(l.href, "02-x.md#namuna");
  assert.equal(l.c[0].t, "strong");
});

test("nested lists: ordered with bullets under it, task items", () => {
  const md = ["1. **Pehla:**", "   - andar ek", "   - andar do", "2. Doosra", "", "- [ ] baaki", "- [x] ho gaya"].join("\n");
  const [ol, ul] = parseMarkdown(md);
  assert.equal(ol.t, "list");
  if (ol.t !== "list" || ul.t !== "list") return assert.fail("expected two lists");
  assert.equal(ol.ordered, true);
  assert.equal(ol.items.length, 2);
  assert.deepEqual(kinds(ol.items[0].c), ["paragraph", "list"]);
  assert.equal(ul.ordered, false);
  assert.deepEqual(ul.items.map((i) => i.task), [false, true]);
});

test("a list can follow a paragraph line directly (no blank line)", () => {
  assert.deepEqual(kinds(parseMarkdown("**Fix:**\n- ek\n- do")), ["paragraph", "list"]);
});

test("item continuation paragraph and fenced code inside an item", () => {
  const md = ["- Item text:", "  ```ts", "  const a = 1;", "  ```", "  Aur ek line.", "- Next"].join("\n");
  const [ul] = parseMarkdown(md);
  if (ul.t !== "list") return assert.fail("expected a list");
  assert.deepEqual(kinds(ul.items[0].c), ["paragraph", "code", "paragraph"]);
  const code = ul.items[0].c[1];
  assert.equal(code.t === "code" && code.v, "const a = 1;");
  assert.equal(code.t === "code" && code.lang, "ts");
});

test("blockquote with a list and bold inside", () => {
  const [q] = parseMarkdown("> **Koi faisla ho to:**\n> 1. Status ✅\n> 2. D-entry\n>\n> Aakhri line.");
  if (q.t !== "quote") return assert.fail("expected a quote");
  assert.deepEqual(kinds(q.c), ["paragraph", "list", "paragraph"]);
});

test("tables: alignment, escaped pipes and pipes inside code", () => {
  const md = ["| Naam | Kaam | Amount |", "|:--|:-:|--:|", "| `a | b` | x \\| y | ₹500 |", "| short |"].join("\n");
  const [t] = parseMarkdown(md);
  if (t.t !== "table") return assert.fail("expected a table");
  assert.deepEqual(t.align, ["left", "center", "right"]);
  assert.equal(plainText(t.rows[0][0]), "a | b");
  assert.equal(plainText(t.rows[0][1]), "x | y");
  assert.equal(t.rows[1].length, 3, "short rows are padded to the header width");
});

test("fences, rules and code that looks like markdown", () => {
  const bs = parseMarkdown("```\n# not a heading\n- not a list\n```\n---\nText");
  assert.deepEqual(kinds(bs), ["code", "hr", "paragraph"]);
  assert.equal(bs[0].t === "code" && bs[0].v, "# not a heading\n- not a list");
});

test("CRLF input and unclosed fence do not crash", () => {
  assert.deepEqual(kinds(parseMarkdown("# A\r\n\r\nText\r\n```\nopen")), ["heading", "paragraph", "code"]);
});

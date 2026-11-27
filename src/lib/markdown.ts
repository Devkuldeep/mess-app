// Small Markdown → AST parser for the docs published at /learn (docs/work-flow-story).
// It covers the subset our docs use: ATX headings, paragraphs, nested lists (with
// task items), blockquotes, GFM tables, fenced code, horizontal rules, and inline
// **bold**, *italic*, ~~strike~~, `code`, [links](url) and backslash escapes.
// No HTML is ever passed through: the renderer turns the AST into React elements.
// Pure (no Node/DOM APIs), tested with node --test (markdown.test.ts).

export type Inline =
  | { t: "text"; v: string }
  | { t: "strong" | "em" | "del"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export type Align = "left" | "center" | "right" | null;
export type ListItem = { task: boolean | null; c: Block[] };

export type Block =
  | { t: "heading"; level: number; id: string; text: string; c: Inline[] }
  | { t: "paragraph"; c: Inline[] }
  | { t: "list"; ordered: boolean; start: number; items: ListItem[] }
  | { t: "quote"; c: Block[] }
  | { t: "code"; lang: string; v: string }
  | { t: "table"; align: Align[]; head: Inline[][]; rows: Inline[][][] }
  | { t: "hr" };

type Ctx = { ids: Map<string, number> };

const FENCE = /^( *)(`{3,}|~{3,})\s*([\w#+.-]*)/;
const HEADING = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^ {0,3}>/;
const LIST = /^( *)([-*+]|\d{1,9}[.)])( +|$)/;
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const blank = (l: string) => l.trim() === "";
const indentOf = (l: string) => l.length - l.trimStart().length;

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  return parseBlocks(lines, { ids: new Map() });
}

function listMarker(l: string) {
  const m = LIST.exec(l);
  if (!m) return null;
  const indent = m[1].length;
  const marker = m[2];
  const ordered = /\d/.test(marker);
  const spaces = m[3].length;
  const contentCol = indent + marker.length + (spaces === 0 ? 1 : Math.min(spaces, 4));
  return { indent, ordered, start: ordered ? parseInt(marker, 10) : 1, contentCol };
}

const isTableStart = (lines: string[], i: number) =>
  lines[i].includes("|") && i + 1 < lines.length && lines[i + 1].includes("|") && lines[i + 1].includes("-") && TABLE_SEP.test(lines[i + 1]);

const startsBlock = (l: string) => FENCE.test(l) || HEADING.test(l) || HR.test(l) || QUOTE.test(l) || LIST.test(l);

function isFenceClose(l: string, marker: string): boolean {
  const m = /^\s*(`{3,}|~{3,})\s*$/.exec(l);
  return !!m && m[1][0] === marker[0] && m[1].length >= marker.length;
}

function stripIndent(l: string, n: number): string {
  let k = 0;
  while (k < n && l[k] === " ") k++;
  return l.slice(k);
}

function parseBlocks(lines: string[], ctx: Ctx): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (blank(line)) {
      i++;
      continue;
    }

    const fence = FENCE.exec(line);
    if (fence) {
      const indent = fence[1].length;
      const marker = fence[2];
      const body: string[] = [];
      i++;
      while (i < lines.length && !isFenceClose(lines[i], marker)) body.push(stripIndent(lines[i++], indent));
      i++; // closing fence (or end of input)
      out.push({ t: "code", lang: fence[3] ?? "", v: body.join("\n") });
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      const c = parseInline(h[2]);
      const text = plainText(c);
      out.push({ t: "heading", level: h[1].length, id: uniqueId(ctx, slugify(text)), text, c });
      i++;
      continue;
    }

    if (HR.test(line)) {
      out.push({ t: "hr" });
      i++;
      continue;
    }

    if (isTableStart(lines, i)) {
      const head = splitRow(line);
      const align = splitRow(lines[i + 1]).map(alignOf);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && !blank(lines[i]) && lines[i].includes("|")) rows.push(splitRow(lines[i++]));
      const n = head.length;
      out.push({
        t: "table",
        align: Array.from({ length: n }, (_, k) => align[k] ?? null),
        head: head.map(parseInline),
        rows: rows.map((r) => Array.from({ length: n }, (_, k) => parseInline(r[k] ?? ""))),
      });
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) body.push(lines[i++].replace(/^ {0,3}> ?/, ""));
      out.push({ t: "quote", c: parseBlocks(body, ctx) });
      continue;
    }

    if (listMarker(line)) {
      const [list, next] = parseList(lines, i, ctx);
      out.push(list);
      i = next;
      continue;
    }

    const para = [line.trim()];
    i++;
    while (i < lines.length && !blank(lines[i]) && !startsBlock(lines[i]) && !isTableStart(lines, i)) para.push(lines[i++].trim());
    out.push({ t: "paragraph", c: parseInline(para.join(" ")) });
  }
  return out;
}

function parseList(lines: string[], start: number, ctx: Ctx): [Block, number] {
  const first = listMarker(lines[start])!;
  const items: ListItem[] = [];
  let i = start;
  while (i < lines.length) {
    const m = listMarker(lines[i]);
    if (!m || m.indent !== first.indent || m.ordered !== first.ordered) break;
    const body = [lines[i].slice(Math.min(m.contentCol, lines[i].length))];
    i++;
    while (i < lines.length) {
      const l = lines[i];
      if (blank(l)) {
        let j = i;
        while (j < lines.length && blank(lines[j])) j++;
        if (j < lines.length && indentOf(lines[j]) >= m.contentCol) {
          for (; i < j; i++) body.push("");
          continue;
        }
        break;
      }
      const ind = indentOf(l);
      if (ind >= m.contentCol) {
        body.push(l.slice(m.contentCol));
        i++;
        continue;
      }
      const sub = listMarker(l);
      if (sub) {
        if (sub.indent > first.indent) {
          body.push(l.slice(ind)); // nested list indented less than the content column
          i++;
          continue;
        }
        break;
      }
      if (startsBlock(l) || isTableStart(lines, i)) break;
      body.push(l.trim()); // lazy continuation of the item's paragraph
      i++;
    }
    let task: boolean | null = null;
    const tm = /^\[( |x|X)\]\s+/.exec(body[0]);
    if (tm) {
      task = tm[1] !== " ";
      body[0] = body[0].slice(tm[0].length);
    }
    items.push({ task, c: parseBlocks(body, ctx) });
  }
  return [{ t: "list", ordered: first.ordered, start: first.start, items }, i];
}

/** Split a table row on pipes that are not escaped (\|) and not inside `code`. */
function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|") && !s.endsWith("\\|")) s = s.slice(0, -1);
  const cells: string[] = [];
  let cur = "";
  let codeRun = 0;
  for (let k = 0; k < s.length; k++) {
    const ch = s[k];
    if (ch === "\\" && s[k + 1] === "|") {
      cur += "|";
      k++;
      continue;
    }
    if (ch === "`") {
      let run = 1;
      while (s[k + run] === "`") run++;
      if (codeRun === 0) codeRun = run;
      else if (run === codeRun) codeRun = 0;
      cur += "`".repeat(run);
      k += run - 1;
      continue;
    }
    if (ch === "|" && codeRun === 0) {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function alignOf(cell: string): Align {
  const c = cell.trim();
  if (/^:-+:$/.test(c)) return "center";
  if (/^-+:$/.test(c)) return "right";
  if (/^:-+$/.test(c)) return "left";
  return null;
}

// ───────────── inline ─────────────

const ESCAPABLE = /[\\`*_{}[\]()#+\-.!|~>]/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) out.push({ t: "text", v: buf });
    buf = "";
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (ch === "\\" && i + 1 < src.length && ESCAPABLE.test(src[i + 1])) {
      buf += src[i + 1];
      i += 2;
      continue;
    }

    if (ch === "`") {
      let run = 1;
      while (src[i + run] === "`") run++;
      const close = findRun(src, run, i + run);
      if (close !== -1) {
        flush();
        let v = src.slice(i + run, close);
        if (v.length > 2 && v.startsWith(" ") && v.endsWith(" ")) v = v.slice(1, -1);
        out.push({ t: "code", v });
        i = close + run;
        continue;
      }
      buf += "`".repeat(run);
      i += run;
      continue;
    }

    if (ch === "[") {
      const end = matchClose(src, i, "[", "]");
      if (end !== -1 && src[end + 1] === "(") {
        const close = matchClose(src, end + 1, "(", ")");
        if (close !== -1) {
          flush();
          const href = src.slice(end + 2, close).trim().split(/\s+/)[0] ?? "";
          out.push({ t: "link", href, c: parseInline(src.slice(i + 1, end)) });
          i = close + 1;
          continue;
        }
      }
      buf += ch;
      i++;
      continue;
    }

    if (ch === "*" && src[i + 1] === "*") {
      const close = findDouble(src, "**", i + 2);
      if (close !== -1) {
        flush();
        out.push({ t: "strong", c: parseInline(src.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
      buf += "**";
      i += 2;
      continue;
    }

    if (ch === "*" && src[i + 1] !== " " && src[i + 1] !== undefined) {
      const close = findSingleStar(src, i + 1);
      if (close !== -1) {
        flush();
        out.push({ t: "em", c: parseInline(src.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    }

    if (ch === "~" && src[i + 1] === "~") {
      const close = findDouble(src, "~~", i + 2);
      if (close !== -1) {
        flush();
        out.push({ t: "del", c: parseInline(src.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
    }

    buf += ch;
    i++;
  }
  flush();
  return out;
}

/** Index of the next run of exactly `n` backticks at or after `from`, else -1. */
function findRun(s: string, n: number, from: number): number {
  for (let k = from; k < s.length; k++) {
    if (s[k] !== "`") continue;
    let run = 1;
    while (s[k + run] === "`") run++;
    if (run === n) return k;
    k += run - 1;
  }
  return -1;
}

/** Skip over a `code` span starting at k; returns the index after it (or k + 1). */
function skipCode(s: string, k: number): number {
  let run = 1;
  while (s[k + run] === "`") run++;
  const close = findRun(s, run, k + run);
  return close === -1 ? k + run : close + run;
}

function findDouble(s: string, delim: string, from: number): number {
  let k = from;
  while (k < s.length) {
    if (s[k] === "`") {
      k = skipCode(s, k);
      continue;
    }
    if (s.startsWith(delim, k) && k > from) return k;
    k++;
  }
  return -1;
}

function findSingleStar(s: string, from: number): number {
  let k = from;
  while (k < s.length) {
    if (s[k] === "`") {
      k = skipCode(s, k);
      continue;
    }
    if (s[k] === "*") {
      if (s[k + 1] === "*") {
        const close = findDouble(s, "**", k + 2); // step over a nested **bold**
        if (close === -1) return -1;
        k = close + 2;
        continue;
      }
      if (k > from && s[k - 1] !== " ") return k;
    }
    k++;
  }
  return -1;
}

/** Index of the bracket closing the one at `open` (nesting-aware, skips code and escapes). */
function matchClose(s: string, open: number, o: string, c: string): number {
  let depth = 0;
  let k = open;
  while (k < s.length) {
    const ch = s[k];
    if (ch === "\\") {
      k += 2;
      continue;
    }
    if (ch === "`") {
      k = skipCode(s, k);
      continue;
    }
    if (ch === o) depth++;
    else if (ch === c && --depth === 0) return k;
    k++;
  }
  return -1;
}

// ───────────── helpers ─────────────

export function plainText(c: Inline[]): string {
  return c.map((n) => (n.t === "text" || n.t === "code" ? n.v : plainText(n.c))).join("");
}

/** All readable text of a document (for reading time). */
export function blocksText(blocks: Block[]): string {
  const parts: string[] = [];
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.t === "heading" || b.t === "paragraph") parts.push(plainText(b.c));
      else if (b.t === "list") b.items.forEach((it) => walk(it.c));
      else if (b.t === "quote") walk(b.c);
      else if (b.t === "code") parts.push(b.v);
      else if (b.t === "table") [b.head, ...b.rows].forEach((r) => r.forEach((cell) => parts.push(plainText(cell))));
    }
  };
  walk(blocks);
  return parts.join(" ");
}

/** "📖 Kahani" → "kahani", "1. Problem pehle" → "1-problem-pehle". Keeps Devanagari letters and marks. */
export function slugify(text: string): string {
  const s = text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return s || "section";
}

function uniqueId(ctx: Ctx, base: string): string {
  const n = ctx.ids.get(base) ?? 0;
  ctx.ids.set(base, n + 1);
  return n === 0 ? base : `${base}-${n + 1}`;
}

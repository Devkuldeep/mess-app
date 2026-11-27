// Renders the Markdown AST from src/lib/markdown.ts as React elements (server
// component; no raw HTML). Styling comes from `.prose-reader` in globals.css.
import Link from "next/link";
import { plainText, type Block, type Inline, type ListItem } from "@/lib/markdown";
import { resolveDocLink, type LinkOptions } from "@/lib/learn";
import { CopyCode } from "./copy-code";

export function Markdown({ blocks, links }: { blocks: Block[]; links: LinkOptions }) {
  return blocks.map((b, i) => <BlockView key={i} b={b} links={links} />);
}

function BlockView({ b, links }: { b: Block; links: LinkOptions }) {
  switch (b.t) {
    case "heading": {
      const H = (["h1", "h2", "h3", "h4", "h5", "h6"] as const)[Math.min(Math.max(b.level, 1), 6) - 1];
      return (
        <H id={b.id}>
          <Inlines c={b.c} links={links} />
          {b.level > 1 && (
            <a href={`#${b.id}`} className="heading-anchor" aria-label={`"${b.text}" ka link`}>
              #
            </a>
          )}
        </H>
      );
    }
    case "paragraph":
      return (
        <p>
          <Inlines c={b.c} links={links} />
        </p>
      );
    case "list": {
      const items = b.items.map((it, i) => <Item key={i} it={it} links={links} />);
      return b.ordered ? <ol start={b.start === 1 ? undefined : b.start}>{items}</ol> : <ul>{items}</ul>;
    }
    case "quote":
      return (
        <blockquote>
          <Markdown blocks={b.c} links={links} />
        </blockquote>
      );
    case "code":
      return (
        <div className="code-block">
          {b.lang && <span className="code-lang">{b.lang}</span>}
          <pre tabIndex={0}>
            <code>{b.v}</code>
          </pre>
          {b.v.trim() && <CopyCode text={b.v} />}
        </div>
      );
    case "table":
      return (
        <div className="table-wrap" role="region" aria-label="Table (side mein scroll ho sakti hai)" tabIndex={0}>
          <table>
            <thead>
              <tr>
                {b.head.map((c, i) => (
                  <th key={i} scope="col" style={b.align[i] ? { textAlign: b.align[i] } : undefined}>
                    <Inlines c={c} links={links} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i} style={b.align[i] ? { textAlign: b.align[i] } : undefined}>
                      <Inlines c={c} links={links} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr />;
  }
}

/** Tight list items: a first paragraph renders inline (no <p> margins). */
function Item({ it, links }: { it: ListItem; links: LinkOptions }) {
  const [first, ...rest] = it.c;
  const lead = first?.t === "paragraph" ? <Inlines c={first.c} links={links} /> : first ? <BlockView b={first} links={links} /> : null;
  return (
    <li className={it.task === null ? undefined : "task"}>
      {it.task !== null && (
        <span className="task-box" data-done={it.task}>
          <span className="sr-only">{it.task ? "Ho gaya: " : "Baaki: "}</span>
        </span>
      )}
      {lead}
      {rest.length > 0 && <Markdown blocks={rest} links={links} />}
    </li>
  );
}

function Inlines({ c, links }: { c: Inline[]; links: LinkOptions }) {
  return c.map((n, i) => {
    switch (n.t) {
      case "text":
        return n.v;
      case "code":
        return <code key={i}>{n.v}</code>;
      case "strong":
        return (
          <strong key={i}>
            <Inlines c={n.c} links={links} />
          </strong>
        );
      case "em":
        return (
          <em key={i}>
            <Inlines c={n.c} links={links} />
          </em>
        );
      case "del":
        return (
          <del key={i}>
            <Inlines c={n.c} links={links} />
          </del>
        );
      case "link": {
        const to = resolveDocLink(n.href, links);
        // A link whose text is just its relative path ("../roadmap.md") reads better as the repo path.
        const label = plainText(n.c);
        const kids =
          to.repoPath && (label === n.href || label.startsWith("../")) ? <code>{to.repoPath}</code> : <Inlines c={n.c} links={links} />;
        if (to.external) {
          return (
            <a key={i} href={to.href} target="_blank" rel="noopener noreferrer" className="external">
              {kids}
            </a>
          );
        }
        return to.href.startsWith("/") ? (
          <Link key={i} href={to.href}>
            {kids}
          </Link>
        ) : (
          <a key={i} href={to.href}>
            {kids}
          </a>
        );
      }
    }
  });
}

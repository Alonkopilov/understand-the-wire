import type { ReactNode } from "react";
import type { Fact, Language, Status } from "../lib/types.ts";
import { highlight } from "../lib/highlight.ts";

export function StatusDot({
  status,
  title,
}: {
  status: Status;
  title?: string;
}) {
  return (
    <span
      className={`dot dot-${status}`}
      title={title ?? status}
      aria-hidden="true"
    />
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Status | "neutral";
  children: ReactNode;
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `panel ${className}` : "panel"}>{children}</div>
  );
}

export function FactList({ facts }: { facts: Fact[] }) {
  if (facts.length === 0) return null;

  return (
    <dl className="facts">
      {facts.map((fact, index) => (
        <div className="fact" key={`${fact.label}-${index}`}>
          <dt>{fact.label}</dt>
          <dd className={fact.mono ? "mono" : undefined}>
            {fact.status ? <StatusDot status={fact.status} /> : null}
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * Matches an `*emphasised*` span. Deliberately not markdown: the only marker
 * the prose uses is a lead-in label ("*Important Note* - ..."), and the same
 * prose is full of globs (`al2023-ami-*-x86_64`, `/utw/prod/*`) that have to
 * survive as written. So an opener has to follow a space or a bracket, the span
 * has to open on a letter or digit, and it has to close before a space or
 * punctuation. Anything else is left as a literal asterisk.
 */
const EMPHASIS = /(^|[\s(])\*([\p{L}\p{N}][^*]*?)\*(?=$|[\s.,;:!?)])/gu;

function emphasise(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(EMPHASIS)) {
    const open = match.index + match[1].length;
    if (open > cursor) parts.push(text.slice(cursor, open));
    parts.push(<strong key={open}>{match[2]}</strong>);
    cursor = open + match[2].length + 2;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

/** One paragraph per entry, with `*...*` rendered bold. */
export function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="prose">
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{emphasise(paragraph)}</p>
      ))}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} style={{ width: `${90 - index * 12}%` }} />
      ))}
    </div>
  );
}

/**
 * Shown when an endpoint is missing rather than broken. Deliberately calm: an
 * unfinished backend is a normal state for this page, not an error.
 */
export function Unavailable({
  what,
  detail,
}: {
  what: string;
  detail?: string | null;
}) {
  return (
    <div className="unavailable">
      <StatusDot status="unknown" />
      <div>
        <p className="unavailable-title">{what} is not reporting yet</p>
        <p className="unavailable-detail">
          {detail ? detail : "The API endpoint is not answering."}
        </p>
      </div>
    </div>
  );
}

export function CodeBlock({
  code,
  language,
  path,
  url,
}: {
  code: string;
  language: Language;
  path?: string;
  url?: string;
}) {
  const lines = highlight(code, language);

  return (
    <figure className="code">
      {path ? (
        <figcaption>
          <span className="mono">{path}</span>
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              open on GitHub
            </a>
          ) : null}
        </figcaption>
      ) : null}
      <pre>
        <code>
          {lines.map((tokens, lineIndex) => (
            <span className="code-line" key={lineIndex}>
              <span className="code-gutter">{lineIndex + 1}</span>
              <span className="code-text">
                {tokens.map((token, tokenIndex) => (
                  <span className={`t-${token.kind}`} key={tokenIndex}>
                    {token.text}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}

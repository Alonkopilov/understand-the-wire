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

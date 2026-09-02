import { useEffect, useRef, useState } from "react";
import type { LiveContext, SourceFile } from "../lib/types.ts";
import type { MapNode, SourceRef } from "../data/topology.ts";
import { languageFor } from "../lib/api.ts";
import { useResource } from "../lib/useResource.ts";
import { CodeBlock, FactList, Prose, Skeleton, Unavailable } from "./ui.tsx";

type Tab = "why" | "code" | "live";

function CodeTab({ sources }: { sources: SourceRef[] }) {
  const [active, setActive] = useState(0);
  const path = sources[active]?.path ?? "";
  const file = useResource<SourceFile>(
    path ? `/source?path=${encodeURIComponent(path)}` : "",
  );

  if (sources.length === 0) {
    return (
      <p className="muted">
        This box is not created by any file in the repository.
      </p>
    );
  }

  return (
    <div className="code-tab">
      {sources.length > 1 ? (
        <div className="file-tabs" role="tablist" aria-label="Source files">
          {sources.map((source, index) => (
            <button
              type="button"
              role="tab"
              key={source.path}
              aria-selected={index === active}
              className={
                index === active ? "file-tab file-tab-active" : "file-tab"
              }
              onClick={() => setActive(index)}
            >
              {source.label}
            </button>
          ))}
        </div>
      ) : null}

      {file.status === "loading" ? <Skeleton rows={6} /> : null}

      {file.status === "unavailable" ? (
        <Unavailable
          what="Source"
          detail={`Wire up GET /api/source?path=${path} to show ${sources[active].label} here.`}
        />
      ) : null}

      {file.data ? (
        <CodeBlock
          code={file.data.content}
          language={file.data.language ?? languageFor(file.data.path)}
          path={file.data.path}
          url={file.data.url}
        />
      ) : null}
    </div>
  );
}

/**
 * Mounted with `key={node.id}` so switching nodes remounts it. That resets the
 * active tab and moves focus without an effect writing state during render.
 */
function InspectorPanel({
  node,
  live,
  onClose,
}: {
  node: MapNode;
  live: LiveContext;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("why");
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const facts = node.live ? node.live(live) : [];

  return (
    <>
      <div className="inspector-backdrop" onClick={onClose} />
      <aside
        className="inspector"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${node.label} details`}
      >
        <header className="inspector-head">
          <div>
            <h2>{node.label}</h2>
            {node.sublabel ? (
              <p className="muted mono">{node.sublabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="tabs" role="tablist" aria-label="Detail view">
          {(["why", "code", "live"] as Tab[]).map((id) => (
            <button
              type="button"
              role="tab"
              key={id}
              aria-selected={tab === id}
              className={tab === id ? "tab tab-active" : "tab"}
              onClick={() => setTab(id)}
            >
              {id === "why" ? "Why" : id === "code" ? "Code" : "Live"}
            </button>
          ))}
        </div>

        <div className="inspector-body">
          {tab === "why" ? (
            node.why.length > 0 ? (
              <Prose paragraphs={node.why} />
            ) : (
              <p className="muted">Not written yet.</p>
            )
          ) : null}

          {tab === "code" ? <CodeTab sources={node.sources} /> : null}

          {tab === "live" ? (
            facts.length > 0 ? (
              <FactList facts={facts} />
            ) : (
              <Unavailable
                what="Live state"
                detail="Either this box has no runtime state to report, or the API endpoint behind it is not answering yet."
              />
            )
          ) : null}
        </div>
      </aside>
    </>
  );
}

export function Inspector({
  node,
  live,
  onClose,
}: {
  node: MapNode | null;
  live: LiveContext;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!node) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [node, onClose]);

  if (!node) return null;

  return (
    <InspectorPanel key={node.id} node={node} live={live} onClose={onClose} />
  );
}

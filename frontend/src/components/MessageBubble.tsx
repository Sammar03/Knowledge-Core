import React, { useState } from "react";
import Markdown from "react-markdown";
import { AlertCircle, FileText } from "lucide-react";
import type { ChatMessage, Source } from "../types";

// Matches inline citations like [1], [2].
const CITE_RE = /\[(\d+)\]/g;

function CitationBadge({
  n,
  active,
  onClick,
}: {
  n: number;
  active: boolean;
  onClick: (n: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(n)}
      className={`mx-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 align-super text-[10px] font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
      }`}
      aria-label={`Show reference ${n}`}
    >
      {n}
    </button>
  );
}

/** Walk markdown text children and turn [n] tokens into clickable badges. */
function injectCitations(
  children: React.ReactNode,
  validIds: Set<number>,
  active: number | null,
  onClick: (n: number) => void
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child !== "string") return child;
    const parts: React.ReactNode[] = [];
    let last = 0;
    let m: RegExpExecArray | null;
    CITE_RE.lastIndex = 0;
    while ((m = CITE_RE.exec(child)) !== null) {
      const n = parseInt(m[1], 10);
      if (!validIds.has(n)) continue; // leave unknown numbers as literal text
      if (m.index > last) parts.push(child.slice(last, m.index));
      parts.push(
        <CitationBadge key={`${m.index}-${n}`} n={n} active={active === n} onClick={onClick} />
      );
      last = m.index + m[0].length;
    }
    if (parts.length === 0) return child;
    if (last < child.length) parts.push(child.slice(last));
    return parts;
  });
}

function ReferenceDetail({ source }: { source: Source }) {
  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
      <div className="mb-1 flex items-center gap-1.5 font-medium text-slate-700">
        <span className="flex h-4 min-w-[1rem] items-center justify-center rounded bg-slate-900 px-1 text-[10px] font-semibold text-white">
          {source.id}
        </span>
        <FileText className="h-3.5 w-3.5" />
        {source.filename}
        <span className="text-slate-400">p.{source.page}</span>
      </div>
      <p className="whitespace-pre-wrap leading-relaxed">{source.snippet}</p>
    </div>
  );
}

function References({
  sources,
  active,
  onToggle,
}: {
  sources: Source[];
  active: number | null;
  onToggle: (n: number) => void;
}) {
  return (
    <div className="mt-3 border-t border-slate-100 pt-2">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        References
      </p>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${
              active === s.id
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="font-semibold">{s.id}</span>
            <span className={active === s.id ? "" : "text-slate-400"}>
              {s.filename} p.{s.page}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const ungrounded = message.role === "assistant" && message.grounded === false;
  const sources = message.sources ?? [];
  const [openRef, setOpenRef] = useState<number | null>(null);

  const validIds = new Set(sources.map((s) => s.id));
  const toggle = (n: number) => setOpenRef((prev) => (prev === n ? null : n));
  const activeSource =
    openRef !== null ? sources.find((s) => s.id === openRef) : undefined;

  // Only surface references the answer actually cites; if it cited none, show all.
  const citedIds = new Set<number>();
  let cm: RegExpExecArray | null;
  CITE_RE.lastIndex = 0;
  while ((cm = CITE_RE.exec(message.content)) !== null) {
    const n = parseInt(cm[1], 10);
    if (validIds.has(n)) citedIds.add(n);
  }
  const displayedSources = citedIds.size
    ? sources.filter((s) => citedIds.has(s.id))
    : sources;

  const components = {
    p: ({ children }: { children?: React.ReactNode }) => (
      <p>{injectCitations(children, validIds, openRef, toggle)}</p>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li>{injectCitations(children, validIds, openRef, toggle)}</li>
    ),
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          isUser
            ? "bg-fog text-ink-black"
            : "border border-fog bg-paper text-ink-black"
        }`}
      >
        {ungrounded && (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <AlertCircle className="h-3.5 w-3.5" />
            Not found in documents
          </div>
        )}
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown components={components}>{message.content}</Markdown>
          )}
        </div>

        {activeSource && <ReferenceDetail source={activeSource} />}

        {!isUser && displayedSources.length > 0 && (
          <References sources={displayedSources} active={openRef} onToggle={toggle} />
        )}
      </div>
    </div>
  );
}

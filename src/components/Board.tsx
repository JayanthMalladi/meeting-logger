"use client";

import type { Extracted as ParsedExtracted, MeetingMeta } from "@/lib/types";

type Props = {
  extracted: ParsedExtracted;
  meta?: MeetingMeta;
  onSeek?: (ts: string) => void;
};

/**
 * Summary + decisions + actions table + open questions + at-risk flags.
 * Each item with a ts links to the transcript moment (onSeek).
 */
export default function Board({ extracted, meta, onSeek }: Props) {
  const tsBtn = (ts?: string) =>
    ts ? (
      <button
        type="button"
        onClick={() => onSeek?.(ts)}
        className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      >
        {ts}
      </button>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      {(meta?.title || meta?.kind || meta?.attendees) && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {meta?.title && <div className="font-semibold text-zinc-900 dark:text-zinc-100">{meta.title}</div>}
          {meta?.kind && <div>{meta.kind}</div>}
          {meta?.attendees && <div>{meta.attendees}</div>}
        </div>
      )}

      <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">{extracted.summary}</p>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Decisions ({extracted.decisions.length})
        </h2>
        {extracted.decisions.length ? (
          <ul className="flex flex-col gap-1.5">
            {extracted.decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm dark:text-zinc-100">
                <span className="text-emerald-600">✓</span>
                <span>
                  {d.text}
                  {tsBtn(d.ts)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No decisions captured.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Actions ({extracted.actions.length})
        </h2>
        {extracted.actions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm dark:text-zinc-100">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-400 dark:text-zinc-500">
                  <th className="py-1 pr-4">Task</th>
                  <th className="py-1 pr-4">Owner</th>
                  <th className="py-1 pr-4">Due</th>
                  <th className="py-1" />
                </tr>
              </thead>
              <tbody>
                {extracted.actions.map((a, i) => (
                  <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2 pr-4">{a.text}</td>
                    <td className="py-2 pr-4">{a.owner ?? <span className="text-amber-600">—</span>}</td>
                    <td className="py-2 pr-4">{a.due ?? "—"}</td>
                    <td className="py-2">{tsBtn(a.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No actions captured.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Open questions ({extracted.openQuestions.length})
        </h2>
        {extracted.openQuestions.length ? (
          <ul className="flex flex-col gap-1.5">
            {extracted.openQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm dark:text-zinc-100">
                <span className="text-sky-600">?</span>
                <span>
                  {q.text}
                  {tsBtn(q.ts)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No open questions.</p>
        )}
      </section>

      {extracted.atRisk.length > 0 && (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            ⚑ At risk
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-amber-900 dark:text-amber-200">
            {extracted.atRisk.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type {
  Action,
  Decision,
  Extracted,
  MeetingMeta,
  Question,
  Segment,
} from "@/lib/types";

type Props = {
  extracted: Extracted;
  meta: MeetingMeta;
  segments: Segment[]; // for source chips ¶ n when no ts
  onSelect(seg: number): void; // clicking a source chip
  editable: boolean; // false on the share page
  onChange(extracted: Extracted): void; // emit the whole edited board up
};

/** Small source chip: item ts if present, else `¶ {seg+1}`. */
function SourceChip({
  ts,
  seg,
  onSelect,
}: {
  ts?: string;
  seg?: number;
  onSelect: (seg: number) => void;
}) {
  if (seg === undefined) return null;
  const label = ts ?? `¶ ${seg + 1}`;
  return (
    <button
      type="button"
      onClick={() => onSelect(seg)}
      className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
    >
      {label}
    </button>
  );
}

type CellEdit = {
  section: "decisions" | "actions" | "questions";
  index: number;
  field: "text" | "owner" | "due";
  draft: string;
};

/**
 * B9: editable decision board.
 * Sections with counts, actions table (Task · Owner · Due · source), amber
 * at-risk box. Inline edit for text/owner/due when `editable`; delete ×.
 * Source chips click through to the transcript via `onSelect(seg)`.
 */
export default function Board({
  extracted,
  meta,
  onSelect,
  editable,
  onChange,
}: Props) {
  const [edit, setEdit] = useState<CellEdit | null>(null);

  const startEdit = (
    section: CellEdit["section"],
    index: number,
    field: CellEdit["field"],
    value: string,
  ) => {
    if (!editable) return;
    setEdit({ section, index, field, draft: value });
  };

  const commitEdit = () => {
    if (!edit) return;
    const { section, index, field, draft } = edit;
    let next: Extracted = { ...extracted };
    if (section === "decisions") {
      const decisions: Decision[] = next.decisions.map((d, i) =>
        i === index ? { ...d, text: draft.trim() } : d,
      );
      next = { ...next, decisions };
    } else if (section === "actions") {
      const actions: Action[] = next.actions.map((a, i) => {
        if (i !== index) return a;
        if (field === "text") return { ...a, text: draft.trim() };
        if (field === "owner") return { ...a, owner: draft.trim() || undefined };
        return { ...a, due: draft.trim() || undefined };
      });
      next = { ...next, actions };
    } else {
      const openQuestions: Question[] = next.openQuestions.map((q, i) =>
        i === index ? { ...q, text: draft.trim() } : q,
      );
      next = { ...next, openQuestions };
    }
    setEdit(null);
    onChange(next);
  };

  const cancelEdit = () => setEdit(null);

  const editInput = (cell: CellEdit) => (
    <input
      autoFocus
      value={cell.draft}
      onChange={(e) => setEdit({ ...cell, draft: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") cancelEdit();
      }}
      onBlur={commitEdit}
      className="w-full rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
    />
  );

  const deleteItem = (
    section: CellEdit["section"],
    index: number,
  ) => {
    if (!editable) return;
    const next: Extracted = { ...extracted };
    if (section === "decisions") next.decisions = extracted.decisions.filter((_, i) => i !== index);
    else if (section === "actions") next.actions = extracted.actions.filter((_, i) => i !== index);
    else next.openQuestions = extracted.openQuestions.filter((_, i) => i !== index);
    setEdit(null);
    onChange(next);
  };

  const isEditing = (
    section: CellEdit["section"],
    index: number,
    field: CellEdit["field"],
  ) =>
    edit?.section === section && edit.index === index && edit.field === field;

  const metaBits: string[] = [];
  if (meta.kind) metaBits.push(meta.kind);
  if (meta.date) metaBits.push(meta.date);
  if (meta.attendees) metaBits.push(meta.attendees);

  return (
    <div className="flex flex-col gap-5">
      {(meta.title || metaBits.length > 0) && (
        <div className="text-sm">
          {meta.title && (
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {meta.title}
            </div>
          )}
          {metaBits.length > 0 && (
            <div className="text-zinc-500 dark:text-zinc-400">{metaBits.join(" · ")}</div>
          )}
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
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-500">
                  ✓
                </span>
                {isEditing("decisions", i, "text") ? (
                  <div className="flex-1">{editInput({ section: "decisions", index: i, field: "text", draft: d.text })}</div>
                ) : (
                  <span
                    className="text-zinc-800 dark:text-zinc-100"
                    style={editable ? { cursor: "text" } : undefined}
                    onClick={() => startEdit("decisions", i, "text", d.text)}
                  >
                    {d.text}
                    <SourceChip ts={d.ts} seg={d.seg} onSelect={onSelect} />
                  </span>
                )}
                {editable && (
                  <button
                    type="button"
                    aria-label="Delete decision"
                    onClick={() => deleteItem("decisions", i)}
                    className="ml-auto shrink-0 rounded px-1 text-xs text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    ×
                  </button>
                )}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-zinc-400 dark:text-zinc-500">
                  <th className="py-1 pr-4">Task</th>
                  <th className="py-1 pr-4">Owner</th>
                  <th className="py-1 pr-4">Due</th>
                  <th className="py-1" aria-label="Source" />
                </tr>
              </thead>
              <tbody>
                {extracted.actions.map((a, i) => (
                  <tr key={i} className="border-t border-zinc-200 dark:border-zinc-800">
                    {isEditing("actions", i, "text") ? (
                      <td className="py-2 pr-4">{editInput({ section: "actions", index: i, field: "text", draft: a.text })}</td>
                    ) : (
                      <td
                        className="py-2 pr-4 text-zinc-800 dark:text-zinc-100"
                        style={editable ? { cursor: "text" } : undefined}
                        onClick={() => startEdit("actions", i, "text", a.text)}
                      >
                        {a.text}
                      </td>
                    )}
                    {isEditing("actions", i, "owner") ? (
                      <td className="py-2 pr-4">{editInput({ section: "actions", index: i, field: "owner", draft: a.owner ?? "" })}</td>
                    ) : (
                      <td
                        className="py-2 pr-4"
                        style={editable ? { cursor: "text" } : undefined}
                        onClick={() => startEdit("actions", i, "owner", a.owner ?? "")}
                      >
                        {a.owner ? (
                          <span className="text-zinc-800 dark:text-zinc-100">{a.owner}</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400">Unassigned</span>
                        )}
                      </td>
                    )}
                    {isEditing("actions", i, "due") ? (
                      <td className="py-2 pr-4">{editInput({ section: "actions", index: i, field: "due", draft: a.due ?? "" })}</td>
                    ) : (
                      <td
                        className="py-2 pr-4 text-zinc-800 dark:text-zinc-100"
                        style={editable ? { cursor: "text" } : undefined}
                        onClick={() => startEdit("actions", i, "due", a.due ?? "")}
                      >
                        {a.due ?? "-"}
                      </td>
                    )}
                    <td className="py-2 text-right">
                      <SourceChip ts={a.ts} seg={a.seg} onSelect={onSelect} />
                      {editable && (
                        <button
                          type="button"
                          aria-label="Delete action"
                          onClick={() => deleteItem("actions", i)}
                          className="ml-1 rounded px-1 text-xs text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          ×
                        </button>
                      )}
                    </td>
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
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400">?</span>
                {isEditing("questions", i, "text") ? (
                  <div className="flex-1">{editInput({ section: "questions", index: i, field: "text", draft: q.text })}</div>
                ) : (
                  <span
                    className="text-zinc-800 dark:text-zinc-100"
                    style={editable ? { cursor: "text" } : undefined}
                    onClick={() => startEdit("questions", i, "text", q.text)}
                  >
                    {q.text}
                    <SourceChip ts={q.ts} seg={q.seg} onSelect={onSelect} />
                  </span>
                )}
                {editable && (
                  <button
                    type="button"
                    aria-label="Delete question"
                    onClick={() => deleteItem("questions", i)}
                    className="ml-auto shrink-0 rounded px-1 text-xs text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    ×
                  </button>
                )}
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
            ⚑ At risk ({extracted.atRisk.length})
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

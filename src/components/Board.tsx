"use client";

import { useState, type ReactNode } from "react";
import type {
  Action,
  Decision,
  Extracted,
  InputMode,
  MeetingMeta,
  Question,
  Segment,
} from "@/lib/types";
import { card, sectionHeading } from "./ui";

type Props = {
  extracted: Extracted;
  meta: MeetingMeta;
  segments: Segment[]; // for source chips ¶ n when no ts
  onSelect(seg: number): void; // clicking a source chip
  editable: boolean; // false on the share page
  onChange(extracted: Extracted): void; // emit the whole edited board up
  /** Segment currently highlighted in the transcript; matching rows get a tint. */
  selectedSeg?: number | null;
};

const SOURCE_LABEL: Record<InputMode, string> = {
  dictated: "Dictated",
  recorded: "Recorded",
  uploaded: "Uploaded audio",
  sample: "Sample audio",
};

function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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
  const label = ts ?? `¶${seg + 1}`;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(seg);
      }}
      aria-label={ts ? `Jump to ${ts}` : `Show source sentence ${seg + 1}`}
      title={ts ? "Play from here" : "Show source sentence"}
      className="shrink-0 rounded px-1 py-0.5 font-mono text-[10px] text-zinc-500 transition hover:bg-emerald-100 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:text-zinc-400 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200"
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

const rowBase =
  "group flex items-start gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/30";
const rowSel = "bg-emerald-50 dark:bg-emerald-950/40";
const pillBase =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";
const pillOwner = `${pillBase} bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200`;
const pillUnassigned = `${pillBase} bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`;
const delBtn =
  "shrink-0 rounded px-1 text-sm leading-none text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 dark:hover:bg-zinc-700 dark:hover:text-zinc-200";

/**
 * B9: editable decision board (Ledger style).
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
  selectedSeg,
}: Props) {
  const [edit, setEdit] = useState<CellEdit | null>(null);

  const startEdit = (
    section: CellEdit["section"],
    index: number,
    field: CellEdit["field"],
    value: string,
    seg?: number,
  ) => {
    // On wide screens the transcript sits beside the board, so selecting
    // the item's sentence never moves the page; on narrow ones it would.
    if (seg !== undefined && window.matchMedia("(min-width: 1024px)").matches) onSelect(seg);
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

  // `cell` only identifies which field is open; the live draft lives in `edit` state.
  const editInput = (cell: CellEdit, label: string) => {
    const live = edit ?? cell;
    return (
    <input
      autoFocus
      aria-label={label}
      value={live.draft}
      onChange={(e) => setEdit({ ...live, draft: e.target.value })}
      onKeyDown={(e) => {
        if (e.key === "Enter") commitEdit();
        if (e.key === "Escape") cancelEdit();
      }}
      onBlur={commitEdit}
      className="w-full min-w-0 rounded-md border border-emerald-500 bg-white px-1.5 py-0.5 text-[13px] text-zinc-900 outline-none ring-2 ring-emerald-500/25 dark:bg-zinc-950 dark:text-zinc-100"
    />
    );
  };

  const deleteItem = (section: CellEdit["section"], index: number) => {
    if (!editable) return;
    const next: Extracted = { ...extracted };
    if (section === "decisions") next.decisions = extracted.decisions.filter((_, i) => i !== index);
    else if (section === "actions") next.actions = extracted.actions.filter((_, i) => i !== index);
    else next.openQuestions = extracted.openQuestions.filter((_, i) => i !== index);
    setEdit(null);
    onChange(next);
  };

  const isEditing = (section: CellEdit["section"], index: number, field: CellEdit["field"]) =>
    edit?.section === section && edit.index === index && edit.field === field;

  const isSel = (seg?: number) =>
    seg !== undefined && selectedSeg !== null && selectedSeg !== undefined && seg === selectedSeg;

  const editableCls = editable ? "cursor-text" : "";

  const metaBits: string[] = [];
  if (meta.kind) metaBits.push(meta.kind);
  if (meta.attendees) metaBits.push(meta.attendees);
  if (meta.source) metaBits.push(SOURCE_LABEL[meta.source]);

  const dateLabel = formatDate(meta.date);
  const headline = [meta.title ?? "Decision board", dateLabel].filter(Boolean).join(" · ");

  const heading = (color: string, text: string, count: number, tone?: string): ReactNode => (
    <h2 className={`${sectionHeading} ${tone ?? ""}`}>
      <i className={`inline-block h-2 w-2 rounded-sm ${color}`} aria-hidden />
      {text} · {count}
    </h2>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {headline}
        </h2>
        {metaBits.length > 0 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">{metaBits.join(" · ")}</span>
        )}
      </div>

      {extracted.summary && (
        <p className="fade-in text-[13px] leading-6 text-zinc-600 dark:text-zinc-300">
          {extracted.summary}
        </p>
      )}

      <div className={`${card} flex flex-col gap-4`}>
        <section className="fade-in" style={{ animationDelay: "0ms" }}>
          {heading("bg-emerald-500", "Decisions", extracted.decisions.length)}
          {extracted.decisions.length ? (
            <ul className="flex flex-col">
              {extracted.decisions.map((d, i) => (
                <li key={i} className={`${rowBase} ${isSel(d.seg) ? rowSel : ""}`}>
                  <span aria-hidden className="mt-px shrink-0 text-emerald-600 dark:text-emerald-500">
                    ✓
                  </span>
                  {isEditing("decisions", i, "text") ? (
                    <div className="min-w-0 flex-1">
                      {editInput({ section: "decisions", index: i, field: "text", draft: d.text }, "Edit decision")}
                    </div>
                  ) : (
                    <span
                      className={`min-w-0 flex-1 text-zinc-800 dark:text-zinc-100 ${editableCls}`}
                      onClick={() => startEdit("decisions", i, "text", d.text, d.seg)}
                    >
                      {d.text}
                    </span>
                  )}
                  <SourceChip ts={d.ts} seg={d.seg} onSelect={onSelect} />
                  {editable && (
                    <button type="button" aria-label="Delete decision" onClick={() => deleteItem("decisions", i)} className={delBtn}>
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 text-[13px] text-zinc-400 dark:text-zinc-500">No decisions captured.</p>
          )}
        </section>

        <section className="fade-in" style={{ animationDelay: "120ms" }}>
          {heading("bg-zinc-900 dark:bg-zinc-200", "Actions", extracted.actions.length)}
          {extracted.actions.length ? (
            <table className="w-full text-[13px]">
              <thead className="sr-only sm:not-sr-only">
                <tr className="text-left text-[10px] font-medium uppercase tracking-[0.06em] text-zinc-400 dark:text-zinc-500">
                  <th className="px-2 pb-1 font-medium">Task</th>
                  <th className="px-2 pb-1 font-medium">Owner</th>
                  <th className="px-2 pb-1 font-medium">Due</th>
                  <th className="pb-1" aria-label="Source" />
                </tr>
              </thead>
              <tbody>
                {extracted.actions.map((a, i) => (
                  <tr
                    key={i}
                    className={`group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-0 py-1.5 transition-colors hover:bg-emerald-50 sm:table-row dark:hover:bg-emerald-950/30 ${
                      isSel(a.seg) ? rowSel : ""
                    }`}
                  >
                    {isEditing("actions", i, "text") ? (
                      <td className="basis-full px-2 sm:table-cell sm:basis-auto">
                        {editInput({ section: "actions", index: i, field: "text", draft: a.text }, "Edit task")}
                      </td>
                    ) : (
                      <td
                        className={`basis-full px-2 text-zinc-800 sm:table-cell sm:basis-auto sm:rounded-l-lg sm:py-1.5 dark:text-zinc-100 ${editableCls}`}
                        onClick={() => startEdit("actions", i, "text", a.text, a.seg)}
                      >
                        {a.text}
                      </td>
                    )}
                    {isEditing("actions", i, "owner") ? (
                      <td className="px-2 sm:table-cell">
                        {editInput({ section: "actions", index: i, field: "owner", draft: a.owner ?? "" }, "Edit owner")}
                      </td>
                    ) : (
                      <td
                        className={`px-2 sm:table-cell sm:whitespace-nowrap ${editableCls}`}
                        onClick={() => startEdit("actions", i, "owner", a.owner ?? "", a.seg)}
                      >
                        {a.owner ? (
                          <span className={pillOwner}>
                            {a.owner}
                            {editable && <span aria-hidden className="hidden text-zinc-400 group-hover:inline">✎</span>}
                          </span>
                        ) : (
                          <span className={pillUnassigned}>Unassigned</span>
                        )}
                      </td>
                    )}
                    {isEditing("actions", i, "due") ? (
                      <td className="px-2 sm:table-cell">
                        {editInput({ section: "actions", index: i, field: "due", draft: a.due ?? "" }, "Edit due date")}
                      </td>
                    ) : (
                      <td
                        className={`px-2 sm:table-cell sm:whitespace-nowrap ${editableCls}`}
                        onClick={() => startEdit("actions", i, "due", a.due ?? "", a.seg)}
                      >
                        <span className={pillOwner}>{a.due ?? "–"}</span>
                      </td>
                    )}
                    <td className="ml-auto px-2 text-right sm:table-cell sm:whitespace-nowrap sm:rounded-r-lg">
                      <SourceChip ts={a.ts} seg={a.seg} onSelect={onSelect} />
                      {editable && (
                        <button type="button" aria-label="Delete action" onClick={() => deleteItem("actions", i)} className={`${delBtn} ml-1`}>
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-2 text-[13px] text-zinc-400 dark:text-zinc-500">No actions captured.</p>
          )}
        </section>

        <section className="fade-in" style={{ animationDelay: "240ms" }}>
          {heading("bg-sky-500", "Open questions", extracted.openQuestions.length)}
          {extracted.openQuestions.length ? (
            <ul className="flex flex-col">
              {extracted.openQuestions.map((q, i) => (
                <li key={i} className={`${rowBase} ${isSel(q.seg) ? rowSel : ""}`}>
                  <span aria-hidden className="mt-px shrink-0 font-semibold text-sky-600 dark:text-sky-400">
                    ?
                  </span>
                  {isEditing("questions", i, "text") ? (
                    <div className="min-w-0 flex-1">
                      {editInput({ section: "questions", index: i, field: "text", draft: q.text }, "Edit question")}
                    </div>
                  ) : (
                    <span
                      className={`min-w-0 flex-1 text-zinc-800 dark:text-zinc-100 ${editableCls}`}
                      onClick={() => startEdit("questions", i, "text", q.text, q.seg)}
                    >
                      {q.text}
                    </span>
                  )}
                  <SourceChip ts={q.ts} seg={q.seg} onSelect={onSelect} />
                  {editable && (
                    <button type="button" aria-label="Delete question" onClick={() => deleteItem("questions", i)} className={delBtn}>
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 text-[13px] text-zinc-400 dark:text-zinc-500">No open questions.</p>
          )}
        </section>

        {extracted.atRisk.length > 0 && (
          <section
            className="fade-in rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
            style={{ animationDelay: "360ms" }}
          >
            <h2 className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-amber-800 dark:text-amber-400">
              <i className="inline-block h-2 w-2 rounded-sm bg-amber-500" aria-hidden />
              At risk · {extracted.atRisk.length}
            </h2>
            <ul className="flex flex-col gap-1 text-[13px] text-amber-900 dark:text-amber-200">
              {extracted.atRisk.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>⚑</span>
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

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
import { sectionHeading } from "./ui";

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
      className="shrink-0 rounded-full bg-black/[0.05] px-2 py-0.5 font-mono text-[10px] text-zinc-500 transition hover:bg-[#ece6ff] hover:text-[#4b3a9a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF]/60 dark:bg-white/10 dark:text-zinc-400 dark:hover:bg-[#2a2542] dark:hover:text-[#cfc4ff]"
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

const rowSel = "!border-[#6E56CF]/50 !bg-[#f1ecff] dark:!bg-[#2a2542]";
const pillBase =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium";
const pillDue = `${pillBase} bg-black/[0.05] text-zinc-700 dark:bg-white/10 dark:text-zinc-200`;
const pillUnassigned = `${pillBase} border border-dashed border-amber-400 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300`;
const delBtn =
  "shrink-0 rounded-full px-1.5 text-sm leading-none text-zinc-400 hover:bg-black/10 hover:text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF]/60 dark:hover:bg-white/15 dark:hover:text-zinc-200";
const itemCard =
  "group flex items-start gap-3 rounded-2xl border border-black/[0.06] bg-white px-4 py-3 text-[14px] shadow-[0_4px_20px_-10px_rgba(40,30,80,0.15)] transition-colors hover:border-[#6E56CF]/30 dark:border-white/10 dark:bg-[#17161C]";

const AVATAR = [
  "bg-[#ece6ff] text-[#4b3a9a] dark:bg-[#2a2542] dark:text-[#cfc4ff]",
  "bg-[#ffe6d6] text-[#8a4a24] dark:bg-[#3a2a22] dark:text-[#ffc9a8]",
  "bg-[#dff0ff] text-[#1f5a85] dark:bg-[#1d2f3d] dark:text-[#a9d6f5]",
  "bg-[#dcf5e4] text-[#25663d] dark:bg-[#1d3326] dark:text-[#a6e3bb]",
  "bg-[#ffe0ec] text-[#8a2b55] dark:bg-[#3a2230] dark:text-[#f5b0cc]",
];

function Avatar({ name }: { name: string }) {
  let h = 0;
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <span
      aria-hidden
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${AVATAR[h % AVATAR.length]}`}
    >
      {initials}
    </span>
  );
}

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
      className="w-full min-w-0 rounded-full border border-[#6E56CF] bg-white px-3 py-1 text-[13px] text-zinc-900 outline-none ring-2 ring-[#6E56CF]/25 dark:bg-[#0E0D12] dark:text-zinc-100"
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

  const heading = (dot: string, text: string, count: number): ReactNode => (
    <h2 className={sectionHeading}>
      <i className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
      {text}
      <span className="font-sans text-xs text-zinc-400 dark:text-zinc-500">{count}</span>
    </h2>
  );

  const textCell = (
    section: CellEdit["section"],
    i: number,
    value: string,
    seg: number | undefined,
    label: string,
  ) =>
    isEditing(section, i, "text") ? (
      <div className="min-w-0 flex-1">
        {editInput({ section, index: i, field: "text", draft: value }, label)}
      </div>
    ) : (
      <span
        className={`min-w-0 flex-1 leading-snug text-zinc-800 dark:text-zinc-100 ${editableCls}`}
        onClick={() => startEdit(section, i, "text", value, seg)}
      >
        {value}
      </span>
    );

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="font-serif text-[34px] leading-[1.05] tracking-[-0.015em] text-zinc-900 sm:text-[44px] dark:text-zinc-50">
          {headline}
        </h2>
        {metaBits.length > 0 && (
          <span className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">{metaBits.join(" · ")}</span>
        )}
        {extracted.summary && (
          <p className="fade-in mt-3 max-w-2xl text-[15px] leading-7 text-zinc-600 dark:text-zinc-300">
            {extracted.summary}
          </p>
        )}
      </div>

      <section className="fade-in" style={{ animationDelay: "0ms" }}>
        {heading("bg-[#8fd6a8]", "Decisions", extracted.decisions.length)}
        {extracted.decisions.length ? (
          <ul className="flex flex-col gap-2.5">
            {extracted.decisions.map((d, i) => (
              <li key={i} className={`${itemCard} ${isSel(d.seg) ? rowSel : ""}`}>
                <span className="mt-px shrink-0 rounded-full bg-[#dcf5e4] px-2.5 py-0.5 text-[11px] font-semibold text-[#25663d] dark:bg-[#1d3326] dark:text-[#a6e3bb]">
                  Decided
                </span>
                {textCell("decisions", i, d.text, d.seg, "Edit decision")}
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
          <p className="px-1 text-[13px] text-zinc-400 dark:text-zinc-500">No decisions captured.</p>
        )}
      </section>

      <section className="fade-in" style={{ animationDelay: "120ms" }}>
        {heading("bg-[#6E56CF]", "Actions", extracted.actions.length)}
        {extracted.actions.length ? (
          <ul className="flex flex-col gap-2.5">
            {extracted.actions.map((a, i) => (
              <li
                key={i}
                className={`${itemCard} flex-wrap items-center sm:flex-nowrap ${isSel(a.seg) ? rowSel : ""}`}
              >
                {isEditing("actions", i, "text") ? (
                  <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
                    {editInput({ section: "actions", index: i, field: "text", draft: a.text }, "Edit task")}
                  </div>
                ) : (
                  <span
                    className={`min-w-0 basis-full leading-snug text-zinc-800 sm:flex-1 sm:basis-0 dark:text-zinc-100 ${editableCls}`}
                    onClick={() => startEdit("actions", i, "text", a.text, a.seg)}
                  >
                    {a.text}
                  </span>
                )}
                {isEditing("actions", i, "owner") ? (
                  <div className="w-40 shrink-0">
                    {editInput({ section: "actions", index: i, field: "owner", draft: a.owner ?? "" }, "Edit owner")}
                  </div>
                ) : (
                  <span
                    className={`shrink-0 whitespace-nowrap ${editableCls}`}
                    onClick={() => startEdit("actions", i, "owner", a.owner ?? "", a.seg)}
                  >
                    {a.owner ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] py-0.5 pl-0.5 pr-2.5 text-[12px] font-medium text-zinc-700 dark:bg-white/[0.07] dark:text-zinc-200">
                        <Avatar name={a.owner} />
                        {a.owner}
                      </span>
                    ) : (
                      <span className={pillUnassigned}>Unassigned</span>
                    )}
                  </span>
                )}
                {isEditing("actions", i, "due") ? (
                  <div className="w-32 shrink-0">
                    {editInput({ section: "actions", index: i, field: "due", draft: a.due ?? "" }, "Edit due date")}
                  </div>
                ) : (
                  <span
                    className={`shrink-0 whitespace-nowrap ${editableCls}`}
                    onClick={() => startEdit("actions", i, "due", a.due ?? "", a.seg)}
                  >
                    <span className={pillDue}>{a.due ? `Due ${a.due}` : "No date"}</span>
                  </span>
                )}
                <span className="ml-auto flex shrink-0 items-center gap-1">
                  <SourceChip ts={a.ts} seg={a.seg} onSelect={onSelect} />
                  {editable && (
                    <button type="button" aria-label="Delete action" onClick={() => deleteItem("actions", i)} className={delBtn}>
                      ×
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-1 text-[13px] text-zinc-400 dark:text-zinc-500">No actions captured.</p>
        )}
      </section>

      <section className="fade-in" style={{ animationDelay: "240ms" }}>
        {heading("bg-[#C9B8FF]", "Open questions", extracted.openQuestions.length)}
        {extracted.openQuestions.length ? (
          <ul className="flex flex-col gap-2.5">
            {extracted.openQuestions.map((q, i) => (
              <li
                key={i}
                className={`${itemCard} !border-[#C9B8FF]/50 !bg-[#f6f2ff] dark:!border-[#6E56CF]/30 dark:!bg-[#1d1a2b] ${isSel(q.seg) ? rowSel : ""}`}
              >
                <span aria-hidden className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#ece6ff] text-xs font-semibold text-[#4b3a9a] dark:bg-[#2a2542] dark:text-[#cfc4ff]">
                  ?
                </span>
                {textCell("questions", i, q.text, q.seg, "Edit question")}
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
          <p className="px-1 text-[13px] text-zinc-400 dark:text-zinc-500">No open questions.</p>
        )}
      </section>

      {extracted.atRisk.length > 0 && (
        <section
          className="fade-in rounded-3xl border border-[#ffd3b8] bg-[#fff1e6] p-5 dark:border-[#5a3a28] dark:bg-[#2a1d16]"
          style={{ animationDelay: "360ms" }}
        >
          <h2 className="mb-2 flex items-center gap-2 font-serif text-2xl text-[#8a4a24] dark:text-[#ffc9a8]">
            <i className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff9d6c]" aria-hidden />
            At risk
            <span className="font-sans text-xs opacity-70">{extracted.atRisk.length}</span>
          </h2>
          <ul className="flex flex-col gap-1.5 text-[14px] text-[#6b3a1c] dark:text-[#ffd9c2]">
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
  );
}

import type { Extracted, MeetingMeta } from "./types";

/** Board → Markdown for "Copy as Markdown" (contract — SPEC §4). */
export function toMarkdown(extracted: Extracted, meta: MeetingMeta = {}, shareUrl?: string): string {
  const out: string[] = [];
  out.push(`# ${meta.title || "Meeting board"}`);
  const sub = [meta.kind, meta.date, meta.attendees].filter(Boolean).join(" · ");
  if (sub) out.push(`_${sub}_`);
  out.push("", extracted.summary);
  if (extracted.decisions.length) {
    out.push("", "## Decisions");
    for (const d of extracted.decisions) out.push(`- ${d.text}${d.ts ? ` (${d.ts})` : ""}`);
  }
  if (extracted.actions.length) {
    out.push("", "## Actions", "| Task | Owner | Due |", "| --- | --- | --- |");
    for (const a of extracted.actions)
      out.push(`| ${a.text.replace(/\|/g, "\\|")} | ${a.owner ?? "unassigned"} | ${a.due ?? "-"} |`);
  }
  if (extracted.openQuestions.length) {
    out.push("", "## Open questions");
    for (const q of extracted.openQuestions) out.push(`- ${q.text}`);
  }
  if (extracted.atRisk.length) {
    out.push("", "## At risk");
    for (const r of extracted.atRisk) out.push(`- ${r}`);
  }
  if (shareUrl) out.push("", `[Open the board](${shareUrl})`);
  return out.join("\n");
}

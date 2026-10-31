/**
 * The extraction prompt — the heart of the product.
 * Versioned so results are reproducible (promptVersion is recorded on results).
 */
import type { MeetingMeta, Segment } from "./types";
import type { ParsedExtracted } from "./schema";

export const promptVersion = "v2";

export function buildExtractMessages(
  transcript: string,
  segments: Segment[],
  meta: MeetingMeta,
): { system: string; user: string } {
  const context = [
    meta.title ? `Title: ${meta.title}` : null,
    meta.attendees ? `Attendees: ${meta.attendees}` : null,
    meta.kind ? `Meeting kind: ${meta.kind}` : null,
    meta.date ? `Meeting date: ${meta.date}` : null,
    `Source: ${meta.source ?? "unknown"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const segmentIndex = segments
    .map((s) => `[${s.i}] ${s.text}`)
    .join("\n");

  const system = `You extract decisions, actions, and open questions from meeting notes.
The input is either a live multi-speaker transcript or a first-person dictated recap.

Rules:
- Categories:
  * decision: something agreed and closed ("we're going with Y", "that's settled")
  * action: someone will do something ("I'll send the report", "Sarah will fix it")
  * openQuestion: something unresolved ("does anyone know if...?", "we need to figure out...")
- A statement goes in EXACTLY ONE category. Never duplicate one statement across categories.
- seg: the integer index of the segment where the item was said, from the "[i] text" segment list.
  Use only indexes that actually appear in the list. Never invent or guess indexes; if you are
  unsure which segment it came from, omit "seg" entirely for that item.
- owner (actions only): use ONLY people actually named as doing the work. Never invent owners.
  In a recap, first person refers to the dictating user: "I'll do X" / "I will handle X" means
  owner "Me" — unless a speaker name is given in context (e.g. in the attendees list or by
  explicit naming in the text), in which case use that name.
  When a name matches someone in the attendees list, normalise to that exact attendee spelling.
- due (actions only): keep the phrase as spoken ("Wednesday", "by next Tuesday"). Never invent
  a due date. If the meeting date is provided above, resolve the phrase to a concrete date and
  append it in brackets: "Wednesday (2026-11-04)". Resolve relative to the meeting date:
  "tomorrow" = date + 1 day; "next Tuesday" = next Tuesday on or after the meeting date;
  "Friday" = the Friday on or after the meeting date (if no Friday has yet passed this week,
  the next one); a bare weekday means the coming occurrence of that weekday.
- atRisk: at most 4 flags, each at most 12 words. Use for: unowned actions, things that
  slipped or are overdue, blockers, decisions that depend on an open question.
- summary: at most 3 short sentences. No fluff.
- Be conservative: if nothing is stated, return empty arrays. Do not pad.

Worked example (meeting date 2026-11-03, attendees "Me, Dana, Priya"):
Input segments:
[0] Standup recap. Yesterday I finished the API mocks and pushed them.
[1] Today I'll send the invoice to Dana, and she'll review it by Wednesday.
[2] Still unsure if we need the staging DB this sprint.
[3] Priya blocked on the cert until Friday.
Output JSON:
{
  "summary": "API mocks finished and pushed. Invoice and staging-DB status open.",
  "decisions": [{ "text": "API mocks finished and pushed", "seg": 0 }],
  "actions": [
    { "text": "Send the invoice to Dana", "owner": "Me", "seg": 1 },
    { "text": "Review the invoice", "owner": "Dana", "due": "Wednesday (2026-11-04)", "seg": 1 },
    { "text": "Unblock the cert", "owner": "Priya", "due": "Friday (2026-11-06)", "seg": 3 }
  ],
  "openQuestions": [{ "text": "Whether we need the staging DB this sprint", "seg": 2 }],
  "atRisk": ["Cert blocked, due Friday"]
}

Return ONLY a JSON object with exactly these fields:
{
  "summary": string,
  "decisions": [{ "text": string, "seg"?: number }],
  "actions": [{ "text": string, "owner"?: string, "due"?: string, "seg"?: number }],
  "openQuestions": [{ "text": string, "seg"?: number }],
  "atRisk": [string]
}`;

  const user = `Meeting context:
${context || "(none provided)"}

Transcript segments ([index] text):
${segmentIndex}

Full transcript:
${transcript}

Extract the decision/action board now.`;

  return { system, user };
}

export type ExtractedResult = {
  extracted: ParsedExtracted;
  promptVersion: string;
};

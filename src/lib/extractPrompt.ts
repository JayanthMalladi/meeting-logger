/**
 * The extraction prompt — the heart of the product.
 * Versioned so results are reproducible (promptVersion is recorded on results).
 */
import type { MeetingMeta, Segment } from "./types";
import type { ParsedExtracted } from "./schema";

export const promptVersion = "v1";

export function buildExtractMessages(
  transcript: string,
  segments: Segment[],
  meta: MeetingMeta,
): { system: string; user: string } {
  const context = [
    meta.title ? `Title: ${meta.title}` : null,
    meta.attendees ? `Attendees: ${meta.attendees}` : null,
    meta.kind ? `Meeting kind: ${meta.kind}` : null,
    `Source: ${meta.source ?? "unknown"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const segmentIndex = segments
    .map((s) => `[${s.i}] ${s.text}`)
    .join("\n");

  const system = `You extract decisions, actions, and open questions from meeting transcripts.

Rules:
- Classify every commitment into exactly one category:
  * decision: something agreed and closed ("we will do X", "we're going with Y")
  * action: something someone will do ("I'll send the report", "Sarah will fix it")
  * open question: something unresolved ("does anyone know if...?", "we need to figure out...")
- For actions, capture owner and due date ONLY when actually stated in the transcript. Never invent owners or dates.
- atRisk: up to 4 short, concrete flags — overdue items, blocked decisions, unowned actions.
- Every item carries seg: the integer index of the segment where it was said, from the segment list.
- summary: at most 3 lines, no fluff.
- Be conservative: if nothing is stated, return empty arrays. Do not pad.

Return ONLY a JSON object with exactly these fields:
{
  "summary": string,
  "decisions": [{ "text": string, "seg": number }],
  "actions": [{ "text": string, "owner"?: string, "due"?: string, "seg": number }],
  "openQuestions": [{ "text": string, "seg": number }],
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { ProviderError, chatJson, hasProviderKey } from "@/lib/groq";
import { buildExtractMessages, promptVersion } from "@/lib/extractPrompt";
import { validateExtracted, ParsedExtracted } from "@/lib/schema";
import type { Extracted, MeetingMeta, Segment } from "@/lib/types";
import { formatTs } from "@/lib/audio";
import { isMock, mockExtract } from "@/lib/mock";

/** Attach mm:ss from the referenced segment (audio only); drop out-of-range seg. */
function attachTs(e: ParsedExtracted, segments: Segment[]): Extracted {
  const fix = <T extends { seg?: number }>(it: T): T & { ts?: string } => {
    const s = it.seg !== undefined ? segments[it.seg] : undefined;
    if (!s) return { ...it, seg: undefined };
    return s.start !== undefined ? { ...it, ts: formatTs(s.start) } : it;
  };
  return { ...e, decisions: e.decisions.map(fix), actions: e.actions.map(fix), openQuestions: e.openQuestions.map(fix) };
}

/** Zod schema for the request body: transcript ≤ 60k chars, ≤ 2000 segments with numeric i. */
const segmentSchema = z
  .object({
    i: z.number(),
    text: z.string(),
    start: z.number().optional(),
    end: z.number().optional(),
  })
  .passthrough();
const metaSchema = z
  .object({
    title: z.string().optional(),
    attendees: z.string().optional(),
    kind: z.string().optional(),
    date: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();
const extractRequestSchema = z.object({
  transcript: z.string().max(60_000),
  segments: z.array(segmentSchema).max(2_000),
  meta: metaSchema.optional(),
});

/** Valid empty board returned when the transcript trims to fewer than 3 words. */
const EMPTY_BOARD: ParsedExtracted = {
  summary: "",
  decisions: [],
  actions: [],
  openQuestions: [],
  atRisk: [],
};

/** Clamp atRisk to the first 4 entries (post-validation safety net; schema allows 6). */
function clampAtRisk(e: ParsedExtracted): ParsedExtracted {
  return { ...e, atRisk: e.atRisk.slice(0, 4) };
}

/** Defensively re-index segments: overwrite each `i` with its 0-based array position. */
function reindexSegments(segments: z.infer<typeof segmentSchema>[]): Segment[] {
  return segments.map((s, idx) => ({
    i: idx,
    text: s.text,
    ...(s.start !== undefined ? { start: s.start } : {}),
    ...(s.end !== undefined ? { end: s.end } : {}),
  }));
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * POST /api/extract
 * In:  { transcript: string, segments: Segment[], meta: MeetingMeta }
 * Out: { extracted: ParsedExtracted, promptVersion }
 *
 * Status codes (SPEC §4.2): 400 bad input, 422 invalid LLM output after retry,
 * 503 no key, 502 provider error.
 */
export async function POST(req: Request) {
  // Mock mode: return fixture board with a small delay (no validation, no key needed).
  if (isMock()) {
    const b = await req.json().catch(() => null);
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ extracted: mockExtract(Array.isArray(b?.segments) ? b.segments : []), promptVersion: "mock" });
  }

  // No provider key → 503 (checked before parsing so the error message matches the SPEC table).
  if (!hasProviderKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured. Add it to .env.local to enable extraction." },
      { status: 503 },
    );
  }

  // Parse and validate the request body with zod → 400 on any failure.
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON: { transcript: string, segments: Segment[], meta?: MeetingMeta }." },
      { status: 400 },
    );
  }

  const parsed = extractRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .slice(0, 5)
      .join("; ");
    return NextResponse.json(
      {
        error: `Invalid request: ${details}. Expected transcript ≤ 60000 chars, segments ≤ 2000 (each with numeric "i" and string "text"), optional meta object.`,
      },
      { status: 400 },
    );
  }

  const { transcript, meta } = parsed.data;
  const segments = reindexSegments(parsed.data.segments);

  // Empty-board short-circuit: fewer than 3 words → skip the LLM entirely.
  if (countWords(transcript) < 3) {
    return NextResponse.json({ extracted: EMPTY_BOARD, promptVersion });
  }

  const messages = buildExtractMessages(transcript, segments, (meta ?? {}) as MeetingMeta);

  try {
    const rawOutput = await chatJson<unknown>([
      { role: "system", content: messages.system },
      { role: "user", content: messages.user },
    ]);

    let extracted: ParsedExtracted;
    try {
      extracted = clampAtRisk(validateExtracted(rawOutput));
    } catch (validationErr) {
      // One retry with the validation error appended
      const retryUser =
        messages.user +
        `\n\nYour previous reply failed validation: ${String(validationErr).slice(0, 400)}\nReply again with valid JSON only.`;
      const rawRetry = await chatJson<unknown>([
        { role: "system", content: messages.system },
        { role: "user", content: retryUser },
      ]);
      extracted = clampAtRisk(validateExtracted(rawRetry));
    }

    return NextResponse.json({ extracted: attachTs(extracted, segments), promptVersion });
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json(
        { error: err.message, upstreamStatus: err.upstreamStatus },
        { status: 502 },
      );
    }
    if (err instanceof Error && err.name === "ZodError") {
      return NextResponse.json(
        { error: "Extraction returned an invalid shape after retry. Please try again." },
        { status: 422 },
      );
    }
    console.error("extract failed:", err);
    return NextResponse.json(
      { error: "Extraction failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}

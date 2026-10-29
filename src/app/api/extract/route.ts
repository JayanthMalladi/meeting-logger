import { NextResponse } from "next/server";
import { ProviderError, chatJson, hasProviderKey } from "@/lib/groq";
import { buildExtractMessages, promptVersion } from "@/lib/extractPrompt";
import { validateExtracted, ParsedExtracted } from "@/lib/schema";
import type { MeetingMeta, Segment } from "@/lib/types";

/**
 * POST /api/extract
 * In:  { transcript: string, segments: Segment[], meta: MeetingMeta }
 * Out: { extracted: ParsedExtracted, promptVersion }
 */
export async function POST(req: Request) {
  if (!hasProviderKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured. Add it to .env.local to enable extraction." },
      { status: 503 },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.transcript !== "string" || !Array.isArray(body.segments)) {
    return NextResponse.json(
      { error: "Expected { transcript: string, segments: Segment[], meta?: MeetingMeta }." },
      { status: 400 },
    );
  }

  const meta: MeetingMeta = body.meta ?? {};
  const messages = buildExtractMessages(body.transcript, body.segments, meta);

  try {
    const raw = await chatJson<unknown>([
      { role: "system", content: messages.system },
      { role: "user", content: messages.user },
    ]);

    let extracted: ParsedExtracted;
    try {
      extracted = validateExtracted(raw);
    } catch (validationErr) {
      // One retry with the validation error appended
      const retryUser =
        messages.user +
        `\n\nYour previous reply failed validation: ${String(validationErr).slice(0, 400)}\nReply again with valid JSON only.`;
      const rawRetry = await chatJson<unknown>([
        { role: "system", content: messages.system },
        { role: "user", content: retryUser },
      ]);
      extracted = validateExtracted(rawRetry);
    }

    return NextResponse.json({ extracted, promptVersion });
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

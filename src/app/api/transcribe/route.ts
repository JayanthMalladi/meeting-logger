import { NextResponse } from "next/server";
import { ProviderError, transcribe, hasProviderKey } from "@/lib/groq";
import { isMock, mockTranscript } from "@/lib/mock";

/**
 * POST /api/transcribe
 * In: multipart — field `audio` (Blob ≤ ~50 MB, webm/ogg/mp4/wav/m4a)
 *     + optional text fields `title`, `attendees`, `kind`
 * Out: Transcript { text, segments: [{start,end,text}], duration? }
 */
export async function POST(req: Request) {
  if (isMock()) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(mockTranscript());
  }
  if (!hasProviderKey()) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured. Add it to .env.local to enable processing." },
      { status: 503 },
    );
  }

  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: "Expected multipart/form-data with an 'audio' file field." },
      { status: 400 },
    );
  }

  const file = form.get("audio");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json(
      { error: "No audio uploaded. Record or upload a clip first." },
      { status: 400 },
    );
  }

  const MAX_BYTES = 50 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Audio too large (${Math.round(file.size / 1024 / 1024)} MB). Keep it under ~50 MB.` },
      { status: 400 },
    );
  }

  const langRaw = form.get("language");
  const language = typeof langRaw === "string" && langRaw.length > 0 ? langRaw : undefined;

  try {
    const transcript = await transcribe(file, { language });
    return NextResponse.json(transcript);
  } catch (err) {
    if (err instanceof ProviderError) {
      return NextResponse.json(
        { error: err.message, upstreamStatus: err.upstreamStatus },
        { status: 502 },
      );
    }
    console.error("transcribe failed:", err);
    return NextResponse.json(
      { error: "Transcription failed unexpectedly. Please try again." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { ProviderError, transcribe, hasProviderKey } from "@/lib/groq";
import { isMock, mockTranscript } from "@/lib/mock";
import { MAX_UPLOAD_BYTES } from "@/lib/audio";
import type { Transcript, Segment } from "@/lib/types";

/** Mime types we accept: all audio/* plus the two video containers MediaRecorder emits. */
const ALLOWED_MIME = new Set(["video/mp4", "video/webm"]);

/**
 * POST /api/transcribe
 * In: multipart — field `audio` (File ≤ 4 MB, audio/* or video/mp4, video/webm)
 *     + optional text fields `title`, `attendees`, `kind`, `language`
 * Out: Transcript { text, segments: Segment[], duration? }
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

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Audio is over 4 MB. Record a shorter recap or compress it." },
      { status: 400 },
    );
  }

  // Empty type passes through (some upload paths omit it); MediaRecorder files
  // carry audio/webm or audio/ogg, uploads their real audio type.
  const mime = typeof file.type === "string" ? file.type.toLowerCase() : "";
  if (mime && !(mime.startsWith("audio/") || ALLOWED_MIME.has(mime))) {
    return NextResponse.json(
      {
        error: `Unsupported file type "${mime}". Upload an audio file (or an mp4/webm video).`,
      },
      { status: 400 },
    );
  }

  const langRaw = form.get("language");
  const language = typeof langRaw === "string" && langRaw.length > 0 ? langRaw : undefined;

  try {
    let transcript: Transcript = await transcribe(file, { language });
    // Some providers return text with no segments; keep the contract usable by
    // synthesising one segment from the whole text.
    if (transcript.segments.length === 0 && transcript.text.length > 0) {
      transcript = { ...transcript, segments: [{ i: 0, text: transcript.text } satisfies Segment] };
    }
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

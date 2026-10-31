import type { Transcript } from "./types";
import { audioFilename } from "./audio";
import { indexSegments } from "./segments";

/**
 * Thin Groq client. Only this file knows about the provider.
 * Provider can be swapped via LLM_PROVIDER / OPENAI_API_KEY env (see docs/05 §5 fallback).
 *
 * Models:
 *   STT: whisper-large-v3-turbo   (env STT_MODEL)
 *   LLM: llama-3.3-70b-versatile (env LLM_MODEL)
 */

const GROQ_BASE = "https://api.groq.com/openai/v1";
const OPENAI_BASE = "https://api.openai.com/v1";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus: number | null = null,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function providerConfig() {
  const useOpenAI = process.env.LLM_PROVIDER === "openai";
  if (useOpenAI) {
    const key = process.env.OPENAI_API_KEY;
    if (!key)
      throw new ProviderError(
        "OPENAI_API_KEY is not set. Add it to .env.local to use the OpenAI fallback provider.",
      );
    return {
      base: OPENAI_BASE,
      key,
      sttModel: process.env.STT_MODEL || "whisper-1",
      llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
      provider: "openai" as const,
    };
  }
  const key = process.env.GROQ_API_KEY;
  if (!key)
    throw new ProviderError(
      "GROQ_API_KEY is not set. Add it to .env.local to enable transcription and extraction.",
    );
  return {
    base: GROQ_BASE,
    key,
    sttModel: process.env.STT_MODEL || "whisper-large-v3-turbo",
    llmModel: process.env.LLM_MODEL || "llama-3.3-70b-versatile",
    provider: "groq" as const,
  };
}

export function hasProviderKey(): boolean {
  return Boolean(
    process.env.GROQ_API_KEY ||
      (process.env.LLM_PROVIDER === "openai" && process.env.OPENAI_API_KEY),
  );
}

/**
 * Transcribe an audio Blob (webm/ogg/mp4/wav/m4a, ≤ ~50 MB) into a
 * Transcript with mm:ss-addressable segments.
 */
export async function transcribe(
  audio: Blob,
  opts?: { language?: string },
): Promise<Transcript> {
  const { base, key, sttModel } = providerConfig();
  const form = new FormData();
  form.append("file", audio, audioFilename(audio.type, (audio as File).name));
  form.append("model", sttModel);
  form.append("response_format", "verbose_json");
  if (opts?.language) form.append("language", opts.language);

  const res = await fetch(`${base}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(
      `Upstream transcription failed (${res.status}): ${text.slice(0, 300)}`,
      res.status,
    );
  }
  const json = (await res.json()) as {
    text: string;
    segments?: { start: number; end: number; text: string }[];
    duration?: number;
  };
  const segments = indexSegments(
    (json.segments ?? []).map((s) => ({ start: s.start, end: s.end, text: s.text.trim() })),
  );
  return { text: json.text.trim(), segments, duration: json.duration };
}

/**
 * Call the LLM with JSON object output. Returns the parsed object.
 * Retries once on validation failure with the error appended to the prompt
 * (the caller is responsible for shaping messages; we return raw parsed JSON).
 */
export async function chatJson<T>(messages: {
  role: "system" | "user";
  content: string;
}[]): Promise<T> {
  const { base, key, llmModel } = providerConfig();
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: llmModel,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(
      `Upstream LLM call failed (${res.status}): ${text.slice(0, 300)}`,
      res.status,
    );
  }
  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError("LLM returned an empty completion.");
  }
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new ProviderError(
      "LLM response was not valid JSON. Raw: " + content.slice(0, 300),
    );
  }
}


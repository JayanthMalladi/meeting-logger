/**
 * SHARED CONTRACT — frozen for the two-track build (see docs/spec/SPEC.md §4).
 * Changing anything here requires agreement from both tracks.
 */

/** How the input reached us. "dictated" = text typed/pasted via Wispr Flow. */
export type InputMode = "dictated" | "recorded" | "uploaded" | "sample";

/**
 * One addressable unit of the source text.
 * - Audio input: a Whisper segment; start/end are seconds.
 * - Dictated input: one sentence; start/end are absent.
 * `i` is the 0-based index into the segments array and is how board items
 * point back at their source (never by timestamp string).
 */
export type Segment = { i: number; text: string; start?: number; end?: number };

export type Transcript = {
  text: string;
  segments: Segment[];
  duration?: number; // seconds, audio only
};

/** `seg` = index of the Segment the item came from. `ts` = "mm:ss", audio only, derived server-side from seg. */
export type Decision = { text: string; seg?: number; ts?: string };
export type Action = { text: string; owner?: string; due?: string; seg?: number; ts?: string };
export type Question = { text: string; seg?: number; ts?: string };

export type Extracted = {
  summary: string; // <= 3 short sentences
  decisions: Decision[];
  actions: Action[];
  openQuestions: Question[];
  atRisk: string[]; // <= 4 short flags
};

export type MeetingMeta = {
  title?: string;
  attendees?: string; // free text, comma separated
  kind?: string; // one of KINDS
  date?: string; // ISO date (YYYY-MM-DD) the meeting happened; client sets today by default
  source?: InputMode;
};

export const KINDS = [
  "standup",
  "1:1",
  "planning",
  "design review",
  "customer call",
  "post-mortem",
  "sales call",
  "other",
] as const;

/* ---------- API shapes ---------- */

/** POST /api/transcribe — multipart: `audio` (File, name from audioFilename(mime)), optional `language`. */
export type TranscribeResponse = Transcript;

/** POST /api/extract */
export type ExtractRequest = { transcript: string; segments: Segment[]; meta: MeetingMeta };
export type ExtractResponse = { extracted: Extracted; promptVersion: string };

/** POST /api/slack */
export type SlackRequest = { webhookUrl: string; extracted: Extracted; meta: MeetingMeta; shareUrl: string };
export type SlackResponse = { ok: boolean; error?: string };

/** GET /api/health */
export type HealthResponse = {
  ok: boolean;
  hasKey: boolean; // a provider key is configured (or mock mode is on)
  provider: "groq" | "openai" | "mock";
  mock: boolean;
};

/** Every non-2xx API response has this body. */
export type ApiError = { error: string; upstreamStatus?: number | null };

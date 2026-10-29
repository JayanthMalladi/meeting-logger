import type { Extracted, MeetingMeta, Segment } from "./types";

export const SHARE_SCHEMA_VERSION = 1;
const MAX_TRANSCRIPT_CHARS = 6000;
const MAX_SLUG_BYTES = 45_000; // Vercel URL-safety headroom

export type ShareInput = {
  meta: MeetingMeta;
  extracted: Extracted;
  transcript: {
    text: string;
    segments: Pick<Segment, "start" | "end" | "text">[];
  };
  promptVersion: string;
};

export type ShareTranscript = {
  text: string;
  segments: Pick<Segment, "start" | "end" | "text">[];
  truncated: boolean;
};

export type SharePayload = {
  v: number;
  meta: MeetingMeta;
  extracted: Extracted;
  transcript: ShareTranscript;
  promptVersion: string;
  truncated: boolean;
};

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(slug: string): Uint8Array {
  let b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4 !== 0) b64 += "=";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function encodeShareUrl(
  payload: ShareInput,
  origin?: string,
): { url: string; truncated: boolean } {
  const fullText = payload.transcript.text;
  const charTruncated = fullText.length > MAX_TRANSCRIPT_CHARS;
  const segTruncated = payload.transcript.segments.length > 80;
  const body: SharePayload = {
    v: SHARE_SCHEMA_VERSION,
    meta: payload.meta,
    extracted: payload.extracted,
    transcript: {
      text: fullText.slice(0, MAX_TRANSCRIPT_CHARS),
      segments: payload.transcript.segments.slice(0, 80),
      truncated: charTruncated || segTruncated,
    },
    promptVersion: payload.promptVersion,
    truncated: charTruncated || segTruncated,
  };
  const bytes = new TextEncoder().encode(JSON.stringify(body));
  if (bytes.length > MAX_SLUG_BYTES) {
    // Drop segments until we fit — the board (meta+extracted) must always survive.
    const minimal: SharePayload = { ...body, transcript: { ...body.transcript, segments: [] }, truncated: true };
    const minimalBytes = new TextEncoder().encode(JSON.stringify(minimal));
    if (minimalBytes.length > MAX_SLUG_BYTES) {
      throw new Error(
        "Share payload too large even without transcript segments; trim result fields.",
      );
    }
    return {
      url: `${origin ?? ""}/m/${toBase64Url(minimalBytes)}`,
      truncated: true,
    };
  }
  return { url: `${origin ?? ""}/m/${toBase64Url(bytes)}`, truncated: body.truncated };
}

export function decodeShareSlug(slug: string): SharePayload {
  const json = new TextDecoder().decode(fromBase64Url(slug));
  const parsed = JSON.parse(json) as SharePayload;
  if (parsed.v !== SHARE_SCHEMA_VERSION) {
    throw new Error(`Unsupported share payload version: ${String(parsed.v)}`);
  }
  return parsed;
}

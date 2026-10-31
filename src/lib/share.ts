import type { Extracted, MeetingMeta, Segment } from "./types";

/**
 * Zero-signup share links (contract — SPEC §4.3).
 * v2: JSON → deflate-raw (CompressionStream) → base64url, prefixed "z".
 * v1 links (uncompressed base64url JSON, no prefix) still decode.
 * Both functions are async and browser-only (CompressionStream).
 */
export const SHARE_SCHEMA_VERSION = 2;
/** Vercel rejects URLs over ~14 KB; keep the slug well under that. */
export const MAX_SLUG_CHARS = 8_000;

export type ShareInput = {
  meta: MeetingMeta;
  extracted: Extracted;
  transcript: { text: string; segments: Segment[] };
  promptVersion: string;
};

export type SharePayload = {
  v: number;
  meta: MeetingMeta;
  extracted: Extracted;
  transcript: { segments: Segment[]; truncated: boolean };
  promptVersion: string;
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

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

async function pack(body: SharePayload): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(body));
  return "z" + toBase64Url(await pipe(raw, new CompressionStream("deflate-raw")));
}

export async function encodeShareUrl(
  input: ShareInput,
  origin = "",
): Promise<{ url: string; truncated: boolean }> {
  const segs = input.transcript.segments.map((s) => ({
    i: s.i,
    text: s.text,
    ...(s.start !== undefined ? { start: Math.round(s.start * 10) / 10 } : {}),
  }));
  const make = (keep: number): SharePayload => ({
    v: SHARE_SCHEMA_VERSION,
    meta: input.meta,
    extracted: input.extracted,
    transcript: { segments: segs.slice(0, keep), truncated: keep < segs.length },
    promptVersion: input.promptVersion,
  });
  // Try everything, then halve the transcript until it fits; the board always survives.
  let keep = segs.length;
  let slug = await pack(make(keep));
  while (slug.length > MAX_SLUG_CHARS && keep > 0) {
    keep = Math.floor(keep / 2);
    slug = await pack(make(keep));
  }
  if (slug.length > MAX_SLUG_CHARS) throw new Error("This board is too large to share as a link.");
  return { url: `${origin}/m/${slug}`, truncated: keep < segs.length };
}

export async function decodeShareSlug(slug: string): Promise<SharePayload> {
  if (slug.startsWith("z")) {
    const json = new TextDecoder().decode(await pipe(fromBase64Url(slug.slice(1)), new DecompressionStream("deflate-raw")));
    const parsed = JSON.parse(json) as SharePayload;
    if (parsed.v !== SHARE_SCHEMA_VERSION) throw new Error(`Unsupported share version ${String(parsed.v)}`);
    return parsed;
  }
  // v1 legacy: uncompressed JSON, segments without `i`.
  const v1 = JSON.parse(new TextDecoder().decode(fromBase64Url(slug))) as {
    v: number; meta: MeetingMeta; extracted: Extracted; promptVersion: string;
    transcript?: { segments?: Omit<Segment, "i">[]; truncated?: boolean };
  };
  if (v1.v !== 1) throw new Error(`Unsupported share version ${String(v1.v)}`);
  return {
    v: 1,
    meta: v1.meta,
    extracted: v1.extracted,
    promptVersion: v1.promptVersion,
    transcript: { segments: (v1.transcript?.segments ?? []).map((s, i) => ({ ...s, i })), truncated: !!v1.transcript?.truncated },
  };
}

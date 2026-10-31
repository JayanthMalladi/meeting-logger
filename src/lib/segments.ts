import type { Segment } from "./types";

/**
 * Split dictated text into sentence segments (contract — SPEC §4).
 * Pure, client- and server-safe. Never returns empty segments.
 * Long sentences (> 280 chars) are kept whole; we only split on sentence ends
 * and newlines so the user's own structure is preserved.
 */
export function splitSentences(text: string): Segment[] {
  const parts = text
    .replace(/\r\n?/g, "\n")
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9"'(\[])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.map((t, i) => ({ i, text: t }));
}

/** Ensure every segment has i === its index (Whisper output is mapped through this). */
export function indexSegments(segs: Omit<Segment, "i">[]): Segment[] {
  return segs.map((s, i) => ({ ...s, i }));
}

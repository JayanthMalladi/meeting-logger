/** Shared audio helpers (contract — see docs/spec/SPEC.md §4). Safe to import on client and server. */

/**
 * Vercel serverless functions reject request bodies over 4.5 MB, so the client
 * must refuse anything larger before uploading. Groq's own limit is 25 MB.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** Recorder bitrate: 32 kbps opus ≈ 4 KB/s ≈ 16 minutes under MAX_UPLOAD_BYTES. */
export const RECORDER_BITS_PER_SECOND = 32_000;

const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

/**
 * Filename whose extension matches the real container format. Whisper APIs pick
 * the decoder from the extension, so "audio.webm" for an mp3 fails.
 * Accepts "audio/webm;codecs=opus" style MIME strings. Falls back to the
 * original filename's extension, then to "webm".
 */
export function audioFilename(mime: string | undefined, originalName?: string): string {
  const base = (mime ?? "").split(";")[0].trim().toLowerCase();
  const fromMime = EXT_BY_MIME[base];
  if (fromMime) return `audio.${fromMime}`;
  const fromName = originalName?.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  if (fromName) return `audio.${fromName}`;
  return "audio.webm";
}

/** Seconds → "mm:ss". */
export function formatTs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

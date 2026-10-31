"use client";

import { useEffect, useRef } from "react";
import { card } from "./ui";

type Props = {
  audio: Blob | null;
  /** "mm:ss" — when set, jumps the player there and plays. */
  seekTo?: string | null;
  /** Bumped on every selection so the same timestamp can be re-played. */
  seekTick?: number;
};

/**
 * Visible native audio player for the recorded/uploaded blob.
 * Object URL is set directly on the element's ref (no state in effects —
 * the repo eslint config flags react-hooks/set-state-in-effect).
 * `seekTo` ("mm:ss") sets currentTime and plays
 * (B10: clicking a timestamp chip jumps the player there).
 * Renders nothing when `audio` is null.
 */
export default function AudioPlayer({ audio, seekTo, seekTick }: Props) {
  const ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!audio) {
      el.removeAttribute("src");
      el.load();
      return;
    }
    const objectUrl = URL.createObjectURL(audio);
    el.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [audio]);

  useEffect(() => {
    if (!seekTo || !ref.current) return;
    const [m, s] = seekTo.split(":").map(Number);
    if (Number.isNaN(m) || Number.isNaN(s)) return;
    ref.current.currentTime = m * 60 + s;
    void ref.current.play().catch(() => {});
  }, [seekTo, seekTick]);

  if (!audio) return null;

  return (
    <div className={`${card} !p-2.5`}>
      <audio ref={ref} controls aria-label="Meeting audio" className="h-10 w-full" />
    </div>
  );
}

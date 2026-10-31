"use client";

import { useEffect, useRef } from "react";

type Props = {
  audio: Blob | null;
  /** "mm:ss" — when set, jumps the player there and plays. */
  seekTo?: string | null;
};

/**
 * Visible native audio player for the recorded/uploaded blob.
 * Object URL is set directly on the element's ref (no state in effects —
 * the repo eslint config flags react-hooks/set-state-in-effect).
 * `seekTo` ("mm:ss") sets currentTime and plays
 * (B10: clicking a timestamp chip jumps the player there).
 * Renders nothing when `audio` is null.
 */
export default function AudioPlayer({ audio, seekTo }: Props) {
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
    void ref.current.play();
  }, [seekTo]);

  if (!audio) return null;

  return <audio ref={ref} controls className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800" />;
}

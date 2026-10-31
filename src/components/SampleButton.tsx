"use client";

import { useEffect, useState } from "react";

type Props = {
  onAudio: (blob: Blob, mime: string) => void;
  disabled?: boolean;
};

/**
 * Loads the bundled demo standup recording so a judge (or you) can see a
 * finished board in one click, without recording or uploading anything.
 */
export default function SampleButton({ onAudio, disabled }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  const load = async () => {
    setState("loading");
    try {
      const res = await fetch("/demo-standup.mp3");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("empty file");
      onAudio(blob, "audio/mpeg");
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    // auto-load the demo so the board is ready to process on first visit
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      onClick={load}
      disabled={disabled || state === "loading"}
      className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
    >
      {state === "loading"
        ? "Loading sample…"
        : state === "ready"
          ? "Sample loaded ✓ — hit Process"
          : state === "error"
            ? "Sample failed to load"
            : "Load sample standup (63s)"}
    </button>
  );
}

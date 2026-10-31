"use client";

import { useState } from "react";

type Props = {
  onAudio: (file: File, source: "sample") => void;
  disabled?: boolean;
};

/**
 * Loads the bundled demo standup recording so a judge (or you) can see a
 * finished board in one click, without recording or uploading anything.
 * No auto-load — the user clicks.
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
      const file = new File([blob], "demo-standup.mp3", { type: "audio/mpeg" });
      onAudio(file, "sample");
      setState("ready");
    } catch {
      setState("error");
    }
  };

  return (
    <button
      type="button"
      onClick={load}
      disabled={disabled || state === "loading" || state === "ready"}
      className="self-start rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
    >
      {state === "loading"
        ? "Loading sample…"
        : state === "ready"
          ? "Sample loaded ✓"
          : state === "error"
            ? "Sample failed to load — try again"
            : "Load sample standup (63s)"}
    </button>
  );
}

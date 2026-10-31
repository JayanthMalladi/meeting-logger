"use client";

import { useState } from "react";

type Props = {
  onAudio: (file: File, source: "sample") => void;
  disabled?: boolean;
  /** True when the parent already holds the sample file. */
  loaded?: boolean;
};

/**
 * Loads the bundled demo standup recording so a judge (or you) can see a
 * finished board in one click, without recording or uploading anything.
 * No auto-load — the user clicks.
 */
export default function SampleButton({ onAudio, disabled, loaded }: Props) {
  const [localState, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const state = loaded && localState === "idle" ? "ready" : localState;

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
      className="rounded-full bg-[#EDF3F6] px-3 py-1 text-xs font-medium text-[#04597B] transition hover:bg-[#DDEAF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D83995]/60 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#0F3A4F] dark:text-[#9ADAF2] dark:hover:bg-[#14506B]"
    >
      {state === "loading"
        ? "Loading sample…"
        : state === "ready"
          ? "▶ Sample audio loaded ✓"
          : state === "error"
            ? "Sample failed to load — try again"
            : "▶ Sample audio"}
    </button>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Segment } from "@/lib/types";
import { formatTs } from "@/lib/groq";

type Props = {
  segments: Segment[];
  activeTs?: string;
  onReadBack?: () => void;
};

/**
 * Transcript segments with click-to-highlight. The parent flashes a segment
 * when a board row's `ts` is clicked (via activeTs).
 */
export default function TranscriptPanel({ segments, activeTs }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTs || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-ts="${CSS.escape(activeTs)}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(activeTs);
      const t = window.setTimeout(() => setFlash(null), 1500);
      return () => window.clearTimeout(t);
    }
  }, [activeTs]);

  const readBack = () => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      segments.map((s) => s.text).join(" "),
    );
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (!segments.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Transcript ({segments.length} segments)
        </h2>
        <button
          type="button"
          onClick={readBack}
          className="rounded bg-zinc-100 px-2 py-1 text-xs hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          ♪ Read back
        </button>
      </div>
      <div
        ref={containerRef}
        className="max-h-80 overflow-y-auto rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900/50 dark:text-zinc-300"
      >
        <div className="flex flex-col gap-1">
          {segments.map((s, i) => {
            const ts = formatTs(s.start);
            const isFlash = flash === ts;
            return (
              <div
                key={i}
                data-ts={ts}
                className={`flex gap-2 rounded px-1.5 py-0.5 transition ${
                  isFlash ? "bg-amber-200 text-zinc-900 dark:bg-amber-400/40" : ""
                }`}
              >
                <span className="w-10 shrink-0 font-mono text-xs text-zinc-400">{ts}</span>
                <span>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

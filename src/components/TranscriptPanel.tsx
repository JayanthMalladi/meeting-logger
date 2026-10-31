"use client";

import { useEffect, useRef, useState } from "react";
import type { Segment } from "@/lib/types";
import { formatTs } from "@/lib/audio";

type Props = {
  segments: Segment[];
  selectedSeg?: number | null; // scroll + 1.5s amber flash
  onSelect(seg: number): void; // clicking a segment
  withAudio?: boolean; // false on share page
};

/**
 * B10: transcript segments, keyed by numeric seg index (`data-seg={s.i}`).
 * Parent sets `selectedSeg`; the panel scrolls that segment into view and
 * flashes it amber for 1.5 s. Clicking a segment calls `onSelect(s.i)`.
 */
export default function TranscriptPanel({
  segments,
  selectedSeg,
  onSelect,
  withAudio,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flash, setFlash] = useState<number | null>(null);

  useEffect(() => {
    if (selectedSeg === null || selectedSeg === undefined || !containerRef.current)
      return;
    const el = containerRef.current.querySelector(
      `[data-seg="${CSS.escape(String(selectedSeg))}"]`,
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(selectedSeg);
      const t = window.setTimeout(() => setFlash(null), 1500);
      return () => window.clearTimeout(t);
    }
  }, [selectedSeg]);

  // withAudio is part of the public props contract (share page hides the
  // audio-related affordances); panel body is unchanged either way.
  void withAudio;

  if (!segments.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Transcript ({segments.length} segments)
      </h2>
      <div
        ref={containerRef}
        className="max-h-80 overflow-y-auto rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900/50 dark:text-zinc-300"
      >
        <div className="flex flex-col gap-1">
          {segments.map((s) => {
            const label = s.start !== undefined ? formatTs(s.start) : `¶ ${s.i + 1}`;
            const isFlash = flash === s.i;
            return (
              <div
                key={s.i}
                data-seg={s.i}
                onClick={() => onSelect(s.i)}
                className={`flex cursor-pointer gap-2 rounded px-1.5 py-0.5 transition ${
                  isFlash ? "bg-amber-200 text-zinc-900 dark:bg-amber-400/40" : ""
                }`}
              >
                <span className="w-10 shrink-0 font-mono text-xs text-zinc-400">{label}</span>
                <span>{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

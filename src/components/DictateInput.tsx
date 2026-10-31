"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SampleRecap } from "@/lib/samples";
import { field, kbd } from "./ui";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onBuild: () => void;
  samples: SampleRecap[];
  onSample: (sample: SampleRecap) => void;
  disabled?: boolean;
  /** Extra chips rendered after the sample chips (e.g. the sample audio chip). */
  extraChips?: ReactNode;
};

const MIN_WORDS = 12;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Dictation input: an auto-growing textarea with a live word count, sample
 * chips, a "Listening via Wispr Flow" badge while text is arriving, and a
 * Ctrl/Cmd+Enter build shortcut.
 */
export default function DictateInput({
  value,
  onChange,
  onBuild,
  samples,
  onSample,
  disabled,
  extraChips,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [listening, setListening] = useState(false);
  const listenTimer = useRef<number | null>(null);

  const words = countWords(value);
  const tooShort = words < MIN_WORDS;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onBuild();
    }
  };

  // Re-measure on every value change (typing, Wispr Flow insertion, samples).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 144), 384)}px`;
  }, [value]);

  useEffect(
    () => () => {
      if (listenTimer.current !== null) window.clearTimeout(listenTimer.current);
    },
    [],
  );

  const pulseListening = () => {
    setListening(true);
    if (listenTimer.current !== null) window.clearTimeout(listenTimer.current);
    listenTimer.current = window.setTimeout(() => setListening(false), 1400);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={6}
            autoFocus
            value={value}
            disabled={disabled}
            aria-label="Meeting recap"
            onChange={(e) => {
              onChange(e.target.value);
              pulseListening();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Click here, hold your Wispr Flow hotkey, and speak your recap. Who decided what, who's doing what by when, and what's still open."
            className={`${field} resize-none leading-relaxed`}
            style={{ minHeight: 144 }}
          />
          {listening && (
            <span
              role="status"
              className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Listening via Wispr Flow
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span aria-hidden>🎙</span> Hold your Wispr Flow hotkey and speak.
            <span className="hidden items-center gap-1 sm:inline-flex">
              <kbd className={kbd}>Ctrl/⌘</kbd>
              <kbd className={kbd}>↵</kbd> to build
            </span>
          </span>
          <span className={tooShort ? "text-amber-700 dark:text-amber-400" : ""}>
            {words} words
            {tooShort && ` · need ${MIN_WORDS}+, or try a sample`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {samples.length > 0 ? (
          samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSample(sample)}
              disabled={disabled}
              className="rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-[11px] text-zinc-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
            >
              Sample: {sample.label.toLowerCase()}
            </button>
          ))
        ) : (
          <p className="text-xs text-zinc-400">No samples available.</p>
        )}
        {extraChips}
      </div>
    </div>
  );
}

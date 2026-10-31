"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SampleRecap } from "@/lib/samples";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onBuild: () => void;
  /** Fires when text starts/stops arriving (drives the waveform). */
  onListening?: (listening: boolean) => void;
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
  onListening,
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
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 160), 384)}px`;
  }, [value]);

  useEffect(
    () => () => {
      if (listenTimer.current !== null) window.clearTimeout(listenTimer.current);
    },
    [],
  );

  const pulseListening = () => {
    setListening(true);
    onListening?.(true);
    if (listenTimer.current !== null) window.clearTimeout(listenTimer.current);
    listenTimer.current = window.setTimeout(() => {
      setListening(false);
      onListening?.(false);
    }, 1400);
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
            placeholder="Speak your recap. Who decided what, who's doing what by when, and what's still open…"
            className="w-full resize-none rounded-2xl bg-transparent px-1 py-1 text-[17px] leading-relaxed text-zinc-900 placeholder:font-serif placeholder:text-[19px] placeholder:italic placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 dark:text-zinc-50 dark:placeholder:text-zinc-500"
            style={{ minHeight: 160 }}
          />
          {listening && (
            <span
              role="status"
              className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#ece6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#4b3a9a] dark:bg-[#2a2542] dark:text-[#cfc4ff]"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#6E56CF]" />
              Listening via Wispr Flow
            </span>
          )}
        </div>
        <div className="mt-1 text-right text-xs text-zinc-500 dark:text-zinc-400">
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
              className="rounded-full bg-[#ece6ff] px-3 py-1 text-xs font-medium text-[#4b3a9a] transition hover:bg-[#ddd3ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF]/60 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2a2542] dark:text-[#cfc4ff] dark:hover:bg-[#352e55]"
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

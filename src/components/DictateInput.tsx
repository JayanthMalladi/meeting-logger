"use client";

import { useEffect, useRef } from "react";
import type { SampleRecap } from "@/lib/samples";

type Props = {
  value: string;
  onChange: (text: string) => void;
  onBuild: () => void;
  samples: SampleRecap[];
  onSample: (sample: SampleRecap) => void;
  disabled?: boolean;
};

const MIN_WORDS = 12;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Dictation input: an auto-growing textarea with a live word count, sample
 * chips, and a Ctrl/Cmd+Enter build shortcut.
 */
export default function DictateInput({ value, onChange, onBuild, samples, onSample, disabled }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const words = countWords(value);
  const tooShort = words < MIN_WORDS;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onBuild();
    }
  };

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 144), 384)}px`;
  };

  // Re-measure when the parent pre-fills the value (e.g. a sample was chosen).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 144), 384)}px`;
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <textarea
          ref={textareaRef}
          rows={6}
          autoFocus
          value={value}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Click here, hold your Wispr Flow hotkey, and speak your recap. Who decided what, who's doing what by when, and what's still open."
          className="w-full resize-none rounded-lg border border-zinc-300 px-3 py-2.5 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className={tooShort ? "text-amber-600 dark:text-amber-400" : "text-zinc-500 dark:text-zinc-400"}>
            {words} words
          </span>
          <span className="text-zinc-400 dark:text-zinc-500">Ctrl/Cmd + Enter to build</span>
        </div>
        {tooShort && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Keep going — at least {MIN_WORDS} words, or try a sample below.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {samples.length > 0 ? (
          samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSample(sample)}
              disabled={disabled}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:border-zinc-500 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
            >
              {sample.label}
            </button>
          ))
        ) : (
          <p className="text-xs text-zinc-400">No samples available.</p>
        )}
      </div>
    </div>
  );
}

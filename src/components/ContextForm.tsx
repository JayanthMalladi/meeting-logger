"use client";

import { useState } from "react";
import { KINDS } from "@/lib/types";
import type { MeetingMeta } from "@/lib/types";

type Props = {
  value: MeetingMeta;
  onChange(meta: MeetingMeta): void;
  disabled?: boolean;
};

/**
 * Fully controlled "Add details (optional)" form (B5 — fixes the dropped-title bug).
 * State lives in the page; every change emits a new MeetingMeta.
 */
export default function ContextForm({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  // Only computed when the form is opened — keeps the initial render pure
  // (Next 16 refuses to prerender unstable `new Date()` in client components).
  const today = open ? new Date().toISOString().slice(0, 10) : "";

  const set = <K extends keyof MeetingMeta>(k: K, v: MeetingMeta[K]) =>
    onChange({ ...value, [k]: v === "" ? undefined : v });

  const field =
    "rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        aria-expanded={open}
      >
        {open ? "▾" : "▸"} Add details (optional)
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={value.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Title (optional)"
            disabled={disabled}
            aria-label="Meeting title"
            className={field}
          />
          <input
            value={value.attendees ?? ""}
            onChange={(e) => set("attendees", e.target.value)}
            placeholder="Attendees, comma separated (optional)"
            disabled={disabled}
            aria-label="Attendees"
            className={field}
          />
          <select
            value={value.kind ?? ""}
            onChange={(e) => set("kind", e.target.value || undefined)}
            disabled={disabled}
            aria-label="Meeting kind"
            className={field}
          >
            <option value="">Kind (optional)</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={value.date || today}
            onChange={(e) => set("date", e.target.value)}
            disabled={disabled}
            aria-label="Meeting date"
            className={field}
          />
        </div>
      )}
    </div>
  );
}

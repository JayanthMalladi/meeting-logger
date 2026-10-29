"use client";

import { useState } from "react";
import { KINDS } from "@/lib/types";
import type { MeetingMeta } from "@/lib/types";

type Props = {
  onSubmit: (meta: MeetingMeta) => void;
  disabled?: boolean;
};

/**
 * All fields optional — the app works with zero typing.
 */
export default function ContextForm({ onSubmit, disabled }: Props) {
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [kind, setKind] = useState("");

  return (
    <form
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          title: title.trim() || undefined,
          attendees: attendees.trim() || undefined,
          kind: kind || undefined,
        });
      }}
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        disabled={disabled}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <input
        value={attendees}
        onChange={(e) => setAttendees(e.target.value)}
        placeholder="Attendees (optional)"
        disabled={disabled}
        className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="">Kind (optional)</option>
        {KINDS.map((k) => (
          <option key={k} value={k}>
            {k}
          </option>
        ))}
      </select>
    </form>
  );
}

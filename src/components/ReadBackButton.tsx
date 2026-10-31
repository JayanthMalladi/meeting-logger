"use client";

import { useEffect, useState } from "react";
import type { Extracted } from "@/lib/types";

type Props = {
  extracted: Extracted;
};

/**
 * B12: speak the board aloud — summary first, then each action as
 * "text, owner X, due Y" (owner/due only when present).
 * Toggles to "Stop" while speaking. Hidden where speechSynthesis is absent.
 */
export default function ReadBackButton({ extracted }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  // Safety net: if the engine never fires the utterance onend
  // (some desktop builds swallow it after cancel), stop showing "Stop"
  // after 10 minutes.
  useEffect(() => {
    if (!speaking) return;
    const t = window.setTimeout(() => setSpeaking(false), 10 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [speaking]);

  useEffect(() => {
    return () => {
      // Stop talking when the board unmounts (e.g. user opens a new board).
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!supported) return null;

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const speak = () => {
    const parts: string[] = [extracted.summary];
    for (const a of extracted.actions) {
      let line = a.text;
      if (a.owner) line += `, owner ${a.owner}`;
      if (a.due) line += `, due ${a.due}`;
      parts.push(line);
    }
    const utterance = new SpeechSynthesisUtterance(parts.join(". "));
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    const synth = window.speechSynthesis;
    synth.cancel();
    setSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      className="rounded-lg bg-zinc-100 px-2 py-1 text-xs hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
    >
      {speaking ? "Stop" : "Read back"}
    </button>
  );
}

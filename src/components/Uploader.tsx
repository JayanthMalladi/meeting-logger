"use client";

import { useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "@/lib/audio";

type Props = {
  onAudio: (file: File, source: "uploaded") => void;
  disabled?: boolean;
};

/**
 * Drag-drop or file input → keeps the original File (name matters for
 * audioFilename). Refuses files over MAX_UPLOAD_BYTES with an inline message.
 */
export default function Uploader({ onAudio, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Audio is over 4 MB. Record a shorter recap or compress it.");
      return;
    }
    setError(null);
    setName(file.name);
    onAudio(file, "uploaded");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) handleFile(e.dataTransfer?.files?.[0]);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed px-6 py-3 text-sm transition ${
          disabled
            ? "cursor-not-allowed border-zinc-300 opacity-50 dark:border-zinc-700"
            : dragging
              ? "cursor-pointer border-zinc-900 bg-zinc-100 dark:bg-zinc-800"
              : "cursor-pointer border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
        }`}
      >
        {name ? `Loaded ${name} — tap to replace` : "Or drop a voice memo (webm, mp3, m4a, wav)"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

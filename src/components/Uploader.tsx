"use client";

import { useRef, useState } from "react";

type Props = {
  onAudio: (blob: Blob, mime: string) => void;
  disabled?: boolean;
};

/**
 * Drag-drop or file input → Blob. Same downstream path as the recorder.
 */
export default function Uploader({ onAudio, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const blob = file; // File is a Blob
    setName(file.name);
    onAudio(blob, file.type || "audio/webm");
  };

  return (
    <div className="flex items-center gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer?.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-3 text-sm transition ${
          dragging
            ? "border-zinc-900 bg-zinc-100 dark:bg-zinc-800"
            : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
        }`}
      >
        {name ? name : "Or drop a voice memo (webm, mp3, m4a, wav)"}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

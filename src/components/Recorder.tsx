"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onAudio: (blob: Blob, mime: string) => void;
  disabled?: boolean;
};

/**
 * MediaRecorder wrapper: record/stop + live timer, emits a Blob.
 * No third-party recorder lib. webm on Chrome, mp4 fallback on Safari.
 */
export default function Recorder({ onAudio, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  const pickMimeType = () => {
    const candidates = ["audio/webm", "audio/mp4"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  };

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMimeType();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((t) => t.stop());
        onAudio(blob, type);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      alert("Could not access the microphone: " + String(err));
    }
  }, [onAudio]);

  const stop = useCallback(() => {
    recorderRef.current?.stop();
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    setRecording(false);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <button
          type="button"
          onClick={stop}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700"
        >
          <span className="block h-4 w-4 rounded-sm bg-white" aria-label="Stop recording" />
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={disabled}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="block h-5 w-3 rounded-sm bg-white" aria-label="Start recording" />
        </button>
      )}
      <div className="font-mono text-sm text-zinc-600 dark:text-zinc-400">
        {recording ? `Recording… ${mm}:${ss}` : "Tap to start dictating your standup recap"}
      </div>
    </div>
  );
}

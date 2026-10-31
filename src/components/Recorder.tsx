"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RECORDER_BITS_PER_SECOND, formatTs } from "@/lib/audio";

type Props = {
  onAudio: (blob: Blob, mime: string, source: "recorded") => void;
  onRecording?: (recording: boolean) => void;
  disabled?: boolean;
};

/** 15:00 hard cap — anything longer would exceed MAX_UPLOAD_BYTES at 32 kbps. */
const MAX_SECONDS = 15 * 60;

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const mime of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return undefined;
}

/**
 * MediaRecorder wrapper: record/stop + live mm:ss timer, 15-minute auto-stop,
 * emits a Blob on stop. No third-party recorder lib.
 */
export default function Recorder({ onAudio, onRecording, disabled }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string | undefined>(undefined);
  const timerRef = useRef<number | null>(null);
  const emittedRef = useRef(false);
  const onAudioRef = useRef(onAudio);
  useEffect(() => {
    onAudioRef.current = onAudio;
  }, [onAudio]);

  useEffect(() => {
    onRecording?.(recording);
    return () => onRecording?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  // Stop any in-flight recording on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
        recorderRef.current = null;
      }
    },
    [],
  );

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(async () => {
    setError(null);
    setDone(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMimeType();
      const rec = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: RECORDER_BITS_PER_SECOND,
      });
      mimeRef.current = mime;
      chunksRef.current = [];
      emittedRef.current = false;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        if (emittedRef.current) return;
        emittedRef.current = true;
        const type = mimeRef.current ?? rec.mimeType ?? "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        stream.getTracks().forEach((t) => t.stop());
        onAudioRef.current(blob, type, "recorded");
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch (err) {
      stopTimer();
      const denied =
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setError(denied ? "Microphone access was denied. Allow the mic and try again." : "Could not start recording.");
    }
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (!rec || rec.state !== "recording") return;
    stopTimer();
    setRecording(false);
    rec.stop();
    recorderRef.current = null;
    setDone(true);
  }, []);

  // Auto-stop at 15:00.
  useEffect(() => {
    if (recording && seconds >= MAX_SECONDS) stop();
  }, [recording, seconds, stop]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-black/[0.03] px-5 py-6 dark:bg-white/[0.04]">
      <button
        type="button"
        onClick={recording ? stop : start}
        disabled={disabled || (done && !recording)}
        aria-label={recording ? "Stop recording" : "Start recording"}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
          recording ? "animate-pulse bg-red-600 hover:bg-red-700" : "bg-[#0A2533] hover:bg-[#0A3A52] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        }`}
      >
        {recording ? <span className="block h-4 w-4 rounded-sm bg-white" /> : <span className="block h-5 w-3 rounded-sm bg-white dark:bg-zinc-900" />}
      </button>
      <div className="font-serif text-xl text-zinc-600 dark:text-zinc-400">
        {done && !recording ? "Recording ready ✓" : recording ? `Recording… ${formatTs(seconds)}` : "Tap to record your recap (up to 15 min)"}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

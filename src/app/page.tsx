"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Recorder from "@/components/Recorder";
import Uploader from "@/components/Uploader";
import ContextForm from "@/components/ContextForm";
import Board from "@/components/Board";
import TranscriptPanel from "@/components/TranscriptPanel";
import ShareCard from "@/components/ShareCard";
import SampleButton from "@/components/SampleButton";
import { encodeShareUrl } from "@/lib/share";
import type { MeetingMeta, Transcript } from "@/lib/types";
import type { Extracted as ParsedExtracted } from "@/lib/types";

type ExtractedResult = { result: ParsedExtracted; promptVersion: string };

type Stage = "idle" | "recorded" | "transcribed" | "extracted" | "done" | "error";

export default function Home() {
  const [stage, setStage] = useState<Stage>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<MeetingMeta>({});
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [extracted, setExtracted] = useState<ExtractedResult | null>(null);
  const [activeTs, setActiveTs] = useState<string | undefined>(undefined);
  const fileRef = useRef<HTMLAudioElement>(null);

  const onAudio = useCallback((blob: Blob, _mime: string) => {
    setAudioBlob(blob);
    setStage("recorded");
    setError(null);
    setTranscript(null);
    setExtracted(null);
    const url = URL.createObjectURL(blob);
    if (fileRef.current) fileRef.current.src = url;
  }, []);

  const process = useCallback(async () => {
    if (!audioBlob) return;
    setBusy(true);
    setError(null);
    try {
      // 1. Transcribe
      setStage("recorded");
      const fd = new FormData();
      fd.append("audio", audioBlob, "recording.webm");
      fd.append("title", meta.title ?? "");
      fd.append("attendees", meta.attendees ?? "");
      fd.append("kind", meta.kind ?? "");
      fd.append("source", "upload");
      const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
      const tJson = await tRes.json();
      if (!tRes.ok) throw new Error(tJson.error ?? `Transcription failed (${tRes.status})`);
      const t: Transcript = tJson;
      setTranscript(t);
      setStage("transcribed");

      // 2. Extract
      const eRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: t.text,
          segments: t.segments,
          meta: { ...meta, source: "recorded" },
        }),
      });
      const eJson = await eRes.json();
      if (!eRes.ok) throw new Error(eJson.error ?? `Extraction failed (${eRes.status})`);
      setExtracted({ result: eJson.extracted, promptVersion: eJson.promptVersion });
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStage("error");
    } finally {
      setBusy(false);
    }
  }, [audioBlob, meta]);

  const postSlack = useCallback(async (webhookUrl: string) => {
    if (!extracted) return { ok: false, error: "Nothing to post yet." };
    const shareUrl = (await encodeShareUrl(
      {
        meta,
        extracted: extracted.result,
        transcript: { text: transcript?.text ?? "", segments: transcript?.segments ?? [] },
        promptVersion: extracted.promptVersion,
      },
      typeof window !== "undefined" ? window.location.origin : undefined,
    )).url;
    const res = await fetch("/api/slack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        extracted: extracted.result,
        meta,
        shareUrl,
      }),
    });
    return res.json();
  }, [extracted, meta, transcript]);
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    if (stage !== "done" || !extracted || !transcript) return;
    encodeShareUrl(
      { meta, extracted: extracted.result, transcript, promptVersion: extracted.promptVersion },
      window.location.origin,
    ).then((r) => setShareUrl(r.url), () => setShareUrl(""));
  }, [stage, extracted, transcript, meta]);

  const missingKey = error?.includes("GROQ_API_KEY");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            NoHands Log
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            One spoken paragraph per meeting → a finished board of decisions, actions, owners, and open questions.
          </p>
        </header>

        {missingKey && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            GROQ_API_KEY is not configured. Add it to <code>.env.local</code> to enable processing —
            see the README for setup.
          </div>
        )}

        <audio ref={fileRef} controls className="hidden" />

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Recorder onAudio={onAudio} disabled={busy} />
            <SampleButton onAudio={onAudio} disabled={busy} />
          </div>
          <Uploader onAudio={onAudio} disabled={busy} />
          <ContextForm onSubmit={(m) => setMeta(m)} disabled={busy} />
        </section>

        <section>
          <button
            type="button"
            onClick={process}
            disabled={!audioBlob || busy}
            className="w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {busy
              ? "Processing…"
              : stage === "done"
                ? "Process again"
                : "Process → decision board"}
          </button>
          {busy && stage !== "done" && (
            <p className="mt-2 text-center text-sm text-zinc-400">
              {stage === "transcribed" ? "Extracting board…" : "Transcribing…"}
            </p>
          )}
        </section>

        {error && !missingKey && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {transcript && (
          <TranscriptPanel segments={transcript.segments} activeTs={activeTs} />
        )}

        {extracted && stage === "done" && (
          <>
            <Board
              extracted={extracted.result}
              meta={meta}
              onSeek={(ts) => setActiveTs(ts)}
            />
            <ShareCard shareUrl={shareUrl} onSlack={postSlack} />
          </>
        )}
      </main>
    </div>
  );
}

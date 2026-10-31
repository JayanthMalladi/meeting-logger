"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiError,
  Extracted,
  ExtractResponse,
  HealthResponse,
  MeetingMeta,
  Segment,
  SlackResponse,
  Transcript,
} from "@/lib/types";
import { splitSentences } from "@/lib/segments";
import { audioFilename, formatTs, MAX_UPLOAD_BYTES } from "@/lib/audio";
import { encodeShareUrl } from "@/lib/share";
import { toMarkdown } from "@/lib/markdown";
import { SAMPLE_RECAPS, type SampleRecap } from "@/lib/samples";

import InputTabs from "@/components/InputTabs";
import DictateInput from "@/components/DictateInput";
import Recorder from "@/components/Recorder";
import Uploader from "@/components/Uploader";
import SampleButton from "@/components/SampleButton";
import ContextForm from "@/components/ContextForm";
import Board from "@/components/Board";
import TranscriptPanel from "@/components/TranscriptPanel";
import AudioPlayer from "@/components/AudioPlayer";
import ShareCard from "@/components/ShareCard";
import ReadBackButton from "@/components/ReadBackButton";
import HealthBanner from "@/components/HealthBanner";

type Tab = "dictate" | "record" | "upload";

export default function Home() {
  // --- input state ---
  const [tab, setTab] = useState<Tab>("dictate");
  const [dictateText, setDictateText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSource, setAudioSource] = useState<"recorded" | "uploaded" | "sample">("recorded");
  const [meta, setMeta] = useState<MeetingMeta>({});

  // --- result state ---
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [transcriptText, setTranscriptText] = useState("");
  const [promptVersion, setPromptVersion] = useState("");
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareTruncated, setShareTruncated] = useState(false);

  // --- status state ---
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [lastBuilt, setLastBuilt] = useState<{ text: string; audio: File | null; meta: MeetingMeta } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasBoard = extracted !== null;

  // B15: the board is stale when inputs changed after the last build.
  // Compared against state (lastBuilt), not refs — eslint forbids ref reads in render.
  const stale =
    hasBoard &&
    lastBuilt !== null &&
    (lastBuilt.text !== dictateText.trim() ||
      lastBuilt.audio !== audioFile ||
      lastBuilt.meta !== meta) &&
    !busy;

  const startTimer = useCallback(() => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // B8: one build() — dictated → splitSentences → /api/extract;
  // audio → /api/transcribe → /api/extract.
  const build = useCallback(async () => {
    if (busy) return;
    setError(null);
    setShareUrl(null);

    const isDictated = tab === "dictate";
    const text = dictateText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    if (isDictated && words < 12) {
      setError("Keep going — at least 12 words, or try a sample below.");
      return;
    }
    if (!isDictated && !audioFile) {
      setError("Record or upload audio first.");
      return;
    }

    setBusy(true);
    startTimer();
    const source = isDictated ? "dictated" : audioSource;
    const sourceMeta: MeetingMeta = { ...meta, source };

    try {
      let segs: Segment[];
      let fullText: string;

      if (isDictated) {
        segs = splitSentences(text);
        fullText = text;
        setStep("Extracting decisions…");
      } else {
        setStep("Transcribing…");
        if (audioFile && audioFile.size > MAX_UPLOAD_BYTES) {
          throw new Error("Audio is over 4 MB. Record a shorter recap or compress it.");
        }
        const fd = new FormData();
        fd.append("audio", audioFile!, audioFilename(audioFile!.type, audioFile!.name));
        const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
        const tBody = await tRes.text();
        let tJson: unknown;
        try {
          tJson = JSON.parse(tBody) as Transcript;
        } catch {
          throw new Error(tRes.status === 413 ? "Upload too large." : `Transcription failed (${tRes.status}).`);
        }
        if (!tRes.ok) {
          const err = tJson as unknown as ApiError;
          throw new Error(err.error ?? `Transcription failed (${tRes.status}).`);
        }
        fullText = (tJson as Transcript).text;
        segs = (tJson as Transcript).segments;
        setStep("Extracting decisions…");
      }

      setTranscriptText(fullText);
      setSegments(segs);

      const eRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullText, segments: segs, meta: sourceMeta }),
      });
      const eBody = await eRes.text();
      let eJson: unknown;
      try {
        eJson = JSON.parse(eBody) as ExtractResponse;
      } catch {
        throw new Error(`Extraction failed (${eRes.status}).`);
      }
      if (!eRes.ok) {
        const err = eJson as unknown as ApiError;
        throw new Error(err.error ?? `Extraction failed (${eRes.status}).`);
      }
      setExtracted((eJson as ExtractResponse).extracted);
      setPromptVersion((eJson as ExtractResponse).promptVersion);
      setLastBuilt({ text: isDictated ? text : "", audio: isDictated ? null : audioFile, meta });
      setSelectedSeg(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      stopTimer();
      setBusy(false);
      setStep("");
    }
  }, [busy, tab, dictateText, audioFile, audioSource, meta, startTimer, stopTimer]);

  // B11: regenerate the share link whenever the edited board or meta changes
  useEffect(() => {
    if (!extracted) return;
    let cancelled = false;
    (async () => {
      try {
        const { url, truncated } = await encodeShareUrl(
          {
            meta,
            extracted,
            transcript: { text: transcriptText, segments },
            promptVersion,
          },
          typeof window !== "undefined" ? window.location.origin : "",
        );
        if (!cancelled) {
          setShareUrl(url);
          setShareTruncated(truncated);
        }
      } catch {
        if (!cancelled) setShareUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [extracted, meta, transcriptText, segments, promptVersion]);

  const copyMarkdown = useCallback(async () => {
    if (!extracted) return;
    await navigator.clipboard.writeText(toMarkdown(extracted, meta, shareUrl ?? undefined));
  }, [extracted, meta, shareUrl]);

  const postSlack = useCallback(
    async (webhookUrl: string): Promise<SlackResponse> => {
      if (!extracted) return { ok: false, error: "Nothing to post yet." };
      const res = await fetch("/api/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          extracted,
          meta,
          shareUrl: shareUrl ?? "",
        }),
      });
      return (await res.json()) as SlackResponse;
    },
    [extracted, meta, shareUrl],
  );

  // B15: new board — clear everything back to the Dictate tab
  const resetBoard = useCallback(() => {
    setExtracted(null);
    setSegments([]);
    setTranscriptText("");
    setPromptVersion("");
    setSelectedSeg(null);
    setShareUrl(null);
    setShareTruncated(false);
    setError(null);
    setLastBuilt(null);
    setTab("dictate");
    setDictateText("");
    setAudioFile(null);
    setMeta({ date: new Date().toISOString().slice(0, 10) });
  }, []);

  const onSample = useCallback((s: SampleRecap) => {
    setDictateText(s.text);
    setMeta((m) => ({ ...m, title: s.title, kind: s.kind }));
    setTab("dictate");
  }, []);

  // build is allowed once there's something to build and health doesn't forbid it
  const dictateWords = dictateText.trim() ? dictateText.trim().split(/\s+/).length : 0;
  const canBuild =
    busy === false &&
    ((tab === "dictate" && dictateWords >= 12) || (tab !== "dictate" && audioFile !== null)) &&
    (health === null || health.hasKey);

  const stepLabel = busy && step ? `${step} ${elapsed}s` : "";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <main className="mx-auto flex w-full max-w-[768px] flex-col gap-6 px-4 py-10">
        {/* B1: hero */}
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            NoHands Log
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Speak a meeting recap → a finished board of decisions, actions, owners, and open questions.
          </p>
          <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Built for Wispr Flow</p>
        </header>

        {/* B2: health banner + mock badge (renders itself, reports via onHealth) */}
        <HealthBanner onHealth={setHealth} />

        {/* B3: input card with tabs */}
        <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <InputTabs active={tab} onChange={setTab} />
          {tab === "dictate" && (
            <DictateInput
              value={dictateText}
              onChange={setDictateText}
              onBuild={build}
              samples={SAMPLE_RECAPS}
              onSample={onSample}
              disabled={busy || (health !== null && !health.hasKey)}
            />
          )}
          {tab === "record" && (
            <Recorder
              onAudio={(blob, mime) => {
                setAudioFile(new File([blob], "recording", { type: mime }));
                setAudioSource("recorded");
              }}
              disabled={busy || (health !== null && !health.hasKey)}
            />
          )}
          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              <Uploader
                onAudio={(file) => {
                  setAudioFile(file);
                  setAudioSource("uploaded");
                }}
                disabled={busy || (health !== null && !health.hasKey)}
              />
              <SampleButton
                onAudio={(file) => {
                  setAudioFile(file);
                  setAudioSource("sample");
                }}
                disabled={busy || (health !== null && !health.hasKey)}
              />
            </div>
          )}
        </section>

        {/* B5: details form (fully controlled — fixes the dropped-title bug) */}
        <ContextForm value={meta} onChange={setMeta} disabled={busy || (health !== null && !health.hasKey)} />

        {/* B8: build button */}
        <section>
          <button
            type="button"
            onClick={build}
            disabled={!canBuild}
            className="w-full rounded-xl bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {busy ? "Processing…" : hasBoard ? "Process again" : "Build board"}
          </button>
          {busy && <p className="mt-2 text-center text-sm text-zinc-400">{stepLabel}</p>}
        </section>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={build}
              className="shrink-0 rounded bg-red-600 px-2 py-1 text-xs font-medium text-white"
            >
              Retry
            </button>
          </div>
        )}

        {stale && hasBoard && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            Inputs changed, rebuild?
          </div>
        )}

        {/* B9: results */}
        {extracted && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Board
              </h2>
              <div className="flex items-center gap-2">
                <ReadBackButton extracted={extracted} />
                <button
                  type="button"
                  onClick={resetBoard}
                  className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  New board
                </button>
              </div>
            </div>
            <Board
              extracted={extracted}
              meta={meta}
              segments={segments}
              onSelect={setSelectedSeg}
              editable
              onChange={setExtracted}
            />
          </div>
        )}

        {/* B10: transcript + audio */}
        {transcriptText && (
          <TranscriptPanel
            segments={segments}
            selectedSeg={selectedSeg}
            onSelect={setSelectedSeg}
          />
        )}
        {audioFile && extracted && (
          <AudioPlayer
            audio={audioFile}
            seekTo={
              selectedSeg !== null && segments[selectedSeg]?.start !== undefined
                ? formatTs(segments[selectedSeg].start!)
                : null
            }
          />
        )}

        {/* B11: share */}
        {extracted && (
          <ShareCard
            shareUrl={shareUrl}
            truncated={shareTruncated}
            onCopyMarkdown={copyMarkdown}
            onSlack={postSlack}
          />
        )}
      </main>
    </div>
  );
}

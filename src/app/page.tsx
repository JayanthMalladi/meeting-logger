"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ApiError,
  Extracted,
  ExtractResponse,
  HealthResponse,
  InputMode,
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
import BoardSkeleton from "@/components/BoardSkeleton";
import TranscriptPanel from "@/components/TranscriptPanel";
import AudioPlayer from "@/components/AudioPlayer";
import ShareCard from "@/components/ShareCard";
import ReadBackButton from "@/components/ReadBackButton";
import HealthBanner from "@/components/HealthBanner";
import ProgressSteps, { type Step } from "@/components/ProgressSteps";
import { btnGhost, card, kbd } from "@/components/ui";

type Tab = "dictate" | "record" | "upload";
type RawStep = { label: string; startedAt?: number; endedAt?: number };

export default function Home() {
  // --- input state ---
  const [tab, setTab] = useState<Tab>("dictate");
  const [dictateText, setDictateText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSource, setAudioSource] = useState<"recorded" | "uploaded" | "sample">("recorded");
  const [meta, setMeta] = useState<MeetingMeta>({});
  const [dictating, setDictating] = useState(false);
  const [recording, setRecording] = useState(false);

  // --- result state ---
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [transcriptText, setTranscriptText] = useState("");
  const [promptVersion, setPromptVersion] = useState("");
  const [builtSource, setBuiltSource] = useState<InputMode>("dictated");
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [selectTick, setSelectTick] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareTruncated, setShareTruncated] = useState(false);

  // --- status state ---
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [lastBuilt, setLastBuilt] = useState<{ text: string; audio: File | null; meta: MeetingMeta } | null>(null);

  // --- generating state (steps are real: each flips when its request resolves) ---
  const [rawSteps, setRawSteps] = useState<RawStep[]>([]);
  const [pendingSegs, setPendingSegs] = useState<Segment[]>([]);
  const [now, setNow] = useState(0);
  const [buildStart, setBuildStart] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasBoard = extracted !== null;
  // Meta shown on the board / share link / markdown / Slack: the details form
  // plus how the input arrived.
  const boardMeta: MeetingMeta = { ...meta, source: builtSource };

  // B15: the board is stale when inputs changed after the last build.
  const stale =
    hasBoard &&
    lastBuilt !== null &&
    (lastBuilt.text !== dictateText.trim() || lastBuilt.audio !== audioFile || lastBuilt.meta !== meta) &&
    !busy;

  const startTimer = useCallback(() => {
    const t0 = Date.now();
    setBuildStart(t0);
    setNow(t0);
    timerRef.current = setInterval(() => setNow(Date.now()), 100);
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);
  useEffect(() => stopTimer, [stopTimer]);

  const beginStep = (i: number, label?: string) =>
    setRawSteps((all) =>
      all.map((st, j) => (j === i ? { label: label ?? st.label, startedAt: Date.now() } : st)),
    );
  const endStep = (i: number, label?: string) =>
    setRawSteps((all) =>
      all.map((st, j) =>
        j === i ? { label: label ?? st.label, startedAt: st.startedAt ?? Date.now(), endedAt: Date.now() } : st,
      ),
    );

  const selectSeg = useCallback((i: number) => {
    setSelectedSeg(i);
    setSelectTick((t) => t + 1);
  }, []);

  // B8: one build() — dictated → splitSentences → /api/extract;
  // audio → /api/transcribe → /api/extract.
  const build = useCallback(async () => {
    if (busy) return;
    setError(null);

    const isDictated = tab === "dictate";
    const text = dictateText.trim();
    const words = text ? text.split(/\s+/).length : 0;
    if (isDictated && words < 12) {
      setError("Keep going: at least 12 words, or try a sample below.");
      return;
    }
    if (!isDictated && !audioFile) {
      setError("Record or upload audio first.");
      return;
    }

    setBusy(true);
    setPendingSegs([]);
    setRawSteps(
      isDictated
        ? [{ label: "Splitting into sentences" }, { label: "Extracting decisions…" }, { label: "Linking items to sentences" }]
        : [
            { label: "Transcribing audio…" },
            { label: "Reading transcript segments" },
            { label: "Extracting decisions…" },
            { label: "Linking items to sentences" },
          ],
    );
    startTimer();
    const source: InputMode = isDictated ? "dictated" : audioSource;
    const sourceMeta: MeetingMeta = { ...meta, source };

    try {
      let segs: Segment[];
      let fullText: string;
      let extractStep: number;

      if (isDictated) {
        beginStep(0);
        segs = splitSentences(text);
        fullText = text;
        endStep(0, `Split into ${segs.length} ${segs.length === 1 ? "sentence" : "sentences"}`);
        extractStep = 1;
      } else {
        beginStep(0);
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
        endStep(0, "Transcribed audio");
        beginStep(1);
        endStep(1, `Split into ${segs.length} ${segs.length === 1 ? "segment" : "segments"}`);
        extractStep = 2;
      }

      // The transcript is real at this point: show it beside the skeleton.
      setPendingSegs(segs);
      beginStep(extractStep);

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
      endStep(extractStep, "Extracted decisions");
      beginStep(extractStep + 1);
      endStep(extractStep + 1);

      // Commit the whole result together so a failed rebuild never leaves a
      // board paired with a different transcript.
      setTranscriptText(fullText);
      setSegments(segs);
      setBuiltSource(source);
      setExtracted((eJson as ExtractResponse).extracted);
      setPromptVersion((eJson as ExtractResponse).promptVersion);
      setLastBuilt({ text: isDictated ? text : "", audio: isDictated ? null : audioFile, meta });
      setSelectedSeg(null);
      setShareUrl(null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      stopTimer();
      setBusy(false);
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
            meta: { ...meta, source: builtSource },
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
  }, [extracted, meta, builtSource, transcriptText, segments, promptVersion]);

  const copyMarkdown = useCallback(async () => {
    if (!extracted) return;
    await navigator.clipboard.writeText(toMarkdown(extracted, { ...meta, source: builtSource }, shareUrl ?? undefined));
  }, [extracted, meta, builtSource, shareUrl]);

  const postSlack = useCallback(
    async (webhookUrl: string): Promise<SlackResponse> => {
      if (!extracted) return { ok: false, error: "Nothing to post yet." };
      const res = await fetch("/api/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl,
          extracted,
          meta: { ...meta, source: builtSource },
          shareUrl: shareUrl ?? "",
        }),
      });
      return (await res.json()) as SlackResponse;
    },
    [extracted, meta, builtSource, shareUrl],
  );

  // B15: new board — clear everything back to the Dictate tab
  const resetBoard = useCallback(() => {
    setExtracted(null);
    setSegments([]);
    setPendingSegs([]);
    setTranscriptText("");
    setPromptVersion("");
    setSelectedSeg(null);
    setShareUrl(null);
    setShareTruncated(false);
    setError(null);
    setLastBuilt(null);
    setEditing(false);
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

  const inputsLocked = busy || (health !== null && !health.hasKey);
  const dictateWords = dictateText.trim() ? dictateText.trim().split(/\s+/).length : 0;
  const canBuild =
    busy === false &&
    ((tab === "dictate" && dictateWords >= 12) || (tab !== "dictate" && audioFile !== null)) &&
    (health === null || health.hasKey);

  // --- derived view state ---
  const steps: Step[] = rawSteps.map((st) => ({
    label: st.label,
    status: st.endedAt !== undefined ? "done" : st.startedAt !== undefined ? "run" : "wait",
    ms: st.startedAt !== undefined ? (st.endedAt ?? now) - st.startedAt : undefined,
  }));
  const showInput = !busy && (!hasBoard || editing);
  const showResults = busy || hasBoard;
  const seekTo =
    selectedSeg !== null && segments[selectedSeg]?.start !== undefined
      ? formatTs(segments[selectedSeg].start!)
      : null;

  return (
    <div className="min-h-screen">
      <main
        className={`relative mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:py-8 ${
          showResults ? "max-w-[768px] lg:max-w-[1180px]" : "max-w-[820px]"
        }`}
      >
        {/* B1: hero */}
        <header
          className={`flex flex-wrap items-start justify-between gap-3 ${
            showResults ? "" : "pt-4 sm:pt-10"
          }`}
        >
          <div className={showResults ? "" : "w-full text-center"}>
            <div className={`flex items-center gap-2 ${showResults ? "" : "justify-center"}`}>
              <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-[#14131A] dark:bg-[#F6F3EE]">
                <span className="wave" data-active="false" style={{ height: 12, gap: 2 }}>
                  <span style={{ width: 2, background: "#C9B8FF" }} />
                  <span style={{ width: 2, background: "#FFD3B8" }} />
                  <span style={{ width: 2, background: "#BFE3FF" }} />
                </span>
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.01em]">NoHands Log</span>
              <span className="rounded-full bg-[#ece6ff] px-2.5 py-0.5 text-[11px] font-medium text-[#4b3a9a] dark:bg-[#2a2542] dark:text-[#cfc4ff]">
                Built for Wispr Flow
              </span>
            </div>
            {!showResults && (
              <>
                <h1 className="mx-auto mt-8 max-w-3xl text-balance font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-zinc-900 sm:text-[76px] dark:text-zinc-50">
                  Say what happened. <em className="text-[#6E56CF] dark:text-[#a898f0]">Get the board.</em>
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">
                  Speak your meeting recap with Wispr Flow. NoHands Log turns it into decisions, owners and next steps.
                </p>
              </>
            )}
          </div>
          {/* B2: health banner + mock badge */}
          <div className={showResults ? "" : "absolute right-4 top-4"}>
            <HealthBanner onHealth={setHealth} />
          </div>
        </header>

        {/* B3: input card with tabs. Hidden (not unmounted) while a board is
            shown or building, so nothing the user typed is lost. */}
        <section className={`${card} !p-3 sm:!p-5 ${showInput ? "" : "hidden"}`} aria-label="Recap input">
          <InputTabs active={tab} onChange={setTab} />
          {tab === "dictate" && (
            <DictateInput
              value={dictateText}
              onChange={setDictateText}
              onBuild={build}
              onListening={setDictating}
              samples={SAMPLE_RECAPS}
              onSample={onSample}
              disabled={inputsLocked}
              extraChips={
                <SampleButton
                  onAudio={(file) => {
                    setAudioFile(file);
                    setAudioSource("sample");
                    setTab("upload");
                  }}
                  loaded={audioFile?.name === "demo-standup.mp3"}
                  disabled={inputsLocked}
                />
              }
            />
          )}
          {tab === "record" && (
            <Recorder
              onRecording={setRecording}
              onAudio={(blob, mime) => {
                setAudioFile(new File([blob], "recording", { type: mime }));
                setAudioSource("recorded");
              }}
              disabled={inputsLocked}
            />
          )}
          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              <Uploader
                onAudio={(file) => {
                  setAudioFile(file);
                  setAudioSource("uploaded");
                }}
                disabled={inputsLocked}
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <SampleButton
                  onAudio={(file) => {
                    setAudioFile(file);
                    setAudioSource("sample");
                  }}
                  loaded={audioFile?.name === "demo-standup.mp3"}
                  disabled={inputsLocked}
                />
                {audioFile && (
                  <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                    Ready: {audioFile.name}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* B5: details form (fully controlled) */}
          <div className="mt-4 px-2">
            <ContextForm value={meta} onChange={setMeta} disabled={inputsLocked} />
          </div>

          {/* Floating pill bar: waveform + hint + build */}
          <div className="mt-4 flex items-center gap-3 rounded-full border border-black/[0.06] bg-[#F6F3EE] py-2 pl-5 pr-2 shadow-[0_6px_24px_-10px_rgba(40,30,80,0.25)] dark:border-white/10 dark:bg-[#0E0D12]">
            <span className="wave" data-active={dictating || recording ? "true" : "false"} aria-hidden>
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    animationDelay: `${(i * 97) % 700}ms`,
                    animationDuration: `${700 + ((i * 131) % 500)}ms`,
                  }}
                />
              ))}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-500 dark:text-zinc-400">
              {recording ? "Recording…" : "Hold your Wispr Flow key and talk"}
            </span>
            <button
              type="button"
              onClick={build}
              disabled={!canBuild}
              className="flex shrink-0 items-center gap-2 rounded-full bg-[#14131A] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#2b2938] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6E56CF] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#F6F3EE] dark:text-[#14131A] dark:hover:bg-white"
            >
              <span>{hasBoard ? "Rebuild board" : "Build board"}</span>
              <kbd className={`${kbd} hidden !border-white/20 !bg-white/10 sm:inline dark:!border-black/20 dark:!bg-black/10`}>⌘↵</kbd>
            </button>
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-2xl border border-red-300 bg-red-50 p-3 text-[13px] text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={build}
              className="shrink-0 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
            >
              Retry
            </button>
          </div>
        )}

        {stale && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <span>Inputs changed, rebuild?</span>
            {!editing && (
              <button type="button" onClick={() => setEditing(true)} className="font-semibold underline">
                Edit recap
              </button>
            )}
          </div>
        )}

        {/* Results: board + share on the left, sticky transcript beside it on wide screens */}
        {showResults && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-6">
            <div className="flex flex-col gap-4 lg:col-start-1">
              {busy ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-serif text-3xl tracking-tight">Building your <em>board…</em></h2>
                    <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {((now - buildStart) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <ProgressSteps steps={steps} />
                  <BoardSkeleton />
                </>
              ) : (
                extracted && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                      <button
                        type="button"
                        onClick={() => setEditing((v) => !v)}
                        aria-expanded={editing}
                        className={btnGhost}
                      >
                        {editing ? "Hide recap" : "✎ Edit recap"}
                      </button>
                      <div className="flex items-center gap-2">
                        <ReadBackButton extracted={extracted} />
                        <button type="button" onClick={resetBoard} className={btnGhost}>
                          New board
                        </button>
                      </div>
                    </div>
                    <Board
                      extracted={extracted}
                      meta={boardMeta}
                      segments={segments}
                      onSelect={selectSeg}
                      selectedSeg={selectedSeg}
                      editable
                      onChange={setExtracted}
                    />
                  </>
                )
              )}
            </div>

            {/* B10: transcript + audio */}
            {(busy ? pendingSegs.length > 0 : transcriptText !== "") && (
              <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
                {!busy && lastBuilt?.audio && extracted && (
                  <AudioPlayer audio={lastBuilt.audio} seekTo={seekTo} seekTick={selectTick} />
                )}
                <TranscriptPanel
                  segments={busy ? pendingSegs : segments}
                  selectedSeg={busy ? null : selectedSeg}
                  selectTick={selectTick}
                  onSelect={selectSeg}
                  title={busy ? "Reading transcript" : "Transcript"}
                  tall
                />
              </aside>
            )}

            {/* B11: share */}
            {!busy && extracted && (
              <div className="lg:col-start-1">
                <ShareCard
                  shareUrl={shareUrl}
                  truncated={shareTruncated}
                  onCopyMarkdown={copyMarkdown}
                  onSlack={postSlack}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

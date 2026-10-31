"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { decodeShareSlug, type SharePayload } from "@/lib/share";
import { toMarkdown } from "@/lib/markdown";
import Board from "@/components/Board";
import TranscriptPanel from "@/components/TranscriptPanel";
import { btnGhost, btnPrimary, card } from "@/components/ui";

const SHELL = "mx-auto flex w-full max-w-[768px] flex-col gap-4 px-4 py-6 sm:py-8";

function Skeleton() {
  return (
    <div className={SHELL} aria-busy="true" aria-label="Loading board">
      <div className="skel !h-3.5 w-40" />
      <div className="skel !h-9 w-72" />
      <div className={`${card} flex flex-col gap-3`}>
        <div className="skel w-1/3" />
        <div className="skel w-4/5" />
        <div className="skel w-3/5" />
        <div className="skel mt-2 w-1/3" />
        <div className="skel w-3/4" />
        <div className="skel w-1/2" />
      </div>
    </div>
  );
}

function ShareViewInner() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState(false);
  const [selectedSeg, setSelectedSeg] = useState<number | null>(null);
  const [selectTick, setSelectTick] = useState(0);
  const [copied, setCopied] = useState<"link" | "md" | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    decodeShareSlug(slug)
      .then((p) => {
        if (!cancelled) setPayload(p);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const copy = async (what: "link" | "md") => {
    if (!payload) return;
    try {
      await navigator.clipboard.writeText(
        what === "link" ? window.location.href : toMarkdown(payload.extracted, payload.meta, window.location.href),
      );
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  if (error) {
    return (
      <div className={SHELL}>
        <div className={`${card} flex flex-col items-start gap-3`}>
          <h1 className="font-serif text-3xl">This link doesn&apos;t open</h1>
          <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
            It is malformed, cut off, or was made by an older version of NoHands Log.
          </p>
          <Link href="/" className={`${btnPrimary} print:hidden`}>
            Make your own board
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) return <Skeleton />;

  const segs = payload.transcript.segments;
  const hasTranscript = segs.length > 0;

  return (
    <div
      className={`mx-auto flex w-full flex-col gap-5 px-4 py-6 sm:py-8 ${
        hasTranscript ? "max-w-[768px] lg:max-w-[1180px]" : "max-w-[768px]"
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 hover:underline dark:text-zinc-50">
            NoHands Log
          </Link>
          <span aria-hidden>·</span>
          <span>Shared board · read only</span>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button type="button" onClick={() => copy("link")} className={btnGhost}>
            {copied === "link" ? "Copied ✓" : "Copy link"}
          </button>
          <button type="button" onClick={() => copy("md")} className={btnGhost}>
            {copied === "md" ? "Markdown copied ✓" : "Copy as Markdown"}
          </button>
          <Link href="/" className={`${btnGhost} !border-transparent !bg-[#14131A] !text-white hover:!bg-[#2b2938] dark:!bg-[#F6F3EE] dark:!text-[#14131A]`}>
            Make your own board
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-x-6">
        <div className="lg:col-start-1">
          <Board
            extracted={payload.extracted}
            meta={payload.meta}
            segments={segs}
            onSelect={(i) => {
              setSelectedSeg(i);
              setSelectTick((t) => t + 1);
            }}
            selectedSeg={selectedSeg}
            editable={false}
            onChange={() => {}}
          />
        </div>

        {hasTranscript && (
          <aside className="flex min-w-0 flex-col gap-2 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
            <TranscriptPanel
              segments={segs}
              selectedSeg={selectedSeg}
              selectTick={selectTick}
              onSelect={(i) => {
                setSelectedSeg(i);
                setSelectTick((t) => t + 1);
              }}
              withAudio={false}
              title="Where it came from"
              tall
            />
            {payload.transcript.truncated && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Transcript shortened to fit the link.</p>
            )}
          </aside>
        )}
      </div>

      <footer className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
        Made with NoHands Log · spoken with Wispr Flow
      </footer>
    </div>
  );
}

export default function ShareView() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ShareViewInner />
    </Suspense>
  );
}

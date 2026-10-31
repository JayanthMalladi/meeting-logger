export type Step = {
  label: string;
  status: "done" | "run" | "wait";
  /** Milliseconds spent (done) or so far (run). */
  ms?: number;
};

function fmt(ms?: number): string {
  if (ms === undefined) return "–";
  if (ms < 100) return "<0.1s";
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Step-by-step progress with per-step elapsed time (Generating state). */
export default function ProgressSteps({ steps }: { steps: Step[] }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-4">
      <div className="orb" aria-hidden />
      <ul className="flex w-full max-w-md flex-col gap-2">
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-full border border-black/[0.06] px-4 py-2 text-[13px] backdrop-blur transition dark:border-white/10 ${
              s.status === "wait"
                ? "bg-white/40 text-zinc-400 dark:bg-white/[0.03] dark:text-zinc-500"
                : s.status === "run"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-[#17161C] dark:text-zinc-50"
                  : "bg-white/70 text-zinc-800 dark:bg-white/[0.06] dark:text-zinc-100"
            }`}
          >
            {s.status === "done" && (
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#6E56CF] text-[11px] text-white" aria-hidden>
                ✓
              </span>
            )}
            {s.status === "run" && (
              <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#6E56CF] border-t-transparent" aria-hidden />
            )}
            {s.status === "wait" && (
              <span className="h-5 w-5 shrink-0 rounded-full border-2 border-black/10 dark:border-white/15" aria-hidden />
            )}
            <span className={s.status === "run" ? "font-semibold" : ""}>{s.label}</span>
            <span className="ml-auto font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              {s.status === "wait" ? "–" : fmt(s.ms)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

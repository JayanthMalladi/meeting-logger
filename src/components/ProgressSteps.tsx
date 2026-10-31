import { card } from "./ui";

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
    <div className={card} role="status" aria-live="polite">
      <ul>
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-center gap-2.5 border-b border-zinc-100 py-[7px] text-[13px] last:border-b-0 dark:border-zinc-800 ${
              s.status === "wait" ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {s.status === "done" && (
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500 text-[10px] text-white" aria-hidden>
                ✓
              </span>
            )}
            {s.status === "run" && (
              <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" aria-hidden />
            )}
            {s.status === "wait" && (
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-zinc-200 dark:border-zinc-700" aria-hidden />
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

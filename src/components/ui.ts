/** Shared Tailwind class strings for the Ledger look. */
export const card =
  "rounded-xl border border-zinc-200 bg-white p-3.5 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900";

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900";

export const btnPrimary = `rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white ${focusRing}`;

export const btnGhost = `rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 ${focusRing}`;

export const field = `w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500`;

export const sectionHeading =
  "mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500 dark:text-zinc-400";

export const kbd =
  "rounded border border-b-2 border-zinc-300 bg-white px-1 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";

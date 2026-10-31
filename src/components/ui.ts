/** Shared Tailwind class strings for the Flow look. */
export const card =
  "rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_10px_40px_-12px_rgba(10,37,51,0.12)] sm:p-6 dark:border-white/10 dark:bg-[#0B2230] dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.6)]";

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D83995]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCFFFF] dark:focus-visible:ring-offset-[#04141C]";

export const btnPrimary = `rounded-full bg-[#D83995] px-5 py-2.5 text-base font-bold text-[#1F0A16] transition hover:bg-[#E255A8] disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

export const btnGhost = `rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-zinc-700 backdrop-blur transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 ${focusRing}`;

export const field = `w-full rounded-2xl border border-black/10 bg-white px-3.5 py-2.5 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-[#D83995] focus:outline-none focus:ring-2 focus:ring-[#D83995]/25 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#04141C] dark:text-zinc-100 dark:placeholder:text-zinc-500`;

export const sectionHeading =
  "mb-3 flex items-center gap-2 font-serif text-2xl font-normal tracking-tight text-zinc-900 dark:text-zinc-50";

export const eyebrow =
  "text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500 dark:text-zinc-400";

export const kbd =
  "rounded-md border border-black/10 bg-black/[0.04] px-1.5 font-mono text-[10px] font-medium text-current opacity-80 dark:border-white/15 dark:bg-white/10";

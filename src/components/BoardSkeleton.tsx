import { card, sectionHeading } from "./ui";

/** Placeholder board shown while the model works: sections with shimmer rows. */
export default function BoardSkeleton() {
  const sections: { color: string; label: string; rows: string[] }[] = [
    { color: "bg-emerald-500", label: "Decisions", rows: ["80%", "55%"] },
    { color: "bg-zinc-900 dark:bg-zinc-200", label: "Actions", rows: ["70%", "85%", "60%"] },
    { color: "bg-sky-500", label: "Open questions", rows: ["50%", "65%"] },
  ];
  return (
    <div className={`${card} flex flex-col gap-4`} aria-hidden>
      {sections.map((s) => (
        <div key={s.label}>
          <h2 className={sectionHeading}>
            <i className={`inline-block h-2 w-2 rounded-sm ${s.color}`} />
            {s.label}
          </h2>
          <div className="flex flex-col gap-2.5 px-2 py-1">
            {s.rows.map((w, i) => (
              <div key={i} className="skel" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

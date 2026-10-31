import { card, sectionHeading } from "./ui";

/** Placeholder board shown while the model works: sections with shimmer rows. */
export default function BoardSkeleton() {
  const sections: { dot: string; label: string; rows: string[] }[] = [
    { dot: "bg-[#8fd6a8]", label: "Decisions", rows: ["80%", "55%"] },
    { dot: "bg-[#D83995]", label: "Actions", rows: ["70%", "85%", "60%"] },
    { dot: "bg-[#7FD0EE]", label: "Open questions", rows: ["50%", "65%"] },
  ];
  return (
    <div className={`${card} flex flex-col gap-6`} aria-hidden>
      {sections.map((s) => (
        <div key={s.label}>
          <h2 className={sectionHeading}>
            <i className={`inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
            {s.label}
          </h2>
          <div className="flex flex-col gap-3 px-1 py-1">
            {s.rows.map((w, i) => (
              <div key={i} className="skel" style={{ width: w }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

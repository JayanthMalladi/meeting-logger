"use client";

import { useEffect, useState } from "react";
import type { HealthResponse } from "@/lib/types";

type Props = { onHealth(health: HealthResponse | null): void };

/**
 * B2: fetch /api/health on mount. Parent gets the result (to disable Build)
 * and this component renders the amber banner + grey mock badge.
 */
export default function HealthBanner({ onHealth }: Props) {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((h: HealthResponse) => {
        if (!cancelled) {
          setHealth(h);
          onHealth(h);
        }
      })
      .catch(() => {
        if (!cancelled) onHealth(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!health) return null;

  if (health.hasKey) {
    return health.mock ? (
      <span className="inline-flex w-fit rounded-full bg-black/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
        Mock mode
      </span>
    ) : null;
  }

  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <span>Add GROQ_API_KEY to enable processing.</span>
    </div>
  );
}

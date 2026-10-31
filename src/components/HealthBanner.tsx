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

  if (!health || health.hasKey) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
      <span>Add GROQ_API_KEY to enable processing — boards will show mock data until then.</span>
      {health.mock && (
        <span className="inline-flex w-fit rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          Mock mode
        </span>
      )}
    </div>
  );
}

"use client";

import { useRef } from "react";

type Tab = "dictate" | "record" | "upload";

type Props = {
  active: Tab;
  onChange: (tab: Tab) => void;
};

const TABS: { id: Tab; label: string }[] = [
  { id: "dictate", label: "Dictate" },
  { id: "record", label: "Record" },
  { id: "upload", label: "Upload" },
];

/**
 * Tab bar for the input section. Children (panel content) are rendered by the
 * parent — this is only the bar. Keyboard: Left/Right move+activate,
 * Home/End jump.
 */
export default function InputTabs({ active, onChange }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const activate = (tab: Tab) => {
    onChange(tab);
    refs.current[TABS.findIndex((t) => t.id === tab)]?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = TABS.findIndex((t) => t.id === active);
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        activate(TABS[(idx + TABS.length - 1) % TABS.length].id);
        break;
      case "ArrowRight":
        e.preventDefault();
        activate(TABS[(idx + 1) % TABS.length].id);
        break;
      case "Home":
        e.preventDefault();
        activate(TABS[0].id);
        break;
      case "End":
        e.preventDefault();
        activate(TABS[TABS.length - 1].id);
        break;
    }
  };

  return (
    <div role="tablist" aria-label="Input source" className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" onKeyDown={onKeyDown}>
      {TABS.map((tab, i) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 dark:focus-visible:ring-zinc-300 ${
              isActive ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

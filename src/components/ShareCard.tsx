"use client";

import { useState } from "react";

type Props = {
  shareUrl: string;
  onSlack: (webhookUrl: string) => Promise<{ ok: boolean; error?: string }>;
  onCopyDone?: () => void;
};

/**
 * Copy share link + optional Slack webhook post.
 * "Anyone with the link can read this digest" is stated in the UI.
 */
export default function ShareCard({ shareUrl, onSlack }: Props) {
  const [copied, setCopied] = useState(false);
  const [webhook, setWebhook] = useState("");
  const [slackMsg, setSlackMsg] = useState<string | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be blocked — surface the URL for manual copy
      alert("Copy failed. The URL is: " + shareUrl);
    }
  };

  const post = async () => {
    if (!webhook.trim()) return;
    const res = await onSlack(webhook.trim());
    setSlackMsg(res.ok ? "Posted ✓" : res.error ?? "Failed to post.");
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Share
        </h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Anyone with the link can read this digest.
        </span>
      </div>
      <div className="flex gap-2">
        <input
          readOnly
          value={shareUrl}
          className="w-full truncate rounded-lg border border-zinc-300 px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
          onFocus={(e) => e.target.select()}
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>

      <details>
        <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
          Post digest to Slack (webhook)
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="button"
            onClick={post}
            disabled={!webhook.trim()}
            className="self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Post to Slack
          </button>
          {slackMsg && <p className="text-sm text-zinc-500 dark:text-zinc-400">{slackMsg}</p>}
        </div>
      </details>
    </div>
  );
}

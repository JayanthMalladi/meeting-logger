"use client";

import { useState } from "react";

type Props = {
  shareUrl: string | null; // null while encoding
  truncated: boolean;
  onCopyMarkdown(): void;
  onSlack(webhookUrl: string): Promise<{ ok: boolean; error?: string }>;
};

const HOOK_PREFIX = "https://hooks.slack.com/";

/**
 * B11: share controls.
 * Copy link / Open / Copy as Markdown. `shareUrl` null → "Preparing link…".
 * Slack webhook behind <details>, validated to https://hooks.slack.com/
 * only; inline ok/failure. No alert().
 */
export default function ShareCard({ shareUrl, truncated, onCopyMarkdown, onSlack }: Props) {
  const [copied, setCopied] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [webhook, setWebhook] = useState("");
  const [slackMsg, setSlackMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const webhookValid =
    webhook.trim() !== "" && webhook.trim().startsWith(HOOK_PREFIX);
  const webhookHint =
    webhook.trim() === ""
      ? null
      : webhookValid
        ? null
        : "Webhook must be an https://hooks.slack.com/ URL.";

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — select the field so manual copy works
      setCopied(false);
    }
  };

  const copyMarkdown = () => {
    onCopyMarkdown();
    setMarkdownCopied(true);
    window.setTimeout(() => setMarkdownCopied(false), 2000);
  };

  const post = async () => {
    if (!webhookValid) return;
    setSlackMsg(null);
    const res = await onSlack(webhook.trim());
    setSlackMsg({ ok: res.ok, text: res.ok ? "Posted ✓" : res.error ?? "Failed to post." });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Share
        </h2>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Anyone with the link can read this board.
        </span>
      </div>

      {shareUrl ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copy}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {copied ? "Copied ✓" : "Copy link"}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-200"
          >
            Open
          </a>
          <button
            type="button"
            onClick={copyMarkdown}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-200"
          >
            {markdownCopied ? "Markdown copied ✓" : "Copy as Markdown"}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Preparing link…</p>
      )}

      {truncated && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Transcript shortened to fit the link.
        </p>
      )}

      <details>
        <summary className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
          Post to Slack
        </summary>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={webhook}
            onChange={(e) => {
              setWebhook(e.target.value);
              setSlackMsg(null);
            }}
            placeholder="https://hooks.slack.com/services/..."
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {webhookHint && <p className="text-xs text-red-600 dark:text-red-400">{webhookHint}</p>}
          <button
            type="button"
            onClick={post}
            disabled={!webhookValid}
            className="self-start rounded-lg bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            Post
          </button>
          {slackMsg && (
            <p
              className={
                slackMsg.ok
                  ? "text-sm text-emerald-600 dark:text-emerald-400"
                  : "text-sm text-red-600 dark:text-red-400"
              }
            >
              {slackMsg.text}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

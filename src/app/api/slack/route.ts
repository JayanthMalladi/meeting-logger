import { NextResponse } from "next/server";
import type { Extracted as ParsedExtracted, MeetingMeta } from "@/lib/types";

/** Slack's incoming webhooks live under exactly this prefix. */
const SLACK_HOOK_PREFIX = "https://hooks.slack.com/";
const SLACK_TIMEOUT_MS = 10_000;

type SlackField = { type: "plain_text" | "mrkdwn"; text: string };
type SlackBlock =
  | { type: "header"; text: SlackField }
  | { type: "section"; text: SlackField }
  | { type: "actions"; elements: { type: "button"; text: SlackField; url: string }[] }
  | { type: "context"; elements: SlackField[] };

/**
 * POST /api/slack
 * In:  { webhookUrl: string, extracted: ParsedExtracted, meta: MeetingMeta,
 *        shareUrl?: string }
 * Out: { ok: boolean, error?: string }
 *
 * Builds a compact Slack Block Kit digest and posts it to the user-provided
 * incoming webhook (only hooks.slack.com allowed). The webhook URL is sent
 * only to Slack, never persisted.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.webhookUrl !== "string" ||
    !body.webhookUrl.startsWith(SLACK_HOOK_PREFIX)
  ) {
    return NextResponse.json(
      { ok: false, error: "Expected a Slack incoming-webhook URL (https://hooks.slack.com/…)." },
      { status: 400 },
    );
  }
  const extracted = body.extracted as ParsedExtracted | undefined;
  if (!extracted || typeof extracted.summary !== "string" || !Array.isArray(extracted.decisions)) {
    return NextResponse.json(
      { ok: false, error: "Expected a valid extracted result." },
      { status: 400 },
    );
  }
  const meta = (body.meta ?? {}) as MeetingMeta;
  const shareUrl = typeof body.shareUrl === "string" ? body.shareUrl : "";

  // ---- Plain-text fallback (used as top-level `text` and Slack's fallback render)
  const lines: string[] = [];
  if (meta.title) lines.push(`${meta.title}${meta.kind ? ` (${meta.kind})` : ""}`);
  lines.push(extracted.summary);
  if (extracted.decisions.length) {
    lines.push(`Decisions (${extracted.decisions.length}):`);
    for (const d of extracted.decisions) lines.push(`✓ ${d.text}`);
  }
  if (extracted.actions.length) {
    lines.push(`Actions (${extracted.actions.length}):`);
    for (const a of extracted.actions) {
      const owner = a.owner ? ` *${a.owner}*` : "";
      const due = a.due ? ` *(due ${a.due})*` : "";
      lines.push(`→ ${a.text}${owner}${due}`);
    }
  }
  if (extracted.openQuestions.length) {
    lines.push(`Open questions (${extracted.openQuestions.length}):`);
    for (const q of extracted.openQuestions) lines.push(`? ${q.text}`);
  }
  if (extracted.atRisk.length) {
    lines.push("At risk:");
    for (const r of extracted.atRisk) lines.push(`⚑ ${r}`);
  }
  if (shareUrl) lines.push(`Full digest: ${shareUrl}`);
  lines.push("Made with NoHands Log");

  // ---- Block Kit
  const mrkdwn = (text: string): SlackField => ({ type: "mrkdwn", text });
  const blocks: SlackBlock[] = [];

  blocks.push({
    type: "header",
    text: { type: "plain_text", text: meta.title || "Meeting board" },
  });

  blocks.push({ type: "section", text: mrkdwn(extracted.summary) });

  if (extracted.decisions.length) {
    blocks.push({
      type: "section",
      text: mrkdwn(
        `*Decisions (${extracted.decisions.length})*\n${extracted.decisions
          .map((d) => `✓ ${d.text}`)
          .join("\n")}`,
      ),
    });
  }

  if (extracted.actions.length) {
    blocks.push({
      type: "section",
      text: mrkdwn(
        `*Actions (${extracted.actions.length})*\n${extracted.actions
          .map((a) => {
            const owner = a.owner ? ` *${a.owner}*` : "";
            const due = a.due ? ` *(due ${a.due})*` : "";
            return `→ ${a.text}${owner}${due}`;
          })
          .join("\n")}`,
      ),
    });
  }

  if (extracted.openQuestions.length) {
    blocks.push({
      type: "section",
      text: mrkdwn(
        `*Open questions (${extracted.openQuestions.length})*\n${extracted.openQuestions
          .map((q) => `? ${q.text}`)
          .join("\n")}`,
      ),
    });
  }

  if (extracted.atRisk.length) {
    blocks.push({
      type: "section",
      text: mrkdwn(
        `:warning: *At risk*\n${extracted.atRisk.map((r) => `⚑ ${r}`).join("\n")}`,
      ),
    });
  }

  if (shareUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open board" },
          url: shareUrl,
        },
      ],
    });
  }

  blocks.push({
    type: "context",
    elements: [{ type: "plain_text", text: "Made with NoHands Log" }],
  });

  const payload = {
    text: lines.join("\n"),
    blocks,
  };

  try {
    const res = await fetch(body.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({
        ok: false,
        error: `Slack webhook responded ${res.status}. ${text.slice(0, 200)}`,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return NextResponse.json({
        ok: false,
        error: `Slack webhook did not respond within ${SLACK_TIMEOUT_MS / 1000}s.`,
      });
    }
    return NextResponse.json({
      ok: false,
      error: "Failed to reach the Slack webhook. " + String(err),
    });
  }
}

import { NextResponse } from "next/server";
import type { Extracted as ParsedExtracted, MeetingMeta } from "@/lib/types";

/**
 * POST /api/slack
 * In:  { webhookUrl: string, extracted: ParsedExtracted, meta: MeetingMeta,
 *        shareUrl: string, transcriptText?: string }
 * Out: { ok: boolean, error?: string }
 *
 * Builds a compact Slack `blocks` digest and posts to the user-provided
 * incoming webhook. The webhook URL is sent only to Slack, never persisted.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.webhookUrl !== "string" || !body.webhookUrl.startsWith("https://")) {
    return NextResponse.json(
      { ok: false, error: "Expected a https:// Slack incoming-webhook URL." },
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

  const lines: string[] = [];
  if (meta.title) lines.push(`*${meta.title}*${meta.kind ? ` (${meta.kind})` : ""}`);
  lines.push(extracted.summary);

  if (extracted.decisions.length) {
    lines.push("", `*Decisions (${extracted.decisions.length})*`);
    for (const d of extracted.decisions) lines.push(`  ✓ ${d.text}${d.ts ? ` \`${d.ts}\`` : ""}`);
  }
  if (extracted.actions.length) {
    lines.push("", `*Actions (${extracted.actions.length})*`);
    for (const a of extracted.actions) {
      const owner = a.owner ? ` — *${a.owner}*` : "";
      const due = a.due ? ` *(due ${a.due})*` : "";
      lines.push(`  → ${a.text}${owner}${due}${a.ts ? ` \`${a.ts}\`` : ""}`);
    }
  }
  if (extracted.openQuestions.length) {
    lines.push("", `*Open questions (${extracted.openQuestions.length})*`);
    for (const q of extracted.openQuestions) lines.push(`  ? ${q.text}`);
  }
  if (extracted.atRisk.length) {
    lines.push("", `:warning: *At risk*`);
    for (const r of extracted.atRisk) lines.push(`  ⚑ ${r}`);
  }
  if (shareUrl) lines.push("", `*Full digest:* ${shareUrl}`);
  lines.push("*Made with NoHands Log*");

  const payload = {
    text: lines.join("\n"),
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: lines.join("\n") },
      },
    ],
  };

  try {
    const res = await fetch(body.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    return NextResponse.json({
      ok: false,
      error: "Failed to reach the Slack webhook. " + String(err),
    });
  }
}

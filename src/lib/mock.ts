import type { Extracted, Segment, Transcript } from "./types";
import { formatTs } from "./audio";

/** MOCK_AI=1 → API routes return these fixtures without calling any provider (SPEC §4.4). */
export const isMock = () => process.env.MOCK_AI === "1";

const MOCK_SEGMENTS: Segment[] = [
  { i: 0, start: 0, end: 4.2, text: "Quick standup recap for the payments team." },
  { i: 1, start: 4.2, end: 9.8, text: "We decided to ship the new checkout on Friday behind a feature flag." },
  { i: 2, start: 9.8, end: 15.1, text: "Priya will finish the refund API by Wednesday." },
  { i: 3, start: 15.1, end: 21.0, text: "Someone needs to update the on-call runbook, nobody picked that up." },
  { i: 4, start: 21.0, end: 27.4, text: "We still don't know whether Stripe's new rate limits apply to us." },
  { i: 5, start: 27.4, end: 33.0, text: "Arjun is blocked on the design review, which slipped again." },
];

export function mockTranscript(): Transcript {
  return { text: MOCK_SEGMENTS.map((s) => s.text).join(" "), segments: MOCK_SEGMENTS, duration: 33 };
}

/** Builds a plausible board that references real segment indexes of whatever was sent. */
export function mockExtract(segments: Segment[]): Extracted {
  const n = Math.max(segments.length, 1);
  const at = (k: number) => {
    const s = segments[Math.min(k, n - 1)];
    return { seg: s?.i ?? 0, ...(s?.start !== undefined ? { ts: formatTs(s.start) } : {}) };
  };
  return {
    summary: "Checkout ships Friday behind a flag. Refund API due Wednesday. Runbook update is unowned.",
    decisions: [{ text: "Ship the new checkout on Friday behind a feature flag", ...at(1) }],
    actions: [
      { text: "Finish the refund API", owner: "Priya", due: "Wednesday", ...at(2) },
      { text: "Update the on-call runbook", ...at(3) },
    ],
    openQuestions: [{ text: "Do Stripe's new rate limits apply to us?", ...at(4) }],
    atRisk: ["Runbook update has no owner", "Design review slipped again, blocking Arjun"],
  };
}

#!/usr/bin/env node
/**
 * Eval harness for the three sample recaps (TASKS-A A6).
 *
 *   node scripts/eval.mjs [base-url]      (default http://localhost:3000)
 *
 * Posts each sample recap (sentences split like splitSentences: split on
 * /(?<=[.!?])\s+/, trim, skip empties, i = index) to POST {base}/api/extract
 * and prints latency, counts, owners, at-risk lines and the number of items
 * missing `seg`. Hardcoded minimums below; exit 1 on any miss, 0 when all
 * pass. Plain Node 18+ with global fetch — no dependencies.
 */

// Keep in sync with src/lib/samples.ts (track A owns both).
const SAMPLES = [
  {
    id: "standup",
    kind: "standup",
    title: "Payments standup",
    text:
      "Quick recap of today's payments standup. We decided to ship the new checkout on Friday behind a feature flag. " +
      "Priya is finishing the refund API and says it'll be done by Wednesday. I'll write the release notes tomorrow. " +
      "Someone needs to update the on-call runbook, but nobody picked it up. " +
      "We still don't know if Stripe's new rate limits apply to our account. " +
      "Arjun is blocked on the design review, which slipped for the second week in a row.",
  },
  {
    id: "planning",
    kind: "planning",
    title: "Sprint 14 planning",
    text:
      "Sprint fourteen planning. We agreed to drop the dark mode epic and focus on onboarding. " +
      "Meera owns the new signup flow and will have a prototype by next Tuesday. " +
      "Rahul is going to look into why activation dropped last week. " +
      "We're going with Postgres instead of Mongo for the events table. " +
      "Open question: do we need legal sign off before we email inactive users? " +
      "The analytics migration has no owner and it's already a week late.",
  },
  {
    id: "customer",
    kind: "customer call",
    title: "Acme renewal call",
    text:
      "Call with Acme about their renewal. They're happy overall but want SSO before they sign. " +
      "We decided to offer a three month discount if they renew this quarter. " +
      "I'll send them the revised quote by Thursday. Karthik will check with engineering whether SSO can ship in November. " +
      "They asked if we support data residency in India, and none of us knew.",
  },
];

/** Same rules as src/lib/segments.ts splitSentences, re-implemented locally. */
function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((t, i) => ({ i, text: t }));
}

const base = new URL(process.argv[2] ?? "http://localhost:3000");

let allPass = true;

for (const sample of SAMPLES) {
  const segments = splitSentences(sample.text);
  const body = {
    transcript: sample.text,
    segments,
    meta: { title: sample.title, kind: sample.kind, source: "dictated" },
  };

  const t0 = performance.now();
  let res;
  try {
    res = await fetch(`${base}api/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[${sample.id}] could not reach ${base}api/extract: ${err}`);
    process.exit(1);
  }
  const latencyMs = Math.round(performance.now() - t0);

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[${sample.id}] HTTP ${res.status}: ${errBody}`);
    process.exit(1);
  }

  const json = await res.json().catch(() => null);
  const e = json?.extracted;
  if (!json || !e || !Array.isArray(e.decisions) || !Array.isArray(e.actions)) {
    console.error(`[${sample.id}] unexpected response shape: ${JSON.stringify(json)}`);
    process.exit(1);
  }

  const decisions = e.decisions;
  const actions = e.actions;
  const questions = e.openQuestions ?? [];
  const atRisk = e.atRisk ?? [];
  const owners = [...new Set(actions.map((a) => a.owner).filter(Boolean))];
  const missingSeg = [
    ...decisions,
    ...actions,
    ...questions,
  ].filter((it) => it.seg === undefined).length;

  console.log(`\n[${sample.id}] ${sample.title} (${sample.kind})`);
  console.log(`  latency ${latencyMs} ms`);
  console.log(
    `  counts: decisions ${decisions.length} / actions ${actions.length} / questions ${questions.length} / atRisk ${atRisk.length}`,
  );
  console.log(`  owners: ${owners.length ? owners.join(", ") : "(none)"}`);
  console.log(`  atRisk: ${atRisk.length ? atRisk.map((r) => `“${r}”`).join("; ") : "(none)"}`);
  console.log(`  items missing seg: ${missingSeg}`);

  const failures = [];
  // Expected minimums (TASKS-A): every sample yields at least this much.
  if (decisions.length < 1) failures.push(`≥1 decision (got ${decisions.length})`);
  if (actions.length < 2) failures.push(`≥2 actions (got ${actions.length})`);
  if (questions.length < 1) failures.push(`≥1 open question (got ${questions.length})`);
  if (atRisk.length < 1) failures.push(`≥1 atRisk (got ${atRisk.length})`);
  if (sample.id === "standup") {
    const hasPriya = actions.some((a) => a.owner === "Priya");
    if (!hasPriya) failures.push(`an action with owner "Priya"`);
  }

  if (failures.length) {
    allPass = false;
    for (const f of failures) console.error(`  FAIL: expected ${f}`);
  } else {
    console.log("  PASS");
  }
}

console.log(
  allPass
    ? `\nAll samples met the expected minimums. ✓`
    : `\nSome expectations failed. ✗ (exit 1)`,
);
process.exit(allPass ? 0 : 1);

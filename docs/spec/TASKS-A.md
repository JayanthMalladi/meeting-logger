# Track A: server, AI and quality (Claude; DeepSeek picks up leftovers)

Branch: `track-a` from `spec`. Read `docs/spec/SPEC.md` first. Own only the files listed in SPEC section 5.
Real-provider tests need `GROQ_API_KEY` in `.env.local` and `MOCK_AI=0`.
Tick each box in the same commit as the code. Commit message prefix `A<n>:`.

Already done on `spec` (the contract commit): types, audio/segments/share/markdown/samples/mock libs, `/api/health`, mock mode in transcribe and extract, correct audio filename, seg→ts mapping in extract, `.env.local.example`.

## Tasks

- [ ] **A1. Provider hardening (`src/lib/groq.ts`).** 45 s timeout via `AbortController` on both calls; retry once after 1.5 s on 429 or 5xx; `temperature: 0`; surface Groq's error message cleanly (parse `{error:{message}}`). Keep the OpenAI fallback.

- [ ] **A2. Extraction prompt v2 (`src/lib/extractPrompt.ts`, bump `promptVersion` to "v2").**
  - Items reference `seg` (integer index) from the `[i] text` list. Never invent indexes.
  - Input may be a live transcript or a first-person dictated recap. In a recap "I'll do X" → owner "Me" unless a name for the speaker is given.
  - Owners: only people named as doing the work. Normalise to names in `meta.attendees` when they match.
  - `due`: keep the phrase as said ("Wednesday", "by next Tuesday"); if `meta.date` is given, append the resolved date in brackets, e.g. "Wednesday (2026-11-04)".
  - Decision = agreed and closed. Action = someone will do something. Question = unresolved. Don't duplicate one statement across categories.
  - atRisk ≤ 4: unowned actions, things that slipped, blockers, decisions that depend on an open question. Each ≤ 12 words.
  - summary ≤ 3 short sentences.
  - Include one short worked example (input → JSON) in the system prompt.
  Done when: all three `SAMPLE_RECAPS` give sensible boards with a real key.

- [ ] **A3. Extract route hardening (`src/app/api/extract/route.ts`).** Validate request with zod (transcript ≤ 60,000 chars, ≤ 2,000 segments, each segment has numeric `i`). Empty or < 3 words → return an empty board without calling the LLM. Clamp atRisk to 4. Re-index segments defensively (`i` = position).

- [ ] **A4. Transcribe route (`src/app/api/transcribe/route.ts`).** Limit to `MAX_UPLOAD_BYTES` with message "Audio is over 4 MB. Record a shorter recap or compress it."; reject non-audio MIME types except `video/mp4`/`video/webm`; pass `language` through; if Groq returns no segments, build one segment from the whole text.

- [ ] **A5. Slack (`src/app/api/slack/route.ts`).** Only allow `https://hooks.slack.com/`; 10 s timeout; Block Kit: header (title or "Meeting board"), summary section, decisions, actions with owner and due, open questions, at-risk, button "Open board" with share URL, context "Made with NoHands Log".

- [ ] **A6. Eval script (`scripts/eval.mjs`).** `node scripts/eval.mjs http://localhost:3000` posts each sample recap (split like `splitSentences`) to `/api/extract` and prints counts, owners, risks, latency and any item without `seg`. Expected minimums per sample in the file; exit 1 on miss.

- [ ] **A7. README + deploy notes.** Rewrite README: what it is, Wispr Flow usage, run locally (mock and real), env vars, Vercel deploy steps (import repo, set `GROQ_API_KEY`, `STT_MODEL`, `LLM_MODEL`, deploy), known limits (4 MB audio, 8 KB share links).

- [ ] **A8. Integration.** Merge `track-a` into `spec`, then `track-b`; resolve conflicts; run SPEC section 7 in mock mode and with a real key; PR `spec → master`.

## Contract requests
(Track B writes requests here.)

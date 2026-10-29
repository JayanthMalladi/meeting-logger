# 04 — Implementation Roadmap (day-by-day, 28–31 Oct)

> Window reality: submissions close **31 Oct 23:59 IST (~3 days)**. Plan
> targets **Day 3 = 30 Oct** so Day 4 (31 Oct) is pure buffer + submission.
> Every task ends with a verifiable *done* state.

## Day 1 (28 Oct) — Core loop: record → transcript → board
**Goal: the product works end-to-end on localhost with no share link.**

| # | Task | Where | Done when |
|---|---|---|---|
| 1 | Wire `GROQ_API_KEY` into `.env.local`; create `lib/groq.ts` (transcribe + chat wrappers, typed errors) | `src/lib/groq.ts` | `POST /api/transcribe` returns segments for a test mp3 (curl) |
| 2 | Build `Recorder.tsx` (record/stop, timer, blob) + `Uploader.tsx` (drag-drop) | `src/components/` | both produce a playable blob; webm on Chrome, mp4 on Safari |
| 3 | Build `ContextForm.tsx` (title, attendees, kind — all optional, dictatable) | `src/components/` | form submits with or without input |
| 4 | Build `POST /api/transcribe` (multipart → Groq → `Transcript`) | `src/app/api/transcribe/route.ts` | 30s standup → transcript with `mm:ss` segments, < 10s latency |
| 5 | Build `lib/extractPrompt.ts` + `lib/schema.ts` (zod `Extracted`) + `POST /api/extract` | api + lib | returns a valid `Extracted`; empty meeting → all-empty arrays, not an error |
| 6 | Build `Board.tsx` + `TranscriptPanel.tsx` (ts click → scroll+flash) | `src/components/` | each board row highlights its transcript moment |
| 7 | Compose `/` page: state machine `idle → recorded → transcribed → extracted → done` | `src/app/page.tsx` | one-click loop; error states are human, not stack traces |

**Day 1 exit gate:** record a 30s standup on localhost → finished board in
< 30s. (Gate 2 of §9 in `03`.)

## Day 2 (29 Oct) — Openability: share link + Slack + deploy
**Goal: a judge can open a link and post a digest; the app is on a public URL.**

| # | Task | Where | Done when |
|---|---|---|---|
| 8 | `lib/share.ts` (encode/decode + size guards) + `ShareCard.tsx` (Copy / Save) | lib + components | copied link opens the board in incognito |
| 9 | `src/app/m/[slug]/page.tsx` read-only share view | app | `/m/<slug>` renders board + "made with NoHands Log" footer |
| 10 | `POST /api/slack` (blocks payload: header, decisions, actions, open q, at-risk, link) | api | digest lands in a test channel |
| 11 | Optional Supabase: `POST /api/results` + `GET /api/results/[id]`, "Save" persists | api | saved link works without URL-encoding |
| 12 | Polish: empty states, copy, 3s processing spinner, missing-key banner | app | a first-time user gets lost nowhere |
| 13 | Deploy to Vercel (project + env: `GROQ_API_KEY`, model vars, Supabase optional) | Vercel | **public URL** passes gates 1–4 of §9 |

**Day 2 exit gate:** open the Vercel URL fresh, run the full loop, copy the
share link, open it incognito, post to Slack. All on the *deployed* URL.

## Day 3 (30 Oct) — Demo, notes, dictation log
**Goal: submission artifacts complete; day 31 is buffer only.**

| # | Task | Where | Done when |
|---|---|---|---|
| 14 | Polish pass: visual density, mobile width check (judges may open on phones) | app | board is legible at 375px |
| 15 | Record the **≤ 2:00 demo** (script in `05`), trim to ~1:45 target | video file | demo covers before/after/share, under 2:00 |
| 16 | Write submission notes **by dictation** (problem, audience, how Wispr was used) | `dictation-log.md` + notes file | notes exist and were dictated through Flow |
| 17 | Screenshot the **Wispr usage card** (Insights, desktop app) | image | card captured with the final number |
| 18 | Post the final **#NoHandsChallenge** update (dictated) + weekly cadence | social | ≥2 weekly posts exist incl. this one |
| 19 | Final rehearsal: submission form dry-run (link, video, card, notes) | checklist | all four artifacts staged and valid |

## Day 4 (31 Oct) — Buffer + submit
- Fix anything from rehearsal; re-capture the usage card (numbers still
  rising if you dictated this morning).
- **Submit before 11:59 PM IST.** Do not wait for the deadline; submit by 20:00
  IST, leave 4 hours for a broken-link emergency.

## Dependencies & critical path
```
GROQ_API_KEY ──> 1 ──> 4 ──> 5 ──> 6 ──> 7 ──> 8/9 ──> 13 ──> 15 ──> submit
 (get today)
```
Everything else is off the critical path. The only external gate is the
Groq key — **grab it in the first 10 minutes of Day 1**.

## Risks & tripwires (mitigations live in `02` §5)
- **Groq outage at demo time** → results are static once generated; share
  links keep working. Fallback: env-switch to OpenAI Whisper+GPT (no code
  change to the UI).
- **2-week scope creeping in** → any feature not in this doc is *cut*; the
  doc is the contract.
- **Demo > 2:00** → cut beats in this order: Slack (optional one-liner),
  at-risk flags, transcript panel; keep record→board→share.
- **Usage number low** → dictate Day 3–4's notes, posts, and demo narration
  through Flow; keep the desktop app open during demo recording (narrating
  over it).

## Parallel workstreams (human + agent)
| Workstream | Owner | Cadence |
|---|---|---|
| Code (tasks 1–14) | Agent + you, you **dictate** the prompts/decisions | daily |
| Wispr usage | You | every keystroke you'd type goes through Flow instead |
| Social proof (weekly check-ins) | You, dictated | 28th (already mid-window) + 30th |
| Submission artifacts | You + agent drafts | Day 3–4 |

## Definition of "shipped"
The challenge's checklist, not vibes:
1. ✅ Project link (Vercel) opens without login
2. ✅ Demo video ≤ 2:00
3. ✅ Wispr usage card screenshot
4. ✅ Notes: problem / audience / how Wispr was used
5. ✅ #NoHandsChallenge posts (weekly)

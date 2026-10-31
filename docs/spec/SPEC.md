# NoHands Log: build spec (hackathon final)

> Read this whole file before writing code. Then read `AGENTS.md` (Next.js 16 has breaking changes; check `node_modules/next/dist/docs/` before using any Next API you are unsure of).
> Deadline: **31 Oct 2026, 23:59 IST**. Target: code frozen **21:30 IST**, deployed **21:45 IST**, submitted **23:00 IST**.

## 1. Product in one sentence

Speak a meeting recap with **Wispr Flow** (or record / upload audio) and get a finished **decision board**: decisions, actions with owners and due dates, open questions and at-risk flags, every item linked to the sentence or audio moment it came from, shareable with one zero-signup link.

### The demo loop that must never fail
1. Open the site. The **Dictate** tab is focused. Hint: "Hold your Wispr Flow hotkey and speak your recap".
2. Speak about 20 seconds through Wispr Flow. Clean text appears in the box.
3. Press **Build board** (or Ctrl/Cmd+Enter). Board appears in under 5 seconds.
4. Click an action: its source sentence highlights in the transcript panel.
5. Fix an owner inline, then **Copy link**; open it in incognito; the board renders with no login.
6. Audio path: load the sample mp3, Build board, click a timestamp: the audio player jumps there and plays.

## 2. Ground rules for every agent

- Branch from `spec`. Track A works on branch `track-a`, Track B on branch `track-b`. Open a PR into `spec` when done. Do not push to `master`.
- **Stay inside your file ownership (section 5).** Need a change to a file you don't own? Write it under "Contract requests" at the bottom of your task file and work around it.
- **Never change `src/lib/types.ts` signatures.** It is the frozen contract (section 4).
- Develop with `MOCK_AI=1` in `.env.local` (copy `.env.local.example`). Every API route then returns fixture data, so no API key is needed.
- Before every commit: `npx next build` must pass and `npx eslint src` must report 0 errors.
- Tick tasks in your own task file (`docs/spec/TASKS-A.md` or `docs/spec/TASKS-B.md`) as you finish them and commit the tick together with the code.
- Small commits, one task per commit, message `A3: ...` or `B7: ...`.
- No new dependencies unless a task says so. No auth, no database, no analytics.

## 3. Architecture

```
Browser (src/app/page.tsx, client component)
 ├─ Dictate tab ── text ── splitSentences() ──────────────┐
 ├─ Record tab ── Blob ─┐                                 │
 ├─ Upload tab ── File ─┼─ POST /api/transcribe ── Transcript (segments with start/end)
 └─ Sample mp3 ─────────┘                                 │
                                                          ▼
                                   POST /api/extract { transcript, segments, meta }
                                                          │ LLM returns items with seg index
                                                          ▼ server adds ts (audio only)
                                   Board (editable) + TranscriptPanel + AudioPlayer
                                                          │
                           encodeShareUrl() → /m/<slug>  │  POST /api/slack  │  toMarkdown()
```

Providers: Groq `whisper-large-v3-turbo` (speech to text) and `llama-3.3-70b-versatile` (extraction), all inside `src/lib/groq.ts`. OpenAI fallback through env vars only.

## 4. Frozen contract (already committed on `spec`)

| File | What it gives you |
| --- | --- |
| `src/lib/types.ts` | `InputMode`, `Segment {i, text, start?, end?}`, `Transcript`, `Decision/Action/Question {text, seg?, ts?}`, `Extracted`, `MeetingMeta {title, attendees, kind, date, source}`, `KINDS`, and every API request/response type. |
| `src/lib/audio.ts` | `MAX_UPLOAD_BYTES` (4 MB, Vercel body limit is 4.5 MB), `RECORDER_BITS_PER_SECOND` (32 kbps), `audioFilename(mime, originalName)` (correct extension for Whisper), `formatTs(seconds)`. |
| `src/lib/segments.ts` | `splitSentences(text): Segment[]` for dictated text; `indexSegments()`. |
| `src/lib/share.ts` | `async encodeShareUrl(input, origin) → {url, truncated}`, `async decodeShareSlug(slug) → SharePayload`. Compressed (deflate-raw), slug capped at 8,000 chars, v1 links still decode. **Browser only.** |
| `src/lib/markdown.ts` | `toMarkdown(extracted, meta, shareUrl?)` for "Copy as Markdown". |
| `src/lib/samples.ts` | `SAMPLE_RECAPS`: three realistic dictated recaps for sample chips and evals. |
| `src/lib/mock.ts` | `MOCK_AI=1` fixtures used by the API routes. |

### 4.1 Rules both sides rely on
- An item points at its source with `seg` = index into the `segments` array that was sent to `/api/extract`. **Never match by timestamp string.**
- `ts` ("mm:ss") is present only when the segment has `start` (audio). Dictated items have `seg` but no `ts`.
- `seg` may be missing (LLM unsure). UI must render the item without a link.
- `owner` missing means **Unassigned** (show amber). `due` missing means "-".

### 4.2 API (all JSON errors are `{ error: string, upstreamStatus? }`)
| Route | Request | Success | Errors |
| --- | --- | --- | --- |
| `GET /api/health` | - | `HealthResponse {ok, hasKey, provider, mock}` | - |
| `POST /api/transcribe` | multipart: `audio` = File named with `audioFilename(blob.type, file.name)`; optional `language` | `Transcript` | 400 bad/empty/too big, 503 no key, 502 provider |
| `POST /api/extract` | `ExtractRequest {transcript, segments, meta}` | `ExtractResponse {extracted, promptVersion}` | 400 bad input, 422 invalid LLM output after retry, 503 no key, 502 provider |
| `POST /api/slack` | `SlackRequest {webhookUrl, extracted, meta, shareUrl}` | `{ok: true}` | `{ok:false, error}` |

### 4.3 Share links
`/m/<slug>`; slug starting with `z` = v2 compressed. Encode only in the browser. The share page decodes in a `useEffect` (async).

## 5. File ownership

| Track | Owner | Files |
| --- | --- | --- |
| **A: server, AI, quality** | Claude | `src/lib/**`, `src/app/api/**`, `scripts/**`, `README.md`, `.env.local.example`, `next.config.ts`, `docs/spec/TASKS-A.md` |
| **B: UI and UX** | DeepSeek agent | `src/app/page.tsx`, `src/app/m/**`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/**` (create new ones freely), `public/**`, `docs/spec/TASKS-B.md` |

If Track A is not finished when Claude runs out of limit, the DeepSeek agent picks up the remaining `TASKS-A.md` items after finishing Track B. Both task files are self-contained for that reason.

## 6. Design direction (Track B)
- Calm, dense, professional: zinc neutrals, one accent (emerald for decisions, sky for questions, amber for risk / unassigned). Geist font (already loaded). Dark mode via `prefers-color-scheme`.
- Single column, max width 768px, legible at 375px wide.
- Hero: product name "NoHands Log", one-line promise, small "Built for Wispr Flow" note.
- Input card with three tabs: **Dictate** (default) · **Record** · **Upload**. Sample chips under it.
- "Add details (optional)" collapsible: title, attendees, kind, date (default today).
- Primary button "Build board". While working, show step labels with elapsed seconds: "Transcribing… 3s", "Extracting decisions… 2s".
- Results: board on top, transcript panel + audio player below. Share card last.
- Every error is inline, human, with a Retry button. Never `alert()`.

## 7. Acceptance checklist (run on the deployed URL in incognito)
- [ ] Page loads with no console errors; missing key shows a banner on load.
- [ ] Dictate a recap via Wispr Flow → board in under 5 s, items link to sentences.
- [ ] Each sample chip → sensible board (at least 1 decision, 2 actions, 1 question, 1 risk).
- [ ] Chrome recording 30 s → board in under 20 s; timestamps seek the audio.
- [ ] Sample mp3 → board; Upload an m4a → board.
- [ ] Title/attendees typed in details appear on the board and share page.
- [ ] Edit an owner, delete an item → share link and Slack reflect the edit.
- [ ] Share link opens in incognito, under 8,000 chars, shows board and transcript.
- [ ] Copy Markdown pastes a clean board.
- [ ] Slack webhook posts; a non-Slack URL is rejected.
- [ ] 375px wide: nothing overflows. Dark mode readable.
- [ ] `npx next build` passes, `npx eslint src` 0 errors.

## 8. Timeline (IST)
| Time | Track A (Claude) | Track B (DeepSeek) | Jayanth |
| --- | --- | --- | --- |
| 19:10 to 20:40 | A1 to A8 | B1 to B10 | Get Groq key; create Vercel project from repo |
| 20:40 to 21:15 | Finish A, help integrate | B11 to B16 | Test real key locally |
| 21:15 to 21:30 | Merge `track-a`, then `track-b` into `spec`, then `spec` into `master` | | |
| 21:30 to 21:45 | | | Deploy, set `GROQ_API_KEY`, run section 7 |
| 21:45 to 23:00 | | | Demo video (1:45), notes, usage card, post, submit |

**Cut order if late:** B12 Read back → A6 eval → B9 inline editing → A5 Slack Block Kit. Never cut dictate mode, sharing, or deploy.

## 9. Demo script (1:45)
1. 0:00 "Decisions from meetings die in the transcript. NoHands Log turns a spoken recap into a finished decision board."
2. 0:10 Hold the Wispr hotkey, speak a 20 s standup recap. Text appears.
3. 0:35 Build board. Decisions, owners, due dates, an open question, an at-risk flag.
4. 0:50 Click an action: its sentence lights up. Switch to the sample audio, click a timestamp: the audio jumps there.
5. 1:05 Fix an owner, Copy link, open in incognito. "No login."
6. 1:25 Post to Slack (cut first if long).
7. 1:35 "If you can speak it, you can build it. Every prompt that built this was dictated with Wispr Flow."

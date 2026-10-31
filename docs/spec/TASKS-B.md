# Track B: UI and UX (DeepSeek agent)

Branch: `track-b` from `spec`. Read `docs/spec/SPEC.md` first. Own only the files listed in SPEC section 5.
Run locally with `cp .env.local.example .env.local`, set `MOCK_AI=1`, `npm install`, `npm run dev`.
Tick each box in this file in the same commit as the code. Commit message prefix `B<n>:`.

Current state: `src/app/page.tsx` works end to end in mock mode but is a single long component with bugs. Rewrite freely.

## Tasks

- [x] **B1. Page shell and layout.** Rewrite `src/app/page.tsx` into small components. Hero (name, promise, "Built for Wispr Flow" note), input card, details, Build button, results. Follow SPEC section 6.
  Done when: page renders at 375px and 1280px with no overflow, light and dark.

- [x] **B2. Health banner.** On mount `fetch("/api/health")` (type `HealthResponse`). If `!hasKey` show an amber banner "Add GROQ_API_KEY to enable processing" and disable Build. If `mock` show a small grey "Mock mode" badge.
  Done when: banner shows on load without a failed run first.

- [x] **B3. Input tabs.** New `components/InputTabs.tsx` with tabs Dictate (default) · Record · Upload. Keyboard accessible (arrow keys, `role="tablist"`). Switching tabs keeps each tab's content.

- [x] **B4. Dictate input.** New `components/DictateInput.tsx`. Autofocused `<textarea>` (min 6 rows, auto-grow to 16), placeholder "Click here, hold your Wispr Flow hotkey, and speak your recap. Who decided what, who's doing what by when, and what's still open.". Live word count. Ctrl/Cmd+Enter triggers Build. Under it, sample chips from `SAMPLE_RECAPS` (`@/lib/samples`): clicking fills text, title and kind. Require at least 12 words, otherwise inline hint.
  Done when: a chip + Ctrl+Enter produces a board in mock mode.

- [x] **B5. Details form (fixes the dropped-title bug).** Make `ContextForm` fully controlled: `value: MeetingMeta`, `onChange(meta)`. Collapsible "Add details (optional)". Fields: title, attendees, kind (`KINDS`), date (`<input type="date">`, default today `new Date().toISOString().slice(0,10)`). No submit button needed; state lives in page.
  Done when: typed title shows on the board and in the share link.

- [x] **B6. Recorder.** In `components/Recorder.tsx`: pick MIME from `["audio/webm;codecs=opus","audio/webm","audio/mp4","audio/ogg"]`; `new MediaRecorder(stream, { mimeType, audioBitsPerSecond: RECORDER_BITS_PER_SECOND })`; live timer; auto-stop at 15:00; small live level meter (AnalyserNode) optional; permission denied → inline message, never `alert`. Emit `onAudio(blob, mime, "recorded")`.

- [x] **B7. Uploader and sample audio.** Uploader: `accept="audio/*,.m4a,.mp3,.wav,.webm,.ogg"`, reject files over `MAX_UPLOAD_BYTES` with inline message, keep the File (its name matters). SampleButton: **no auto-load on mount**; click loads `/demo-standup.mp3` as a `File` named `demo-standup.mp3` type `audio/mpeg`, source `"sample"`.

- [x] **B8. Processing flow.** One `build()` function in page:
  - Dictated: `segments = splitSentences(text)`; POST `/api/extract` with `{ transcript: text, segments, meta: {...meta, source: "dictated"} }`.
  - Audio: `fd.append("audio", blob, audioFilename(blob.type, (blob as File).name))`; POST `/api/transcribe`; then `/api/extract` with the returned `segments` and `meta.source` = recorded/uploaded/sample.
  - Show step + elapsed seconds; disable inputs while busy; errors inline with Retry; parse `{error}` from non-2xx bodies; handle non-JSON responses (e.g. Vercel 413 HTML) with "Upload too large".
  Done when: dictated, sample mp3 and recording all reach a board in mock mode.

- [x] **B9. Editable board.** `components/Board.tsx` props: `extracted`, `meta`, `segments`, `onSelect(seg)`, `editable`, `onChange(extracted)`. Decisions list, actions table (Task · Owner · Due · source), open questions, at-risk box, counts in headings. Missing owner shows amber "Unassigned". When `editable`: click text/owner/due to edit inline (input, Enter saves, Esc cancels), a delete (x) per item. Each item with `seg` shows a small source chip: `ts` if present, else `¶ n` (seg+1); clicking calls `onSelect(seg)`. Page keeps the edited copy; share, Markdown and Slack use the edited copy.

- [x] **B10. Transcript panel and audio player.** `TranscriptPanel` renders segments with `data-seg={s.i}`, label `formatTs(start)` or `¶ n`. `selectedSeg` prop scrolls to and highlights (1.5 s flash) that segment; clicking a segment also selects it. New `components/AudioPlayer.tsx` (visible native `<audio controls>` from an object URL of the blob, revoke on change). Selecting a seg with `start` sets `audio.currentTime = start` and plays.

- [x] **B11. Share card.** Generate URL with `await encodeShareUrl(...)` in an effect whenever the edited board changes. Buttons: Copy link, Open, Copy as Markdown (`toMarkdown`), Slack webhook (details/summary, POST `/api/slack`, show result). Show "Transcript shortened to fit the link" when `truncated`. Note "Anyone with the link can read this board."

- [x] **B12. Read back.** Button on board: `speechSynthesis` speaks summary, then each action with owner and due. Toggles to Stop. Hidden if not supported.

- [x] **B13. Share page.** `src/app/m/[slug]/page.tsx`: async decode in effect, skeleton while loading, friendly error for bad links, read-only Board (`editable={false}`) and TranscriptPanel (no audio), selecting items highlights transcript, "Make your own board" link to `/`, print-friendly (`@media print` hides buttons).

- [x] **B14. Metadata and polish.** `layout.tsx`: title "NoHands Log: speak a recap, get a decision board", description, `viewport`, theme color. Focus rings, `aria-label` on icon buttons, empty states ("No decisions captured"), button disabled states, favicon OK as is.

- [x] **B15. Reset and re-run.** "New board" button clears everything back to Dictate tab. Changing input after a board exists marks the board stale ("Inputs changed, rebuild?").

- [x] **B16. Final check.** `npx next build` passes, `npx eslint src` 0 errors, run SPEC section 7 items that work in mock mode, open PR `track-b → spec`.

## Contract requests
(Write here if you need a change in a file owned by Track A.)

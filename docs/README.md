# NoHands Log — Meeting-Decision-Logger

> One spoken paragraph per meeting → a finished board of decisions, actions,
> owners, and open questions. Record it, and NoHands Log does the rest.

**Repo:** `JayanthMalladi/meeting-logger` (private)
**Branch:** `docs` (this roadmap) — `master` holds the working app.

## What it is
A web app for the **No Hands: The Wispr Challenge** (Builders track). You
record or upload a meeting in the browser, the pipeline transcribes it
(Groq Whisper) and extracts a structured decision/action board (Groq LLM,
strict JSON schema), and you get a shareable, judge-openable link plus a
Slack digest. The product is voice-first, and the *build itself* is
voice-first — prompts, fixes, docs, and posts are dictated through
**Wispr Flow**.

## Docs in this folder
| File | What it covers |
|---|---|
| [01-ideology.md](./01-ideology.md) | Why voice-first, why "finished beats big", how we build. |
| [02-win-strategy.md](./02-win-strategy.md) | The real scoring model and exactly how we win the Builders prize. |
| [03-technical-spec.md](./03-technical-spec.md) | Architecture, data model, API contract, LLM prompt, security. |
| [04-implementation-roadmap.md](./04-implementation-roadmap.md) | Day-by-day build plan, tasks, acceptance criteria, risks. |
| [05-dictation-and-submission.md](./05-dictation-and-submission.md) | Wispr Flow setup, what to dictate, demo script, submission checklist. |

Read in that order. `03` is the reference for "what needs to be implemented
and how"; `04` is the schedule; `02` is the strategy that shapes all of it.

## One-line build status
Scaffold (Next 16 + Tailwind v4 + TS, App Router, `src/`) is committed to
`master`. The core modules (`lib/types.ts`, recorder UI, transcribe/extract
APIs, results board, share link, Slack post) are the immediate next work.

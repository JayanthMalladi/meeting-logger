# 01 — Ideology: how we think about this

## 1. The theme is the product
The challenge slogan is *"If you can speak it, you can build it."* Most
hackathon entries treat voice as a gimmick bolted onto an existing app.
Ours is inverted: **voice is the only meaningful input**, and everything else
is the tool. If a reviewer can describe our UX in one sentence, that sentence
must contain a voice verb — record, speak, dictate, narrate.

Concrete consequences:
- The meeting is captured **by voice** (browser recording of *you* speaking a
  standup-style recap), or by uploading a voice recording. No forms-only flow.
- Optional text fields (title, attendees) are *optional* — the app works with
  zero typing.
- The output is **read back** where it helps (a spoken summary option keeps
  the loop voice in and voice out).

## 2. "Finished and openable" beats "impressive and scoped"
Judging reality (see `02`): the prize goes to a project a judge can **open a
link to and watch in two minutes**. That means our optimization function is:

```
win = (real pain × finished-ness × 2-min-demo-ability) / (scope risk)
```

So we **cut scope hard**:
- No authentication, no teams, no mobile app, no "AI agent" fluff.
- Share links are **zero-signup** (result travels in the URL) so a judge
  clicks one link and lands on a clean board.
- Slack is a one-line webhook post — not a full app-approval integration.
- The core loop (record → board) must complete in **under 30 seconds** on a
  typical standup-length clip.

What we *keep*: the extraction quality bar (decisions vs actions vs open
questions, with transcript timestamps), and the "who's stuck / who's at
risk" framing — that's the differentiator that makes it more than "AI
meeting notes."

## 3. Real pain, specific user
The user is **the person who runs the recurring meeting** — the standup
facilitator, the 1:1 lead, the project manager who chases "did we decide
that?". Their pain:

1. Decisions die in the transcript. You watched the meeting; you forget the
   decisions.
2. Action items get lost or get owned by nobody.
3. Reconciling "what did we actually agree?" takes another meeting.

Our product removes #1–#3 for the *next* meeting automatically, in the same
30 seconds it takes to speak the recap. That is a pain, a user, and a build
that a judge can feel in two minutes.

## 4. Voice-first also serves the usage prize
There is a **separate leaderboard** — most words dictated during the
challenge, in *any* app. Two levers, deliberately aligned:

- **Build leverage:** every prompt to the coding agent, every code comment we
  hand-write, every doc, every #NoHandsChallenge post is dictated through
  Wispr Flow. A solo voice-first build is naturally word-heavy.
- **Product leverage:** the app's own loop (record, narrate the fix, narrate
  the recap) keeps the mic on during the build-and-demo day, so the product
  also generates dictated words.

We do not chase the usage prize with spam (dictating into a notepad all day)
— that would look bad to the judges who read our notes. We win the usage
leaderboard *organically* by genuinely building a voice tool with our voice.

## 5. Honest documentation of "how Wispr was used"
The submission asks for notes on *how Wispr was used*. We will keep a
`dictation-log.md` in this branch that records, day by day, what went through
Flow (build prompts, fixes, docs, posts, demo). That document is itself
dictated through Flow — and we say so. It turns a checkbox into evidence.

## 6. Build constraints we do not violate
- **No data we don't need.** Audio is processed and (by default) not stored
  long-term; transcripts/results are what we persist. A "do not keep my
  audio" default is a trust feature, not a footnote.
- **One external key, one vendor** for the critical path (Groq: STT + LLM).
  That keeps setup to ~2 minutes and deploy to a handful of env vars.
- **No build-time network dependencies** that would make Vercel deploy
  flaky.

## 7. What we are explicitly NOT doing
- No RAG over a personal corpus.
- No multi-tenant SaaS, no billing, no analytics.
- No on-prem Whisper (revisit only if Groq is unavailable at deploy time).
- No mobile app. The PWA is responsive; that's enough for the judges.

## 8. The two-minute demo thesis
The demo is the highest-leverage artifact. It is not a tour; it is a *before /
after*:
- **Before (15s):** "This is my standup recap, spoken in 40 seconds."
- **After (30s):** Board appears — 4 decisions, 3 owners, 2 open questions,
  "1 at risk" flag.
- **Punchline (15s):** Click a share link in a new tab — a judge needs zero
  context to read it.

Everything else (Slack, timestamps, recap) is one sentence of "and it also…".
The demo doc is in `05`.

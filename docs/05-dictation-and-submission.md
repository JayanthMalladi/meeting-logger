# 05 — Dictation workflow, demo script, and submission checklist

This doc is the human-side plan: how Wispr Flow is used across the build
(which is *required* by the rules and also the usage-prize lever), the
2-minute demo script, and the exact submission checklist.

## 1. Wispr Flow setup (Day 1, ~5 min, once)
1. **Register for the challenge** on the WeMakeDevs/Wispr page. You get a
   free month of **Wispr Flow Pro** + a leaderboard slot.
2. Install / open the **Wispr Flow desktop app** (Mac or Windows). It runs in
   the tray; its **Insights** page is the source of the usage card you submit.
3. Set a **dictation hotkey / floating pill** so you can flip on the mic in
   any text field.
4. (Optional but recommended) configure **per-app writing styles**:
   - *coding-agent / prompts*: terse, imperative.
   - *social / #NoHandsChallenge*: first person, short, human.
   - *docs / notes*: clear, structured.

**Rule of thumb:** if you would type it, you **speak** it instead — in the
agent prompt box, in your editor, in the notes, in the social post. The
keyboard is for shortcuts and small fixes only (that's the rule's own
carve-out).

## 2. What goes through Flow (and why it compounds)
| Artifact | How | Words (est.) |
|---|---|---|
| Build prompts to the coding agent | dictate every request/fix | 200–800 / task |
| Code you hand-write (rare) | dictate into editor; Flow cleans to code | 100–500 / edit |
| This doc set + notes | dictated through Flow, then trimmed | 1k–3k |
| #NoHandsChallenge weekly posts (×2) | dictated, dictated the post itself | 100–200 / post |
| Demo-day narration (recording the demo) | talk through the screen while the desktop app is open | 300–600 |
| Submission "how Wispr was used" notes | dictated | 300–600 |
| **Total, if disciplined** | | **~15k–40k words** |

That comfortably contests the usage leaderboard *without* any spam behavior.
We log what went through Flow in **`dictation-log.md`** (a running list,
itself dictated):

```md
## 28 Oct
- prompts: scaffold, recorder, transcribe route (≈1.2k words)
- posts: weekly check-in #1 (≈150 words)
## 29 Oct
- prompts: share link, slack, deploy (≈1.6k words)
## 30 Oct
- demo narration (≈500 words), notes (≈500 words), post #2 (≈150 words)
```

## 3. The 2-minute demo (record to ~1:45)
Beats + timeboxes. Speak over the screen; keep the mic (Wispr) on so it
counts toward usage too.

- **0:00–0:10 — Frame.** "Meetings produce decisions and actions that die in
  the transcript. NoHands Log turns a spoken standup into a finished board."
- **0:10–0:25 — Before.** "Here's my 40-second standup recap, just spoken."
  (Record it live in the app; ~20s of your voice.)
- **0:25–0:35 — The turn.** Click *Process*. Board appears: 4 decisions, 3
  actions with owners, 2 open questions, **1 at-risk flag**.
- **0:35–1:00 — The detail.** Click an action → transcript scrolls + flashes
  the exact moment it was said. One sentence: "Every row is anchored to the
  audio."
- **1:00–1:20 — Openable.** Copy the share link, open it in a fresh tab.
  "A judge needs zero context to read this."
- **1:20–1:35 — Slack (optional one-liner).** Post the digest. "And it posts
  itself to the team."
- **1:35–1:45 — Closer.** "If you can speak it, you can build it — and this
  was built the same way: by talking."

**Cut order if over 2:00:** Slack → at-risk flag → transcript panel. Keep
record→board→share always.

## 4. Submission checklist (the four artifacts + posts)
Target: **submitted by 20:00 IST on 31 Oct** (buffer to 23:59).

- [ ] **1. Project link** — the Vercel URL; verify it opens on a *cold*
      profile / incognito, no console errors, board renders.
- [ ] **2. Demo video** — ≤ 2:00 (target 1:45), exported, link/file attached.
- [ ] **3. Wispr usage card** — screenshot from the desktop app's **Insights**;
      re-capture the morning of submission (numbers keep climbing).
- [ ] **4. Notes** — problem, audience, **how Wispr was used** (dictated).
- [ ] **5. #NoHandsChallenge posts** — ≥2 weekly updates (mid-window + final),
      usage card posted with them.
- [ ] **6. One track, one solo project** — confirm Builders, solo, no team.

### Notes skeleton (dictate this, ~150 words)
- **Problem:** decisions and action items from meetings die in the
  transcript; reconciling "what did we agree?" costs another meeting.
- **Audience:** anyone who runs recurring meetings — standup facilitators,
  1:1 leads, PMs who chase decisions.
- **What it is:** record/speak a standup → NoHands Log transcribes (Groq
  Whisper) and extracts a decision/action board with owners, due dates, open
  questions, and a risk flag, each anchored to the exact audio moment;
  shareable zero-signup link + Slack digest.
- **How Wispr was used:** the *entire build* — every agent prompt, every
  hand-written fix, the docs, the demo narration, and these notes — was
  dictated through Wispr Flow instead of typed; the product itself is
  voice-first. (Attach the usage card + point to `dictation-log.md`.)

## 5. Fallback: if Groq is unavailable on submit day
No UI change needed:
```env
# .env.local (Vercel)
LLM_PROVIDER=openai
OPENAI_API_KEY=...
STT_MODEL=whisper-1
```
`lib/groq.ts` is the only file with provider knowledge; swap the provider and
the two models. Ship on Groq if it's healthy at Day 2 deploy; the share links
are static so a last-minute outage can't break already-generated digests.

## 6. Final self-audit (run 10 min before submit)
1. Open Vercel URL in incognito — does the board render from a share link
   with **no login**?
2. Is the demo ≤ 2:00? (Re-measure; not "about two minutes".)
3. Does the usage card show a real, non-trivial word count?
4. Do the notes say *how* Wispr was used — concretely, not "we used
   dictation"?
5. Are both #NoHandsChallenge posts live?
6. Submitted **before** the 11:59 IST deadline with margin.

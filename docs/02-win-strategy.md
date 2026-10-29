# 02 — Win Strategy: how the prize is actually scored, and how we win it

## 1. The scoring model (as read from the official page)
**No Hands: The Wispr Challenge** — WeMakeDevs + Wispr Flow, solo, online,
16–31 Oct (India). Three distinct prizes:

| Prize | Criterion | What it actually rewards |
|---|---|---|
| **Builders winner** (₹1,00,000) | "Best project in the Builders track" | A *working software product* that fixes a real problem in the builder's own work, built while dictating prompts into coding tools. |
| **No-Code winner** (₹1,00,000) | "Best project in the No-Code track" | A working tool for one's own job, made with an AI app builder / assistant, no code. |
| **Most Wispr usage** (₹1,00,000) | Rank-1 on the Wispr usage leaderboard | Most *words dictated during the challenge, in any app* (words counted by Wispr's desktop Insights). |
| 10× $100 random | Random from valid submissions | Just submit a valid entry. |

Plus **process requirements** that can disqualify an otherwise great
project:
1. Project link that **judges can open** (our share URL).
2. Demo video **≤ 2 minutes**.
3. **Wispr usage card** (screenshot from desktop app Insights).
4. Brief notes: problem, audience, **how Wispr was used**.
5. Weekly public updates + usage card under **#NoHandsChallenge** ("share
   every week" — there are two check-in points inside 16–31 Oct; we will
   post more).

Scores and comments are **public**, disputes until 5 Nov, winners 6 Nov.

## 2. Inference: how "best project" gets decided
Judges see dozens of entries. Discriminators, in likely order:

1. **Opens and works, with zero friction** (link → working board, no login).
2. **The problem is a real one, stated in one sentence** the judge believes.
3. **Voice is load-bearing** — removing dictation breaks the product.
4. **Finished-ness** — edge states, copy, small details. A 90% polished
   narrow tool beats a 70% ambitious one.
5. **The 2-minute demo** — what they actually remember.
6. **Taste in the notes** — what the builder *dictated*, not typed.

We design every decision against this list.

## 3. Why Meeting-Decision-Logger wins on that list
- **One-sentence problem:** "Meetings produce decisions and action items
  that die in the transcript; NoHands Log turns a spoken standup recap into a
  finished decision board with owners and a risk flag."
- **Voice is load-bearing:** the entire input is speech; the output includes
  read-back options.
- **Universal and judge-relatable:** every judge runs meetings.
- **Zero-friction open:** share links carry the full result; no signup.
- **Differentiator:** *decisions vs actions vs open questions vs "at risk"
  flag with transcript timestamps* — not "AI notes" (crowded category).
- **Small enough to be finished** in the 3-day window.

## 4. Dual-prize play (Builders + usage)
We can legitimately contest **two** of the three prizes:
- Builders winner: by the design above.
- Most Wispr usage: by the build-workflow levers in `05` (dictated prompts,
  dictated fixes, dictated docs, dictated posts, dictated demo-day narration).
  ~80–200 dictated words *per substantive edit*; a focused 3-day build easily
  clears 20–50k words if we keep the mic on for everything that would
  otherwise be typed.

The random $100 draw is free: a valid submission puts us in it.

## 5. Risks to the win, and mitigations
| Risk | Mitigation |
|---|---|
| Judges have seen "AI meeting notes" 50× | Our frame is **decisions & actions** with *owner + risk flag*; demo leads with the board, not the transcript. |
| Recording quality is bad in a loud room | Offer upload; whisper-large-v3-turbo is noise-robust; a "did this sound right?" transcript check step before extraction. |
| Groq rate limit / outage on submit day | Cached results (share link is static after generation); OpenAI Whisper + GPT as a same-day fallback (env-var switch only, no code change). |
| 3-day window is tight | Scope discipline in `01` (no auth, no teams, webhook-only Slack, zero-signup share). |
| Demo video > 2:00 | Scripted in `05`; timebox each beat; cut to 1:45 target with 15s buffer. |
| Usage card shows low words (late start) | Final 48h are prime time: dictate *everything*, including the post itself, and keep the desktop app open during the demo day. |

## 6. The one-sentence strategy
**Ship the narrowest tool that makes the "one spoken paragraph → finished
decision board" loop undeniable, openable by a judge with zero context, and
let the voice-first build process carry us onto the usage leaderboard as a
side effect, not a separate project.**

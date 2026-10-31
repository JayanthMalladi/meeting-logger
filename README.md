# NoHands Log (meeting-logger)

Speak a meeting recap through [Wispr Flow](https://wisprflow.ai) (or record / upload audio) and get a finished **decision board**: decisions, actions with owners and due dates, open questions, and at-risk flags — every item linked to the sentence or audio moment it came from, shareable through one zero-signup link.

## How to use with Wispr Flow

1. Open the site — the **Dictate** tab is focused.
2. Hold your Wispr Flow hotkey and speak your recap. Clean text appears in the box.
3. Optionally add title / attendees / kind / date, then press **Build board** (or Ctrl/Cmd+Enter).
4. The board appears in seconds. Click any item to highlight its source sentence (or seek the audio).
5. Edit owners inline, then **Copy link** — it opens in incognito with no login. Post to Slack from the share card.

The **Record** and **Upload** tabs feed the same pipeline via `/api/transcribe` (speech → segmented transcript).

## Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev   # http://localhost:3000
```

- **Mock mode (no key needed):** set `MOCK_AI=1` in `.env.local`. All routes return fixture data — good for UI work and offline demos.
- **Real providers:** set `GROQ_API_KEY` and `MOCK_AI=0`. Use `STT_MODEL=whisper-large-v3-turbo` for transcription and set `LLM_MODEL` to a model your key can access (e.g. `/3.8-27b` on Groq).

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GROQ_API_KEY` | real mode | – | Groq API key for STT + LLM |
| `MOCK_AI` | no | `0` | `1` → routes return fixtures, no key needed |
| `LLM_PROVIDER` | no | `groq` | `openai` → use the OpenAI fallback |
| `OPENAI_API_KEY` | with `LLM_PROVIDER=openai` | – | OpenAI fallback key |
| `STT_MODEL` | no | `whisper-large-v3-turbo` | Speech-to-text model (Groq) |
| `LLM_MODEL` | no | – | LLM used for extraction; set to a model your key can access (e.g. `/3.8-27b` on Groq) |

## Deploy to Vercel

1. Import this repo into a new Vercel project.
2. Set the project's environment variables: `GROQ_API_KEY`, `STT_MODEL` (`whisper-large-v3-turbo`), `LLM_MODEL` (a model your key can access, e.g. `/3.8-27b` on Groq).
3. Deploy. Open the URL, confirm `/api/health` shows the provider, and run the acceptance checklist in `docs/spec/SPEC.md` §7 in incognito.

## Known limits

- **4 MB audio uploads** — Vercel serverless rejects request bodies over 4.5 MB, so the server caps uploads at 4 MB (`MAX_UPLOAD_BYTES`).
- **Share links ≤ 8,000 chars** — the slug is capped (Vercel URL length limit is ~14 KB); very long transcripts are truncated with a flag.
- **Mock mode returns fixtures** — boards from `MOCK_AI=1` are canned sample data, not real extraction.
- Dictated input has no timestamps: items link to sentences (`seg`), audio input also links to moments (`ts`).

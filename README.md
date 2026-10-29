# Meeting-Decision-Logger (NoHands Log)

One spoken paragraph per meeting → a finished board of decisions, actions, owners, and open questions.

## Environment

Copy `.env.local.example` to `.env.local` and fill in:

```env
GROQ_API_KEY=            # required for transcribe + extract
STT_MODEL=whisper-large-v3-turbo
LLM_MODEL=llama-3.3-70b-versatile
# Optional persistence (share links work without it):
# SUPABASE_URL=
# SUPABASE_SERVICE_KEY=
```

The app renders with a clear banner when `GROQ_API_KEY` is missing — no crash.

## Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Roadmap

The build plan lives on the `docs` branch: `docs/04-implementation-roadmap.md`.
Read `docs/03-technical-spec.md` first for "what to build and how".

## Status

- [x] Scaffold (Next 16 + Tailwind v4 + TS, App Router, `src/`)
- [x] `lib/types.ts`
- [x] `lib/groq.ts`, `lib/extractPrompt.ts`, `lib/schema.ts`, `lib/share.ts`
- [x] API routes: `POST /api/transcribe`, `POST /api/extract`, `POST /api/slack`
- [x] Components: `Recorder`, `Uploader`, `ContextForm`, `Board`, `TranscriptPanel`, `ShareCard`
- [x] `/m/[slug]` read-only share view
- [x] `/` page composed with the `idle → recorded → transcribed → extracted → done` state machine
- [ ] Day 1 exit gate: record a 30s standup on localhost → finished board in < 30s
- [ ] Optional Supabase persistence (`POST /api/results`, `GET /api/results/[id]`)
- [ ] Deploy to Vercel

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Deploy on Vercel](https://vercel.com/docs)

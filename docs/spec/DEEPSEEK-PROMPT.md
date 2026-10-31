# Prompt to paste into the DeepSeek harness

You are working in the repo `JayanthMalladi/meeting-logger` (Next.js 16, React 19, Tailwind v4, TypeScript).

1. `git fetch origin && git checkout spec && git checkout -b track-b`
2. Read `docs/spec/SPEC.md`, then `docs/spec/TASKS-B.md`, then `AGENTS.md`. Next.js 16 differs from what you know; check `node_modules/next/dist/docs/` before using an unfamiliar Next API.
3. `npm install`, `cp .env.local.example .env.local`, set `MOCK_AI=1`, `npm run dev`.
4. Do the tasks in `TASKS-B.md` in order. After each task: `npx next build` and `npx eslint src` must pass, tick the box in `TASKS-B.md`, commit with message `B<n>: <what>`, push `track-b`.
5. Only edit files Track B owns (SPEC section 5). Never change `src/lib/types.ts`. If you need a lib change, write it under "Contract requests" in `TASKS-B.md`.
6. When B16 is done, open a PR `track-b → spec`. If `TASKS-A.md` still has unticked items and you're told to, continue with them on `track-a`.

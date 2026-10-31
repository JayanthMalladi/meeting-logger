import { NextResponse, connection } from "next/server";
import { hasProviderKey } from "@/lib/groq";
import { isMock } from "@/lib/mock";
import type { HealthResponse } from "@/lib/types";

/** GET /api/health — lets the UI show the missing-key banner on load (SPEC §4.2). */
export async function GET() {
  await connection(); // read env at request time, never prerender
  const mock = isMock();
  const body: HealthResponse = {
    ok: true,
    mock,
    hasKey: mock || hasProviderKey(),
    provider: mock ? "mock" : process.env.LLM_PROVIDER === "openai" ? "openai" : "groq",
  };
  return NextResponse.json(body);
}

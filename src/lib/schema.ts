import { z } from "zod";

/** What the LLM must return. Items point at segments by index (`seg`); `ts` is added server-side. */
const item = { text: z.string().min(1), seg: z.number().int().nonnegative().optional() };

export const ExtractedSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.object(item)),
  actions: z.array(
    z.object({
      ...item,
      owner: z.string().optional().nullable().transform((v) => v || undefined),
      due: z.string().optional().nullable().transform((v) => v || undefined),
    }),
  ),
  openQuestions: z.array(z.object(item)),
  atRisk: z.array(z.string()).max(6),
});

export type ParsedExtracted = z.infer<typeof ExtractedSchema>;

export function validateExtracted(raw: unknown): ParsedExtracted {
  return ExtractedSchema.parse(raw);
}

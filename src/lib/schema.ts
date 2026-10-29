import { z } from "zod";

export const ExtractedSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.object({ text: z.string(), ts: z.string().optional() })),
  actions: z.array(
    z.object({
      text: z.string(),
      owner: z.string().optional(),
      due: z.string().optional(),
      ts: z.string().optional(),
    }),
  ),
  openQuestions: z.array(
    z.object({ text: z.string(), ts: z.string().optional() }),
  ),
  atRisk: z.array(z.string()),
});

export type ParsedExtracted = z.infer<typeof ExtractedSchema>;

export function validateExtracted(raw: unknown): ParsedExtracted {
  return ExtractedSchema.parse(raw);
}

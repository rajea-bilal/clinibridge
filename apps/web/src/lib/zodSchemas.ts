import { z } from "zod";

/** Schema for the searchTrials tool invoked by the AI model */
export const searchTrialsToolSchema = z.object({
  condition: z
    .string()
    .describe("Primary medical condition or disease to search for"),
  age: z.number().describe("Patient age in years"),
  location: z
    .string()
    .describe("City, state, or country to filter trials by location"),
  synonyms: z
    .array(z.string())
    .optional()
    .describe(
      "Medical synonyms for the condition (e.g. NSCLC for lung cancer)"
    ),
  medications: z
    .array(z.string())
    .optional()
    .describe("Current medications the patient is taking"),
  additionalInfo: z
    .string()
    .optional()
    .describe("Any additional patient details relevant to trial matching"),
});

export type SearchTrialsToolInput = z.infer<typeof searchTrialsToolSchema>;

/** Schema for the AI scoring response — one entry per trial */
export const trialScoreSchema = z
  .object({
    nctId: z.string(),
    matchLabel: z.enum([
      "Strong Match",
      "Possible Match",
      "Worth Exploring",
      "Unlikely",
    ]),
    matchScore: z.number().min(0).max(100).describe("0-100 confidence score"),
    matchReason: z
      .string()
      .describe(
        "One plain-English sentence explaining why the patient does or does not match"
      ),
  })
  .superRefine((value, ctx) => {
    const score = value.matchScore;
    const label = value.matchLabel;

    if (score >= 80 && label !== "Strong Match") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "matchLabel must be Strong Match for scores >= 80.",
        path: ["matchLabel"],
      });
    } else if (score >= 50 && score <= 79 && label !== "Possible Match") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "matchLabel must be Possible Match for scores 50-79.",
        path: ["matchLabel"],
      });
    } else if (score >= 30 && score <= 49 && label !== "Worth Exploring") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "matchLabel must be Worth Exploring for scores 30-49.",
        path: ["matchLabel"],
      });
    } else if (score <= 29 && label !== "Unlikely") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "matchLabel must be Unlikely for scores 0-29.",
        path: ["matchLabel"],
      });
    }
  });

export const scoringResponseSchema = z.object({
  scores: z.array(trialScoreSchema),
});

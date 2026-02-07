import { z } from "zod";

/** Schema for the searchTrials tool invoked by the AI model */
export const searchTrialsToolSchema = z.object({
  condition: z.string().describe("Primary medical condition or disease to search for"),
  age: z.number().describe("Patient age in years"),
  location: z.string().describe("City, state, or country to filter trials by location"),
  synonyms: z
    .array(z.string())
    .optional()
    .describe("Medical synonyms for the condition (e.g. NSCLC for lung cancer)"),
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

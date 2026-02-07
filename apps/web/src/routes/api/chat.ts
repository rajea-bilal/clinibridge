import { createFileRoute } from "@tanstack/react-router";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  generateObject,
  tool,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import {
  searchTrialsToolSchema,
  scoringResponseSchema,
} from "@/lib/zodSchemas";
import {
  SYSTEM_PROMPT,
  TOOL_DESCRIPTION,
  SCORING_PROMPT,
} from "@/lib/aiPrompts";
import { fetchTrials } from "@/lib/clinicalTrials";
import type { TrialSummary } from "@/lib/types";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages: UIMessage[] };
        const { messages } = body;

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          tools: {
            searchTrials: tool({
              description: TOOL_DESCRIPTION,
              inputSchema: searchTrialsToolSchema,
              execute: async (args) => {
                const {
                  condition,
                  synonyms,
                  location,
                  age,
                  medications,
                  additionalInfo,
                } = args;
                const result = await fetchTrials({
                  condition,
                  synonyms,
                  location,
                });

                if (result.error) {
                  return { error: result.error, trials: [] };
                }

                const rawTrials = result.trials;

                // --- SCORING STEP: second AI call to score each trial ---
                const patientProfile = {
                  condition,
                  age,
                  location,
                  medications: medications ?? [],
                  additionalInfo: additionalInfo ?? "",
                };

                let scoredTrials: TrialSummary[] = rawTrials;

                try {
                  const scoringInput = rawTrials.map((t) => ({
                    nctId: t.nctId,
                    title: t.title,
                    ageRange: t.ageRange,
                    conditions: t.conditions,
                    eligibilityFull: t.eligibilityFull ?? t.eligibility,
                    interventions: t.interventions,
                    phase: t.phase,
                  }));

                  const { object: scoringResult } = await generateObject({
                    model: openai("gpt-4o-mini"),
                    schema: scoringResponseSchema,
                    prompt: `Patient profile:\n${JSON.stringify(patientProfile, null, 2)}\n\nTrials to score:\n${JSON.stringify(scoringInput, null, 2)}`,
                    system: SCORING_PROMPT,
                  });

                  // Merge scores into trial objects
                  const scoreMap = new Map(
                    scoringResult.scores.map((s) => [s.nctId, s])
                  );

                  scoredTrials = rawTrials.map((trial) => {
                    const score = scoreMap.get(trial.nctId);
                    if (score) {
                      return {
                        ...trial,
                        matchScore: score.matchScore,
                        matchLabel: score.matchLabel,
                        matchReason: score.matchReason,
                      };
                    }
                    return trial;
                  });
                } catch (scoringError) {
                  // If scoring fails, return unscored trials rather than failing entirely
                  console.error("Trial scoring failed:", scoringError);
                }

                return {
                  trials: scoredTrials,
                  count: rawTrials.length,
                  patientProfile,
                };
              },
            }),
          },
          stopWhen: stepCountIs(3),
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});

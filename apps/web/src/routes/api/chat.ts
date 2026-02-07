import { createFileRoute } from "@tanstack/react-router";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  tool,
  stepCountIs,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { searchTrialsToolSchema } from "@/lib/zodSchemas";
import { SYSTEM_PROMPT, TOOL_DESCRIPTION } from "@/lib/aiPrompts";
import { fetchTrials } from "@/lib/clinicalTrials";
import { scoreTrials } from "@/lib/scoreTrials";

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

                const patientProfile = {
                  condition,
                  age,
                  location,
                  medications: medications ?? [],
                  additionalInfo: additionalInfo ?? "",
                };

                const scoredTrials = await scoreTrials(
                  result.trials,
                  patientProfile
                );

                return {
                  trials: scoredTrials,
                  count: result.trials.length,
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

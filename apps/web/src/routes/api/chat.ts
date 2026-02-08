import { openai } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT, TOOL_DESCRIPTION } from "@/lib/aiPrompts";
import { fetchTrials } from "@/lib/clinicalTrials";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { scoreTrials } from "@/lib/scoreTrials";
import { searchTrialsToolSchema } from "@/lib/zodSchemas";

const BROAD_CONDITIONS = new Set([
  "cancer",
  "diabetes",
  "heart disease",
  "heart problems",
  "breathing problems",
  "lung disease",
  "rare disease",
  "pain",
  "infection",
]);

const SHORT_ALLOWED = new Set(["als", "cf", "copd", "ms", "hiv", "scd"]);

function isVagueCondition(condition: string): boolean {
  const trimmed = condition.trim();
  if (!trimmed) return true;
  const lower = trimmed.toLowerCase();

  if (BROAD_CONDITIONS.has(lower)) return true;

  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length < 2 && !SHORT_ALLOWED.has(lower)) return true;

  return false;
}

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const rate = checkRateLimit(`chat:${ip}`, 30, 60 * 60 * 1000);
        if (!rate.ok) {
          return new Response(
            JSON.stringify({
              error: "Rate limit reached. Please try again shortly.",
            }),
            {
              status: 429,
              headers: {
                "Content-Type": "application/json",
                "Retry-After": String(rate.retryAfterSeconds),
                "X-RateLimit-Limit": String(rate.limit),
                "X-RateLimit-Remaining": String(rate.remaining),
                "X-RateLimit-Reset": String(rate.resetMs),
              },
            }
          );
        }

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
                const safeSynonyms = (synonyms ?? [])
                  .map((term) => term.trim())
                  .filter(Boolean)
                  .filter(
                    (term) =>
                      term.toLowerCase() !== condition.trim().toLowerCase()
                  )
                  .slice(0, 8);

                if (isVagueCondition(condition)) {
                  return {
                    error:
                      "Please provide a more specific diagnosis (for example, the exact condition or cancer type) before I can search.",
                    trials: [],
                  };
                }

                const result = await fetchTrials({
                  condition,
                  synonyms: safeSynonyms,
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

import { createFileRoute } from "@tanstack/react-router";
import { fetchTrials } from "@/lib/clinicalTrials";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { scoreTrials } from "@/lib/scoreTrials";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        console.log("[/api/search] ===== REQUEST START =====");

        const ip = getClientIp(request);
        const rate = checkRateLimit(`search:${ip}`, 30, 60 * 60 * 1000);
        if (!rate.ok) {
          console.log("[/api/search] Rate limited, returning 429");
          return new Response(
            JSON.stringify({
              trials: [],
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

        const body = (await request.json()) as {
          condition: string;
          age: number;
          location?: string;
          medications?: string;
          additionalInfo?: string;
        };

        const { condition, age, location, medications, additionalInfo } = body;
        console.log("[/api/search] Request body:", JSON.stringify({ condition, age, location, medications, additionalInfo }));

        const result = await fetchTrials({
          condition,
          location,
        });

        console.log(
          "[/api/search] fetchTrials returned:",
          JSON.stringify({
            trialCount: result.trials.length,
            error: result.error ?? null,
            trialIds: result.trials.map((t) => t.nctId),
          })
        );

        if (result.error) {
          console.log("[/api/search] Returning error response:", result.error);
          return new Response(
            JSON.stringify({ trials: [], error: result.error }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const patientProfile = {
          condition,
          age,
          location: location ?? "",
          medications: medications
            ? medications
                .split(",")
                .map((m) => m.trim())
                .filter(Boolean)
            : [],
          additionalInfo: additionalInfo ?? "",
        };

        console.log("[/api/search] Scoring with patient profile:", JSON.stringify(patientProfile));
        const scoredTrials = await scoreTrials(result.trials, patientProfile);
        console.log(
          "[/api/search] After scoring:",
          scoredTrials.length,
          "trials |",
          "scores:",
          scoredTrials.map((t) => ({ id: t.nctId, score: t.matchScore, label: t.matchLabel }))
        );

        console.log("[/api/search] ===== RETURNING", scoredTrials.length, "trials =====");
        return new Response(
          JSON.stringify({
            trials: scoredTrials,
            count: result.trials.length,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      },
    },
  },
});

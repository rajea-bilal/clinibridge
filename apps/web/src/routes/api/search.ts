import { createFileRoute } from "@tanstack/react-router";
import { fetchTrials } from "@/lib/clinicalTrials";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { scoreTrials } from "@/lib/scoreTrials";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/api/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const rate = checkRateLimit(`search:${ip}`, 30, 60 * 60 * 1000);
        if (!rate.ok) {
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

        const result = await fetchTrials({
          condition,
          location,
        });

        if (result.error) {
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

        const scoredTrials = await scoreTrials(result.trials, patientProfile);

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

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { scoringResponseSchema } from "./zodSchemas";
import { SCORING_PROMPT } from "./aiPrompts";
import type { TrialSummary } from "./types";

export interface PatientProfile {
  condition: string;
  age: number;
  location: string;
  medications: string[];
  additionalInfo: string;
}

/**
 * Score an array of trials against a patient profile using a structured AI call.
 * Returns the same trials with matchScore, matchLabel, and matchReason populated.
 * Falls back to unscored trials if the AI call fails.
 */
export async function scoreTrials(
  trials: TrialSummary[],
  patientProfile: PatientProfile
): Promise<TrialSummary[]> {
  if (trials.length === 0) return trials;

  try {
    const scoringInput = trials.map((t) => ({
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

    const scoreMap = new Map(
      scoringResult.scores.map((s) => [s.nctId, s])
    );

    return trials.map((trial) => {
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
  } catch (err) {
    console.error("Trial scoring failed:", err);
    return trials;
  }
}

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { SCORING_PROMPT } from "./aiPrompts";
import type { TrialSummary } from "./types";
import { scoringResponseSchema } from "./zodSchemas";

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
      ageMinYears: t.ageMinYears,
      ageMaxYears: t.ageMaxYears,
      conditions: t.conditions,
      eligibilityFull: t.eligibilityFull ?? t.eligibility,
      interventions: t.interventions,
      phase: t.phase,
    }));

    const scoringResult =
      (await scoreWithModel(scoringInput, patientProfile, 0)) ??
      (await scoreWithModel(scoringInput, patientProfile, 0.3));

    if (!scoringResult) {
      return applyFallbackScores(trials, patientProfile);
    }

    const scoreMap = new Map(scoringResult.scores.map((s) => [s.nctId, s]));

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
    return applyFallbackScores(trials, patientProfile);
  }
}

async function scoreWithModel(
  scoringInput: Array<{
    nctId: string;
    title: string;
    ageRange: string;
    ageMinYears?: number;
    ageMaxYears?: number;
    conditions: string[];
    eligibilityFull: string;
    interventions: string[];
    phase: string;
  }>,
  patientProfile: PatientProfile,
  temperature: number
) {
  try {
    const { object: scoringResult } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: scoringResponseSchema,
      temperature,
      prompt: `Patient profile:\n${JSON.stringify(patientProfile, null, 2)}\n\nTrials to score:\n${JSON.stringify(scoringInput, null, 2)}`,
      system: SCORING_PROMPT,
    });
    return scoringResult;
  } catch (err) {
    console.warn("Structured scoring failed, retrying...", err);
    return null;
  }
}

function applyFallbackScores(
  trials: TrialSummary[],
  patientProfile: PatientProfile
): TrialSummary[] {
  return trials.map((trial) => {
    const age = patientProfile.age;
    const min = trial.ageMinYears;
    const max = trial.ageMaxYears;

    if (min !== undefined && age < min) {
      return {
        ...trial,
        matchScore: 10,
        matchLabel: "Unlikely",
        matchReason: `Age ${age} is below the minimum of ${min}.`,
      };
    }

    if (max !== undefined && age > max) {
      return {
        ...trial,
        matchScore: 10,
        matchLabel: "Unlikely",
        matchReason: `Age ${age} is above the maximum of ${max}.`,
      };
    }

    return {
      ...trial,
      matchScore: 55,
      matchLabel: "Possible Match",
      matchReason: "Age appears to fit; eligibility needs confirmation.",
    };
  });
}

"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const FETCH_TIMEOUT_MS = 15_000;
const STUDY_API_BASE = "https://clinicaltrials.gov/api/v2/studies";

// ---------------------------------------------------------------------------
// Raw eligibility data shape (from cache or API)
// ---------------------------------------------------------------------------
export interface RawEligibility {
  nctId: string;
  eligibilityCriteria: string | null;
  minimumAge: string | null;
  maximumAge: string | null;
  sex: string | null;
  healthyVolunteers: string | null;
}

// ---------------------------------------------------------------------------
// Helper: fetch raw eligibility from ClinicalTrials.gov
// ---------------------------------------------------------------------------
async function fetchEligibilityFromApi(nctId: string): Promise<RawEligibility> {
  const url = `${STUDY_API_BASE}/${nctId}?format=json`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(
        `ClinicalTrials.gov returned status ${response.status} for ${nctId}`
      );
    }

    const data = await response.json();
    const eligModule = data?.protocolSection?.eligibilityModule as
      | Record<string, unknown>
      | undefined;

    console.log("[eligibility] API response for", nctId, "— eligModule keys:", eligModule ? Object.keys(eligModule) : "MISSING");
    console.log("[eligibility] healthyVolunteers raw value:", eligModule?.healthyVolunteers, "type:", typeof eligModule?.healthyVolunteers);
    console.log("[eligibility] eligibilityCriteria length:", typeof eligModule?.eligibilityCriteria === "string" ? eligModule.eligibilityCriteria.length : "N/A");

    return {
      nctId,
      eligibilityCriteria:
        (eligModule?.eligibilityCriteria as string) ?? null,
      minimumAge: eligModule?.minimumAge != null ? String(eligModule.minimumAge) : null,
      maximumAge: eligModule?.maximumAge != null ? String(eligModule.maximumAge) : null,
      sex: eligModule?.sex != null ? String(eligModule.sex) : null,
      healthyVolunteers:
        eligModule?.healthyVolunteers != null ? String(eligModule.healthyVolunteers) : null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Helper: parse eligibility criteria into inclusion/exclusion sections
// ---------------------------------------------------------------------------
function parseEligibilityText(raw: string): {
  inclusionText: string;
  exclusionText: string;
  unclassifiedText: string;
} {
  const text = raw
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const inclusionRe = /^inclusion\s*criteria:?\s*$/im;
  const exclusionRe = /^exclusion\s*criteria:?\s*$/im;

  const inclusionMatch = inclusionRe.exec(text);
  const exclusionMatch = exclusionRe.exec(text);

  if (inclusionMatch && exclusionMatch) {
    const first =
      inclusionMatch.index < exclusionMatch.index ? "inclusion" : "exclusion";

    if (first === "inclusion") {
      const inclusionText = text
        .slice(inclusionMatch.index + inclusionMatch[0].length, exclusionMatch.index)
        .trim();
      const exclusionText = text
        .slice(exclusionMatch.index + exclusionMatch[0].length)
        .trim();
      return { inclusionText, exclusionText, unclassifiedText: "" };
    }
    const exclusionText = text
      .slice(exclusionMatch.index + exclusionMatch[0].length, inclusionMatch.index)
      .trim();
    const inclusionText = text
      .slice(inclusionMatch.index + inclusionMatch[0].length)
      .trim();
    return { inclusionText, exclusionText, unclassifiedText: "" };
  }

  if (inclusionMatch) {
    return {
      inclusionText: text.slice(inclusionMatch.index + inclusionMatch[0].length).trim(),
      exclusionText: "",
      unclassifiedText: "",
    };
  }

  if (exclusionMatch) {
    return {
      inclusionText: "",
      exclusionText: text.slice(exclusionMatch.index + exclusionMatch[0].length).trim(),
      unclassifiedText: "",
    };
  }

  return { inclusionText: "", exclusionText: "", unclassifiedText: text };
}

// ---------------------------------------------------------------------------
// Helper: get raw eligibility (cache-first)
// ---------------------------------------------------------------------------
async function getEligibilityRaw(
  ctx: { runQuery: Function; runMutation: Function },
  nctId: string
): Promise<RawEligibility> {
  const cached = await ctx.runQuery(
    internal.eligibilityQueries.getCachedEligibility,
    { nctId }
  );

  if (cached) {
    return {
      nctId: cached.nctId,
      eligibilityCriteria: cached.eligibilityCriteria ?? null,
      minimumAge: cached.minimumAge ?? null,
      maximumAge: cached.maximumAge ?? null,
      sex: cached.sex ?? null,
      healthyVolunteers: cached.healthyVolunteers ?? null,
    };
  }

  const raw = await fetchEligibilityFromApi(nctId);

  await ctx.runMutation(
    internal.eligibilityQueries.upsertEligibilityCache,
    {
      nctId: raw.nctId,
      eligibilityCriteria: raw.eligibilityCriteria ?? undefined,
      minimumAge: raw.minimumAge ?? undefined,
      maximumAge: raw.maximumAge ?? undefined,
      sex: raw.sex ?? undefined,
      healthyVolunteers: raw.healthyVolunteers ?? undefined,
      fetchedAt: Date.now(),
    }
  );

  return raw;
}

// ---------------------------------------------------------------------------
// LLM prompts
// ---------------------------------------------------------------------------
const ELIGIBILITY_SYSTEM_PROMPT = `You translate clinical trial eligibility criteria into plain English.
You do NOT determine eligibility. You classify each criterion as:
- "met" only if the patient profile explicitly satisfies it.
- "not_met" only if the patient profile explicitly contradicts it.
- "unknown" for anything else.
Be conservative: when unsure, use "unknown".
Use plain English suitable for a 16-year-old.
If you use medical terms, add a short parenthetical explanation.
Return only valid JSON matching the provided schema. No extra text.
Include the disclaimer exactly as provided.`;

function buildUserPrompt(
  nctId: string,
  profileJson: string,
  eligibilityRaw: string
): string {
  return `Trial ID: ${nctId}

Patient profile:
${profileJson}

Eligibility criteria (raw):
${eligibilityRaw}

Task:
1) Separate inclusion vs exclusion criteria.
2) For each criterion, provide: original, plainEnglish, status ("met" | "not_met" | "unknown"), reason.
3) Generate a "preparationChecklist" derived from all "unknown" items.
4) Use the disclaimer exactly:
"This breakdown helps you understand what the trial requires. Only the trial's research team can confirm eligibility after formal screening."

Return JSON only.`;
}

// ---------------------------------------------------------------------------
// Zod schema for LLM response
// ---------------------------------------------------------------------------
const criterionSchema = z.object({
  original: z.string(),
  plainEnglish: z.string().default(""),
  // Accept any casing / variations and normalise to lowercase
  status: z.string().transform((s) => {
    const lower = s.toLowerCase().replace(/\s+/g, "_");
    if (lower === "met") return "met" as const;
    if (lower === "not_met" || lower === "notmet" || lower === "not met") return "not_met" as const;
    return "unknown" as const;
  }),
  reason: z.string().default(""),
});

const REQUIRED_DISCLAIMER =
  "This breakdown helps you understand what the trial requires. Only the trial's research team can confirm eligibility after formal screening.";

const eligibilityBreakdownSchema = z.object({
  trialId: z.string().optional().default(""),
  disclaimer: z.string().optional().default(REQUIRED_DISCLAIMER),
  inclusionCriteria: z.array(criterionSchema).optional().default([]),
  exclusionCriteria: z.array(criterionSchema).optional().default([]),
  preparationChecklist: z.array(z.string()).optional().default([]),
  meta: z
    .object({
      source: z.string().optional().default("clinicaltrials.gov"),
      criteriaPresent: z.boolean().optional().default(true),
      notes: z.union([z.string(), z.null()]).optional().transform((v) => v ?? ""),
    })
    .optional()
    .default({
      source: "clinicaltrials.gov",
      criteriaPresent: true,
      notes: "",
    }),
}).passthrough();

export type EligibilityBreakdown = z.infer<typeof eligibilityBreakdownSchema>;

// ---------------------------------------------------------------------------
// OpenAI helper (lazy init)
// ---------------------------------------------------------------------------
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Set it in the Convex dashboard."
    );
  }
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// ---------------------------------------------------------------------------
// Helper: call LLM and validate
// ---------------------------------------------------------------------------
async function callLlmForBreakdown(
  nctId: string,
  profileJson: string,
  eligibilityRaw: string
): Promise<EligibilityBreakdown | null> {
  const openai = getOpenAI();
  const userPrompt = buildUserPrompt(nctId, profileJson, eligibilityRaw);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ELIGIBILITY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    console.log("[eligibility] LLM returned no content");
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return eligibilityBreakdownSchema.parse(parsed);
  } catch (err) {
    console.log("[eligibility] LLM response validation failed:", err instanceof Error ? err.message : String(err));
    // Log the raw keys so we can see what the LLM actually returned
    try {
      const raw = JSON.parse(content);
      console.log("[eligibility] LLM response keys:", Object.keys(raw));
      if (raw.meta) console.log("[eligibility] meta keys:", Object.keys(raw.meta));
      if (raw.inclusionCriteria?.[0]) console.log("[eligibility] first inclusionCriteria keys:", Object.keys(raw.inclusionCriteria[0]));
    } catch { /* ignore */ }
    return null;
  }
}

async function callLlmWithRetry(
  nctId: string,
  profileJson: string,
  eligibilityRaw: string
): Promise<EligibilityBreakdown | null> {
  const first = await callLlmForBreakdown(nctId, profileJson, eligibilityRaw);
  if (first) return first;

  console.log("[eligibility] First LLM attempt failed validation, retrying...");
  const openai = getOpenAI();

  const retryResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ELIGIBILITY_SYSTEM_PROMPT },
      {
        role: "user",
        content: buildUserPrompt(nctId, profileJson, eligibilityRaw),
      },
      {
        role: "assistant",
        content: "I'll fix the JSON to match the exact schema required.",
      },
      {
        role: "user",
        content: `Your previous response did not match the required schema. Please return valid JSON with these exact top-level keys: trialId, disclaimer, inclusionCriteria, exclusionCriteria, preparationChecklist, meta. Each criterion must have: original, plainEnglish, status ("met"|"not_met"|"unknown"), reason. Return JSON only.`,
      },
    ],
  });

  const content = retryResponse.choices[0]?.message?.content;
  if (!content) {
    console.log("[eligibility] Retry LLM returned no content");
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return eligibilityBreakdownSchema.parse(parsed);
  } catch (err) {
    console.log("[eligibility] Retry validation failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fallback response when LLM fails
// ---------------------------------------------------------------------------
function buildFallback(
  nctId: string,
  rawCriteria: string | null
): EligibilityBreakdown {
  return {
    trialId: nctId,
    disclaimer:
      "This breakdown helps you understand what the trial requires. Only the trial's research team can confirm eligibility after formal screening.",
    inclusionCriteria: rawCriteria
      ? [
          {
            original: rawCriteria,
            plainEnglish:
              "We couldn't process these criteria automatically — here's the original text from ClinicalTrials.gov.",
            status: "unknown" as const,
            reason: "Automatic processing was unavailable.",
          },
        ]
      : [],
    exclusionCriteria: [],
    preparationChecklist: [
      "Contact the research team directly to discuss eligibility requirements.",
      "Bring a list of your current medications and medical history.",
    ],
    meta: {
      source: "clinicaltrials.gov",
      criteriaPresent: !!rawCriteria,
      notes: "Automated breakdown was unavailable. Raw criteria shown instead.",
    },
  };
}

// ---------------------------------------------------------------------------
// Convex validators for the public action return type
// ---------------------------------------------------------------------------
const criterionValidator = v.object({
  original: v.string(),
  plainEnglish: v.string(),
  status: v.string(),
  reason: v.string(),
});

const breakdownValidator = v.object({
  trialId: v.string(),
  disclaimer: v.string(),
  inclusionCriteria: v.array(criterionValidator),
  exclusionCriteria: v.array(criterionValidator),
  preparationChecklist: v.array(v.string()),
  meta: v.object({
    source: v.string(),
    criteriaPresent: v.boolean(),
    notes: v.string(),
  }),
});

// ---------------------------------------------------------------------------
// Public action: getEligibilityBreakdown
// ---------------------------------------------------------------------------
export const getEligibilityBreakdown = action({
  args: {
    nctId: v.string(),
    patientProfile: v.object({
      age: v.number(),
      sex: v.optional(v.string()),
      location: v.optional(v.string()),
      condition: v.string(),
      medications: v.optional(v.array(v.string())),
      additionalInfo: v.optional(v.string()),
    }),
  },
  returns: breakdownValidator,
  handler: async (ctx, args) => {
    const { nctId, patientProfile } = args;
    console.log("[eligibility] getEligibilityBreakdown called for", nctId);

    try {
      // 1. Get raw eligibility (cache-first)
      const raw = await getEligibilityRaw(ctx, nctId);
      console.log(
        "[eligibility] Raw criteria length:",
        raw.eligibilityCriteria?.length ?? 0
      );

      // 2. If no criteria at all, return fallback
      if (!raw.eligibilityCriteria) {
        console.log("[eligibility] No criteria found, returning fallback");
        return buildFallback(nctId, null);
      }

      // 3. Parse into sections for cleaner LLM input
      const { inclusionText, exclusionText, unclassifiedText } =
        parseEligibilityText(raw.eligibilityCriteria);

      // 4. Build context string for LLM (trim to ~8000 chars)
      let eligibilityContext = "";
      if (inclusionText) eligibilityContext += `Inclusion Criteria:\n${inclusionText}\n\n`;
      if (exclusionText) eligibilityContext += `Exclusion Criteria:\n${exclusionText}\n\n`;
      if (unclassifiedText) eligibilityContext += `Criteria:\n${unclassifiedText}\n\n`;

      if (raw.minimumAge) eligibilityContext += `Minimum Age: ${raw.minimumAge}\n`;
      if (raw.maximumAge) eligibilityContext += `Maximum Age: ${raw.maximumAge}\n`;
      if (raw.sex) eligibilityContext += `Sex: ${raw.sex}\n`;
      if (raw.healthyVolunteers)
        eligibilityContext += `Healthy Volunteers: ${raw.healthyVolunteers}\n`;

      if (eligibilityContext.length > 8000) {
        eligibilityContext =
          eligibilityContext.slice(0, 7500) +
          "\n\n[Criteria text was trimmed for processing. Some criteria may be missing.]";
      }

      // 5. Build profile JSON
      const profileJson = JSON.stringify(
        {
          age: patientProfile.age,
          sex: patientProfile.sex ?? "not specified",
          location: patientProfile.location ?? "not specified",
          condition: patientProfile.condition,
          medications: patientProfile.medications ?? [],
          additionalInfo: patientProfile.additionalInfo ?? "",
        },
        null,
        2
      );

      // 6. Call LLM with retry
      const result = await callLlmWithRetry(nctId, profileJson, eligibilityContext);

      if (!result) {
        console.log("[eligibility] LLM failed after retry, returning fallback");
        return buildFallback(nctId, raw.eligibilityCriteria);
      }

      console.log(
        "[eligibility] Success — inclusion:",
        result.inclusionCriteria.length,
        "exclusion:",
        result.exclusionCriteria.length,
        "checklist:",
        result.preparationChecklist.length
      );

      // Return only the fields the Convex validator expects (strip passthrough extras)
      return {
        trialId: result.trialId || nctId,
        disclaimer: result.disclaimer || REQUIRED_DISCLAIMER,
        inclusionCriteria: result.inclusionCriteria,
        exclusionCriteria: result.exclusionCriteria,
        preparationChecklist: result.preparationChecklist,
        meta: {
          source: result.meta.source || "clinicaltrials.gov",
          criteriaPresent: result.meta.criteriaPresent ?? true,
          notes: result.meta.notes ?? "",
        },
      };
    } catch (err) {
      console.error("[eligibility] Error:", err);
      return buildFallback(nctId, null);
    }
  },
});

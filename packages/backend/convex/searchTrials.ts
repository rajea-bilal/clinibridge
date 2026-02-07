"use node";

import { action } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const TIMEOUT_MS = 15_000;
const PAGE_SIZE = 10;

const trialSummaryValidator = v.object({
  nctId: v.string(),
  title: v.string(),
  summary: v.string(),
  status: v.string(),
  phase: v.string(),
  conditions: v.array(v.string()),
  eligibility: v.string(),
  eligibilityFull: v.optional(v.string()),
  ageRange: v.string(),
  locations: v.array(v.string()),
  interventions: v.array(v.string()),
  sponsor: v.string(),
  matchScore: v.number(),
  matchLabel: v.optional(v.string()),
  matchReason: v.optional(v.string()),
  url: v.string(),
});

/**
 * Public action: search ClinicalTrials.gov, normalize, save, return summaries.
 */
export const searchTrials = action({
  args: {
    condition: v.string(),
    age: v.number(),
    location: v.string(),
    medications: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
    synonyms: v.optional(v.array(v.string())),
  },
  returns: v.object({
    trials: v.array(trialSummaryValidator),
    error: v.optional(v.string()),
    searchId: v.optional(v.id("searches")),
  }),
  handler: async (ctx, args) => {
    const { condition, synonyms = [], location, age, medications, additionalInfo } = args;

    // Build condition query
    const conditionTerms = [condition, ...(synonyms ?? [])].filter(Boolean);
    const conditionQuery = conditionTerms.join(" OR ");

    const params = new URLSearchParams({
      "query.cond": conditionQuery,
      "filter.overallStatus": "RECRUITING",
      pageSize: String(PAGE_SIZE),
      format: "json",
    });

    if (location) {
      params.set("query.locn", location);
    }

    const url = `${BASE_URL}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          trials: [],
          error: `ClinicalTrials.gov returned status ${response.status}`,
        };
      }

      const data = await response.json();
      const studies = data?.studies ?? [];
      const trials = studies
        .map(parseAndNormalize)
        .filter((t: ReturnType<typeof parseAndNormalize>): t is NonNullable<typeof t> => t !== null);

      // Save search
      const searchId: Id<"searches"> = await ctx.runMutation(internal.searchTrialsQueries.saveSearchInternal, {
        createdAt: Date.now(),
        mode: "form" as const,
        condition,
        age,
        location,
        medications,
        additionalInfo,
        results: trials,
      });

      return { trials, searchId };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          trials: [],
          error: "The search timed out. ClinicalTrials.gov may be slow — please try again.",
        };
      }
      return {
        trials: [],
        error: "Unable to reach ClinicalTrials.gov. Please try again later.",
      };
    }
  },
});

// --- Helpers ---

interface TrialSummary {
  nctId: string;
  title: string;
  summary: string;
  status: string;
  phase: string;
  conditions: string[];
  eligibility: string;
  eligibilityFull?: string;
  ageRange: string;
  locations: string[];
  interventions: string[];
  sponsor: string;
  matchScore: number;
  matchLabel?: string;
  matchReason?: string;
  url: string;
}

function parseAndNormalize(study: Record<string, unknown>): TrialSummary | null {
  const proto = study?.protocolSection as Record<string, unknown> | undefined;
  if (!proto) return null;

  const idModule = proto.identificationModule as Record<string, unknown> | undefined;
  const statusModule = proto.statusModule as Record<string, unknown> | undefined;
  const descModule = proto.descriptionModule as Record<string, unknown> | undefined;
  const designModule = proto.designModule as Record<string, unknown> | undefined;
  const eligModule = proto.eligibilityModule as Record<string, unknown> | undefined;
  const contactModule = proto.contactsLocationsModule as Record<string, unknown> | undefined;
  const armsModule = proto.armsInterventionsModule as Record<string, unknown> | undefined;
  const sponsorModule = proto.sponsorCollaboratorsModule as Record<string, unknown> | undefined;
  const condModule = proto.conditionsModule as Record<string, unknown> | undefined;

  const nctId = (idModule?.nctId as string) ?? "";
  const briefTitle = (idModule?.briefTitle as string) ?? "";
  if (!nctId || !briefTitle) return null;

  // Locations
  const rawLocations = (contactModule?.locations ?? []) as Array<Record<string, unknown>>;
  const locations = rawLocations
    .map((loc) => [loc.facility, loc.city, loc.state, loc.country].filter(Boolean).join(", "))
    .filter(Boolean)
    .slice(0, 3);

  // Interventions
  const rawInterventions = (armsModule?.interventions ?? []) as Array<Record<string, unknown>>;
  const interventions = rawInterventions
    .map((i) => {
      const name = i.name as string | undefined;
      const type = i.type as string | undefined;
      return name ? (type ? `${type}: ${name}` : name) : null;
    })
    .filter((i): i is string => i !== null);

  const phases = (designModule?.phases ?? []) as string[];
  const conditions = (condModule?.conditions ?? []) as string[];

  // Age range
  const minAge = (eligModule?.minimumAge as string) ?? "";
  const maxAge = (eligModule?.maximumAge as string) ?? "";
  let ageRange = "Not specified";
  if (minAge && maxAge) ageRange = `${minAge} - ${maxAge}`;
  else if (minAge) ageRange = `${minAge}+`;
  else if (maxAge) ageRange = `Up to ${maxAge}`;

  // Eligibility
  const rawElig = (eligModule?.eligibilityCriteria as string) ?? "";
  const eligibility = rawElig
    ? rawElig.slice(0, 500) + (rawElig.length > 500 ? "..." : "")
    : "See full listing for eligibility details.";
  const eligibilityFull = rawElig
    ? rawElig.slice(0, 1500) + (rawElig.length > 1500 ? "..." : "")
    : undefined;

  return {
    nctId,
    title: briefTitle,
    summary: (descModule?.briefSummary as string) ?? "No summary available.",
    status: (statusModule?.overallStatus as string) ?? "UNKNOWN",
    phase: phases.join(", ") || "Not specified",
    conditions,
    eligibility,
    eligibilityFull,
    ageRange,
    locations,
    interventions,
    sponsor: ((sponsorModule?.leadSponsor as Record<string, unknown>)?.name as string) ?? "Not specified",
    matchScore: 0,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

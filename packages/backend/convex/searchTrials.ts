"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const TIMEOUT_MS = 15_000;
const LOCATION_TIMEOUT_MS = 25_000;
const PAGE_SIZE = 10;
const RETRY_DELAYS_MS = [1000, 2000];
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Phrases that mean "no location filter" — user wants worldwide results. */
const GLOBAL_LOCATION_PATTERNS =
  /^(anywhere|everywhere|worldwide|any\s*(where\s+in\s+the\s+)?world|global(ly)?|no\s*preference|all\s*countries|international(ly)?|any\s*location|any\s*country|doesn'?t?\s*matter|does\s*not\s*matter)$/i;

/** Returns empty string if location is a "worldwide" phrase, otherwise trims it. */
function normalizeLocation(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return GLOBAL_LOCATION_PATTERNS.test(trimmed) ? "" : trimmed;
}

const cache = new Map<string, { expiresAt: number; trials: TrialSummary[] }>();

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
    console.log("[searchTrials Convex] ===== START =====");
    console.log("[searchTrials Convex] Input args:", JSON.stringify(args, null, 2));

    const {
      condition,
      synonyms = [],
      location: rawLocation,
      age,
      medications,
      additionalInfo,
    } = args;

    const location = normalizeLocation(rawLocation);
    console.log("[searchTrials Convex] normalizeLocation:", JSON.stringify({ raw: rawLocation, normalized: location }));

    // Build condition query
    const conditionTerms = [condition, ...(synonyms ?? [])].filter(Boolean);
    const conditionQuery = conditionTerms.join(" OR ");
    console.log("[searchTrials Convex] Condition query:", JSON.stringify({ conditionTerms, conditionQuery }));

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
    console.log("[searchTrials Convex] Full API URL:", url);

    const cacheKey = buildCacheKey(conditionTerms, location);
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log("[searchTrials Convex] CACHE HIT — returning", cached.trials.length, "cached trials");
      return { trials: cached.trials };
    }
    console.log("[searchTrials Convex] Cache miss, querying API...");

    try {
      const response = await requestWithRetry(
        url,
        location ? LOCATION_TIMEOUT_MS : TIMEOUT_MS
      );
      console.log("[searchTrials Convex] HTTP response status:", response.status);

      if (!response.ok) {
        const errMsg =
          response.status === 429
            ? "ClinicalTrials.gov rate limit reached. Please try again later."
            : `ClinicalTrials.gov returned status ${response.status}`;
        console.log("[searchTrials Convex] Non-OK response:", errMsg);
        return { trials: [], error: errMsg };
      }

      const data = await response.json();
      console.log(
        "[searchTrials Convex] Raw JSON keys:", Object.keys(data),
        "| studies array?", Array.isArray(data?.studies),
        "| study count:", data?.studies?.length ?? 0
      );

      const studies = Array.isArray(data?.studies) ? data.studies : null;
      if (!studies) {
        console.log("[searchTrials Convex] No studies array in response!");
        return {
          trials: [],
          error:
            "ClinicalTrials.gov response format changed. Please try again later.",
        };
      }

      let nullCount = 0;
      const trials = studies
        .map((s: Record<string, unknown>, i: number) => {
          const result = parseAndNormalize(s);
          if (!result) {
            nullCount++;
            console.log(
              "[searchTrials Convex] parseAndNormalize null at index", i,
              "| has protocolSection?", !!s?.protocolSection
            );
          }
          return result;
        })
        .filter(
          (
            t: ReturnType<typeof parseAndNormalize>
          ): t is NonNullable<typeof t> => t !== null
        );

      console.log("[searchTrials Convex] After parsing: valid =", trials.length, "| null =", nullCount);
      console.log("[searchTrials Convex] Trial IDs:", trials.map((t: TrialSummary) => t.nctId));
      console.log("[searchTrials Convex] Trial statuses:", trials.map((t: TrialSummary) => t.status));

      cache.set(cacheKey, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        trials,
      });

      // Save search
      const searchId: Id<"searches"> = await ctx.runMutation(
        internal.searchTrialsQueries.saveSearchInternal,
        {
          createdAt: Date.now(),
          mode: "form" as const,
          condition,
          age,
          location,
          medications,
          additionalInfo,
          results: trials,
        }
      );

      console.log("[searchTrials Convex] ===== END — returning", trials.length, "trials, searchId:", searchId, "=====");
      return { trials, searchId };
    } catch (err: unknown) {
      console.error("[searchTrials Convex] EXCEPTION:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        return {
          trials: [],
          error:
            "The search timed out. ClinicalTrials.gov may be slow — please try again.",
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

function parseAndNormalize(
  study: Record<string, unknown>
): TrialSummary | null {
  const proto = study?.protocolSection as Record<string, unknown> | undefined;
  if (!proto) return null;

  const idModule = proto.identificationModule as
    | Record<string, unknown>
    | undefined;
  const statusModule = proto.statusModule as
    | Record<string, unknown>
    | undefined;
  const descModule = proto.descriptionModule as
    | Record<string, unknown>
    | undefined;
  const designModule = proto.designModule as
    | Record<string, unknown>
    | undefined;
  const eligModule = proto.eligibilityModule as
    | Record<string, unknown>
    | undefined;
  const contactModule = proto.contactsLocationsModule as
    | Record<string, unknown>
    | undefined;
  const armsModule = proto.armsInterventionsModule as
    | Record<string, unknown>
    | undefined;
  const sponsorModule = proto.sponsorCollaboratorsModule as
    | Record<string, unknown>
    | undefined;
  const condModule = proto.conditionsModule as
    | Record<string, unknown>
    | undefined;

  const nctId = (idModule?.nctId as string) ?? "";
  const briefTitle = (idModule?.briefTitle as string) ?? "";
  if (!(nctId && briefTitle)) return null;

  // Locations
  const rawLocations = (contactModule?.locations ?? []) as Array<
    Record<string, unknown>
  >;
  const locations = rawLocations
    .map((loc) =>
      [loc.facility, loc.city, loc.state, loc.country]
        .filter(Boolean)
        .join(", ")
    )
    .filter(Boolean)
    .slice(0, 3);

  // Interventions
  const rawInterventions = (armsModule?.interventions ?? []) as Array<
    Record<string, unknown>
  >;
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
  const rawElig = sanitizeEligibility(
    eligModule?.eligibilityCriteria as string | undefined
  );
  const eligibility = rawElig
    ? rawElig.slice(0, 500) + (rawElig.length > 500 ? "..." : "")
    : "Eligibility criteria not available from ClinicalTrials.gov.";
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
    sponsor:
      ((sponsorModule?.leadSponsor as Record<string, unknown>)
        ?.name as string) ?? "Not specified",
    matchScore: 0,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

function buildCacheKey(conditionTerms: string[], location: string): string {
  const normalizedTerms = [...conditionTerms]
    .map((t) => t.trim())
    .filter(Boolean)
    .sort();
  return JSON.stringify({
    conditionTerms: normalizedTerms.map((t) => t.toLowerCase()),
    location: location.trim().toLowerCase(),
  });
}

function sanitizeEligibility(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return cleaned || undefined;
}

async function requestWithRetry(
  url: string,
  timeoutMs: number
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, timeoutMs);
      if (response.ok) return response;

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt === RETRY_DELAYS_MS.length) {
        return response;
      }
    } catch (err: unknown) {
      lastError = err;
      if (
        err instanceof DOMException &&
        err.name === "AbortError" &&
        attempt < RETRY_DELAYS_MS.length
      ) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }

    await sleep(RETRY_DELAYS_MS[attempt]);
  }

  throw lastError ?? new Error("Unknown request error");
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

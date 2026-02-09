import { z } from "zod";
import { normalizeAgeBounds } from "./age";
import type { TrialLocation, TrialRaw, TrialSummary } from "./types";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const TIMEOUT_MS = 15_000;
const LOCATION_TIMEOUT_MS = 25_000;
const PAGE_SIZE = 10;
const RETRY_DELAYS_MS = [1000, 2000];
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Statuses that indicate a trial is actively accepting or about to accept patients */
const ACTIVE_STATUSES = [
  "RECRUITING",
  "NOT_YET_RECRUITING",
  "ENROLLING_BY_INVITATION",
  "ACTIVE_NOT_RECRUITING",
].join(",");

/** Map common abbreviations/short names to the full country name used by ClinicalTrials.gov */
const LOCATION_ALIASES: Record<string, string> = {
  us: "United States",
  usa: "United States",
  uk: "United Kingdom",
  gb: "United Kingdom",
};

const cache = new Map<string, { expiresAt: number; trials: TrialSummary[] }>();

const studiesResponseSchema = z.object({
  studies: z.array(z.record(z.string(), z.unknown())).optional(),
});

/** Phrases that mean "no location filter" — user wants worldwide results. */
const GLOBAL_LOCATION_PATTERNS =
  /^(anywhere|everywhere|worldwide|any\s*(where\s+in\s+the\s+)?world|global(ly)?|no\s*preference|all\s*countries|international(ly)?|any\s*location|any\s*country|doesn'?t?\s*matter|does\s*not\s*matter)$/i;

/** Returns empty string if location is a "worldwide" phrase, otherwise normalizes it. */
function normalizeLocation(raw?: string): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (GLOBAL_LOCATION_PATTERNS.test(trimmed)) return "";
  // Expand well-known abbreviations to the full name ClinicalTrials.gov uses
  const alias = LOCATION_ALIASES[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

interface FetchTrialsOptions {
  condition: string;
  synonyms?: string[];
  location?: string;
}

interface FetchTrialsResult {
  trials: TrialSummary[];
  error?: string;
}

/**
 * Query ClinicalTrials.gov API v2 with condition, optional synonyms, and location.
 * Returns normalized TrialSummary[], gracefully handling errors/timeouts.
 */
export async function fetchTrials(
  options: FetchTrialsOptions
): Promise<FetchTrialsResult> {
  const { condition, synonyms = [], location: rawLocation } = options;

  console.log("[fetchTrials] ===== START =====");
  console.log("[fetchTrials] Input params:", JSON.stringify(options, null, 2));

  const location = normalizeLocation(rawLocation);
  console.log(
    "[fetchTrials] normalizeLocation:",
    JSON.stringify({ raw: rawLocation, normalized: location })
  );

  const cacheKey = buildCacheKey(condition, synonyms, location || undefined);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(
      "[fetchTrials] CACHE HIT — returning",
      cached.trials.length,
      "cached trials"
    );
    return { trials: cached.trials };
  }
  console.log("[fetchTrials] Cache miss, querying API...");

  // Build condition query: OR-joined condition + synonyms
  const conditionTerms = [condition, ...synonyms].filter(Boolean);
  const conditionQuery = conditionTerms.join(" OR ");
  console.log(
    "[fetchTrials] Condition query:",
    JSON.stringify({ conditionTerms, conditionQuery })
  );

  // --- Attempt 1: full query (condition + synonyms + location + active statuses) ---
  const attempt1 = await runSearch({
    conditionQuery,
    location,
    label: "attempt-1 (full)",
  });
  if (attempt1.error) return attempt1;
  if (attempt1.trials.length > 0) {
    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, trials: attempt1.trials });
    console.log("[fetchTrials] ===== END — returning", attempt1.trials.length, "trials (attempt 1) =====");
    return attempt1;
  }

  // --- Attempt 2: drop synonyms, use only the primary condition ---
  if (synonyms.length > 0) {
    console.log("[fetchTrials] Attempt 2: retrying with primary condition only (no synonyms)");
    const attempt2 = await runSearch({
      conditionQuery: condition,
      location,
      label: "attempt-2 (no synonyms)",
    });
    if (attempt2.error) return attempt2;
    if (attempt2.trials.length > 0) {
      cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, trials: attempt2.trials });
      console.log("[fetchTrials] ===== END — returning", attempt2.trials.length, "trials (attempt 2) =====");
      return attempt2;
    }
  }

  // --- Attempt 3: drop location filter entirely ---
  if (location) {
    console.log("[fetchTrials] Attempt 3: retrying without location filter");
    const attempt3 = await runSearch({
      conditionQuery: condition,
      location: "",
      label: "attempt-3 (no location)",
    });
    if (attempt3.error) return attempt3;
    if (attempt3.trials.length > 0) {
      cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, trials: attempt3.trials });
      console.log("[fetchTrials] ===== END — returning", attempt3.trials.length, "trials (attempt 3, worldwide) =====");
      return attempt3;
    }
  }

  // Nothing found at all
  console.log("[fetchTrials] ===== END — 0 trials after all attempts =====");
  return { trials: [] };
}

/** Execute a single search against ClinicalTrials.gov and parse the results. */
async function runSearch(opts: {
  conditionQuery: string;
  location: string;
  label: string;
}): Promise<FetchTrialsResult> {
  const { conditionQuery, location, label } = opts;

  const params = new URLSearchParams({
    "query.cond": conditionQuery,
    "filter.overallStatus": ACTIVE_STATUSES,
    pageSize: String(PAGE_SIZE),
    format: "json",
  });

  if (location) {
    params.set("query.locn", location);
  }

  const url = `${BASE_URL}?${params.toString()}`;
  console.log(`[fetchTrials] [${label}] API URL:`, url);

  try {
    const response = await requestWithRetry(
      url,
      location ? LOCATION_TIMEOUT_MS : TIMEOUT_MS
    );
    console.log(`[fetchTrials] [${label}] HTTP status:`, response.status);

    if (!response.ok) {
      const errMsg =
        response.status === 429
          ? "ClinicalTrials.gov rate limit reached. Please try again later."
          : `ClinicalTrials.gov returned status ${response.status}`;
      console.log(`[fetchTrials] [${label}] Non-OK response:`, errMsg);
      return { trials: [], error: errMsg };
    }

    const json = (await response.json()) as Record<string, unknown>;
    console.log(
      `[fetchTrials] [${label}] Raw JSON keys:`,
      Object.keys(json),
      "| studies array?",
      Array.isArray(json?.studies),
      "| study count:",
      Array.isArray(json?.studies) ? (json.studies as unknown[]).length : 0
    );

    const parsed = studiesResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.log(
        `[fetchTrials] [${label}] Zod parse FAILED:`,
        parsed.error.issues.slice(0, 3)
      );
      return {
        trials: [],
        error:
          "ClinicalTrials.gov response format changed. Please try again later.",
      };
    }

    const studies = parsed.data.studies ?? [];
    console.log(`[fetchTrials] [${label}] Studies after Zod parse:`, studies.length);

    const rawTrials: TrialRaw[] = [];
    let nullCount = 0;
    for (let i = 0; i < studies.length; i++) {
      const trial = parseRawTrial(studies[i]);
      if (trial) {
        rawTrials.push(trial);
      } else {
        nullCount++;
        console.log(
          `[fetchTrials] [${label}] parseRawTrial returned null for study index`,
          i,
          "| has protocolSection?",
          !!studies[i]?.protocolSection,
          "| nctId?",
          (
            (studies[i]?.protocolSection as Record<string, unknown>)
              ?.identificationModule as Record<string, unknown>
          )?.nctId
        );
      }
    }
    console.log(
      `[fetchTrials] [${label}] parseRawTrial results: valid =`,
      rawTrials.length,
      "| null =",
      nullCount
    );

    const summaries = rawTrials.map(normalizeToSummary);
    console.log(`[fetchTrials] [${label}] Final summaries:`, summaries.length);
    console.log(
      `[fetchTrials] [${label}] Trial IDs:`,
      summaries.map((s) => s.nctId)
    );
    console.log(
      `[fetchTrials] [${label}] Trial statuses:`,
      summaries.map((s) => s.status)
    );

    return { trials: summaries };
  } catch (err: unknown) {
    console.error(`[fetchTrials] [${label}] EXCEPTION:`, err);
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
}

function buildCacheKey(
  condition: string,
  synonyms: string[],
  location?: string
): string {
  const normalizedSynonyms = [...synonyms]
    .map((s) => s.trim())
    .filter(Boolean)
    .sort();
  return JSON.stringify({
    condition: condition.trim().toLowerCase(),
    synonyms: normalizedSynonyms.map((s) => s.toLowerCase()),
    location: location?.trim().toLowerCase() ?? "",
  });
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

/** Parse a single study from the API response into TrialRaw. Returns null for invalid records. */
function parseRawTrial(study: Record<string, unknown>): TrialRaw | null {
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

  // Skip records missing critical fields
  if (!(nctId && briefTitle)) return null;

  const locations: TrialLocation[] = [];
  const rawLocations = (contactModule?.locations ?? []) as Array<
    Record<string, unknown>
  >;
  for (const loc of rawLocations) {
    locations.push({
      facility: (loc.facility as string) ?? undefined,
      city: (loc.city as string) ?? undefined,
      state: (loc.state as string) ?? undefined,
      country: (loc.country as string) ?? undefined,
    });
  }

  const interventions: string[] = [];
  const rawInterventions = (armsModule?.interventions ?? []) as Array<
    Record<string, unknown>
  >;
  for (const intervention of rawInterventions) {
    const name = intervention.name as string | undefined;
    const type = intervention.type as string | undefined;
    if (name) interventions.push(type ? `${type}: ${name}` : name);
  }

  const phases = (designModule?.phases ?? []) as string[];
  const conditions = (condModule?.conditions ?? []) as string[];

  const enrollmentInfo = designModule?.enrollmentInfo as
    | Record<string, unknown>
    | undefined;

  const eligibilityCriteria = sanitizeEligibility(
    eligModule?.eligibilityCriteria as string | undefined
  );

  return {
    nctId,
    briefTitle,
    officialTitle: (idModule?.officialTitle as string) ?? undefined,
    briefSummary: (descModule?.briefSummary as string) ?? undefined,
    overallStatus: (statusModule?.overallStatus as string) ?? "UNKNOWN",
    phase: phases.join(", ") || undefined,
    conditions,
    eligibilityCriteria,
    minimumAge: (eligModule?.minimumAge as string) ?? undefined,
    maximumAge: (eligModule?.maximumAge as string) ?? undefined,
    sex: (eligModule?.sex as string) ?? undefined,
    locations,
    startDate: (statusModule?.startDateStruct as Record<string, unknown>)
      ?.date as string | undefined,
    primaryCompletionDate: (
      statusModule?.primaryCompletionDateStruct as Record<string, unknown>
    )?.date as string | undefined,
    studyType: (designModule?.studyType as string) ?? undefined,
    enrollmentCount: (enrollmentInfo?.count as number) ?? undefined,
    interventions,
    sponsor: (sponsorModule?.leadSponsor as Record<string, unknown>)?.name as
      | string
      | undefined,
    url: `https://clinicaltrials.gov/study/${nctId}`,
  };
}

/** Convert TrialRaw into a TrialSummary for rendering */
function normalizeToSummary(raw: TrialRaw): TrialSummary {
  // Build age range string
  let ageRange = "Not specified";
  if (raw.minimumAge && raw.maximumAge) {
    ageRange = `${raw.minimumAge} - ${raw.maximumAge}`;
  } else if (raw.minimumAge) {
    ageRange = `${raw.minimumAge}+`;
  } else if (raw.maximumAge) {
    ageRange = `Up to ${raw.maximumAge}`;
  }

  const ageBounds = normalizeAgeBounds(raw.minimumAge, raw.maximumAge);

  // Build location strings
  const locationStrings = raw.locations
    .map((loc) => {
      const parts = [loc.facility, loc.city, loc.state, loc.country].filter(
        Boolean
      );
      return parts.join(", ");
    })
    .filter(Boolean)
    .slice(0, 3); // Show up to 3 locations

  // Short eligibility for UI card display (500 chars)
  const eligibility = raw.eligibilityCriteria
    ? raw.eligibilityCriteria.slice(0, 500) +
      (raw.eligibilityCriteria.length > 500 ? "..." : "")
    : "Eligibility criteria not available from ClinicalTrials.gov.";

  // Longer eligibility for AI scoring (1500 chars)
  const eligibilityFull = raw.eligibilityCriteria
    ? raw.eligibilityCriteria.slice(0, 1500) +
      (raw.eligibilityCriteria.length > 1500 ? "..." : "")
    : undefined;

  return {
    nctId: raw.nctId,
    title: raw.briefTitle,
    summary: raw.briefSummary ?? "No summary available.",
    status: raw.overallStatus,
    phase: raw.phase ?? "Not specified",
    conditions: raw.conditions,
    eligibility,
    eligibilityFull,
    ageRange,
    ageMinYears: ageBounds.minYears,
    ageMaxYears: ageBounds.maxYears,
    locations: locationStrings,
    interventions: raw.interventions,
    sponsor: raw.sponsor ?? "Not specified",
    matchScore: 0,
    url: raw.url,
  };
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

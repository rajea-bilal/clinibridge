import type { TrialRaw, TrialSummary, TrialLocation } from "./types";

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const TIMEOUT_MS = 15_000;
const PAGE_SIZE = 10;

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
  const { condition, synonyms = [], location } = options;

  // Build condition query: OR-joined condition + synonyms
  const conditionTerms = [condition, ...synonyms].filter(Boolean);
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

    const data = (await response.json()) as { studies?: Record<string, unknown>[] };
    const studies = data?.studies ?? [];
    const rawTrials = studies
      .map(parseRawTrial)
      .filter((t: TrialRaw | null): t is TrialRaw => t !== null);

    const summaries = rawTrials.map(normalizeToSummary);
    return { trials: summaries };
  } catch (err: unknown) {
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

/** Parse a single study from the API response into TrialRaw. Returns null for invalid records. */
function parseRawTrial(study: Record<string, unknown>): TrialRaw | null {
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

  // Skip records missing critical fields
  if (!nctId || !briefTitle) return null;

  const locations: TrialLocation[] = [];
  const rawLocations = (contactModule?.locations ?? []) as Array<Record<string, unknown>>;
  for (const loc of rawLocations) {
    locations.push({
      facility: (loc.facility as string) ?? undefined,
      city: (loc.city as string) ?? undefined,
      state: (loc.state as string) ?? undefined,
      country: (loc.country as string) ?? undefined,
    });
  }

  const interventions: string[] = [];
  const rawInterventions = (armsModule?.interventions ?? []) as Array<Record<string, unknown>>;
  for (const intervention of rawInterventions) {
    const name = intervention.name as string | undefined;
    const type = intervention.type as string | undefined;
    if (name) interventions.push(type ? `${type}: ${name}` : name);
  }

  const phases = (designModule?.phases ?? []) as string[];
  const conditions = (condModule?.conditions ?? []) as string[];

  const enrollmentInfo = designModule?.enrollmentInfo as Record<string, unknown> | undefined;

  return {
    nctId,
    briefTitle,
    officialTitle: (idModule?.officialTitle as string) ?? undefined,
    briefSummary: (descModule?.briefSummary as string) ?? undefined,
    overallStatus: (statusModule?.overallStatus as string) ?? "UNKNOWN",
    phase: phases.join(", ") || undefined,
    conditions,
    eligibilityCriteria: (eligModule?.eligibilityCriteria as string) ?? undefined,
    minimumAge: (eligModule?.minimumAge as string) ?? undefined,
    maximumAge: (eligModule?.maximumAge as string) ?? undefined,
    sex: (eligModule?.sex as string) ?? undefined,
    locations,
    startDate: (statusModule?.startDateStruct as Record<string, unknown>)?.date as string | undefined,
    primaryCompletionDate: (statusModule?.primaryCompletionDateStruct as Record<string, unknown>)?.date as string | undefined,
    studyType: (designModule?.studyType as string) ?? undefined,
    enrollmentCount: (enrollmentInfo?.count as number) ?? undefined,
    interventions,
    sponsor: (sponsorModule?.leadSponsor as Record<string, unknown>)?.name as string | undefined,
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

  // Build location strings
  const locationStrings = raw.locations
    .map((loc) => {
      const parts = [loc.facility, loc.city, loc.state, loc.country].filter(Boolean);
      return parts.join(", ");
    })
    .filter(Boolean)
    .slice(0, 3); // Show up to 3 locations

  // Short eligibility for UI card display (500 chars)
  const eligibility = raw.eligibilityCriteria
    ? raw.eligibilityCriteria.slice(0, 500) + (raw.eligibilityCriteria.length > 500 ? "..." : "")
    : "See full listing for eligibility details.";

  // Longer eligibility for AI scoring (1500 chars)
  const eligibilityFull = raw.eligibilityCriteria
    ? raw.eligibilityCriteria.slice(0, 1500) + (raw.eligibilityCriteria.length > 1500 ? "..." : "")
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
    locations: locationStrings,
    interventions: raw.interventions,
    sponsor: raw.sponsor ?? "Not specified",
    matchScore: 0,
    url: raw.url,
  };
}

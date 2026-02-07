"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ── Types ──────────────────────────────────────────────────────────

export const featuredTrialValidator = v.object({
  nctId: v.string(),
  title: v.string(),
  summary: v.string(),
  phase: v.string(),
  status: v.string(),
  locationCount: v.number(),
  conditions: v.array(v.string()),
});

type FeaturedTrial = {
  nctId: string;
  title: string;
  summary: string;
  phase: string;
  status: string;
  locationCount: number;
  conditions: string[];
};

// ── Constants ──────────────────────────────────────────────────────

const BASE_URL = "https://clinicaltrials.gov/api/v2/studies";
const TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const CATEGORY_QUERIES: Record<string, string> = {
  all: "rare+disease",
  oncology: "rare+cancer",
  neurology: "rare+neurological+disease",
};

const FALLBACK_TRIALS: FeaturedTrial[] = [
  {
    nctId: "NCT06345678",
    title: "Gene Therapy for Spinal Muscular Atrophy in Infants",
    summary:
      "A phase 3, open-label study evaluating a one-time intravenous infusion of gene replacement therapy in patients with spinal muscular atrophy.",
    phase: "Phase 3",
    status: "RECRUITING",
    locationCount: 38,
    conditions: ["Spinal Muscular Atrophy"],
  },
  {
    nctId: "NCT05876543",
    title: "CAR-T Cell Therapy for Relapsed B-Cell Lymphoma",
    summary:
      "Evaluating the safety and efficacy of autologous CAR-T cells in adults with relapsed or refractory B-cell lymphoma.",
    phase: "Phase 2",
    status: "RECRUITING",
    locationCount: 22,
    conditions: ["B-Cell Lymphoma"],
  },
  {
    nctId: "NCT06198765",
    title: "Antisense Oligonucleotide for Huntington Disease",
    summary:
      "A randomized, double-blind study of an intrathecally administered antisense oligonucleotide in early manifest Huntington disease.",
    phase: "Phase 1/Phase 2",
    status: "RECRUITING",
    locationCount: 14,
    conditions: ["Huntington Disease"],
  },
];

// ── Public action ──────────────────────────────────────────────────

export const getFeaturedTrials = action({
  args: {
    category: v.union(
      v.literal("all"),
      v.literal("oncology"),
      v.literal("neurology"),
    ),
  },
  returns: v.array(featuredTrialValidator),
  handler: async (ctx, args): Promise<FeaturedTrial[]> => {
    const { category } = args;

    // 1. Check cache
    try {
      const cached: {
        trials: FeaturedTrial[];
        fetchedAt: number;
      } | null = await ctx.runQuery(
        internal.featuredTrialsCache.getCachedTrials,
        { category },
      );

      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.trials;
      }
    } catch {
      // Cache miss or query error — continue to fetch
    }

    // 2. Fetch from ClinicalTrials.gov
    try {
      const condQuery = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.all;
      const params = new URLSearchParams({
        "query.cond": condQuery,
        "filter.overallStatus": "RECRUITING",
        pageSize: "3",
        sort: "LastUpdatePostDate:desc",
        format: "json",
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${BASE_URL}?${params.toString()}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(
          `ClinicalTrials.gov returned ${response.status} for category "${category}"`,
        );
        return FALLBACK_TRIALS;
      }

      const data = await response.json();
      const studies: Array<Record<string, unknown>> = data?.studies ?? [];

      if (studies.length === 0) {
        return FALLBACK_TRIALS;
      }

      const trials = studies
        .map(parseFeatured)
        .filter((t): t is FeaturedTrial => t !== null)
        .slice(0, 3);

      if (trials.length === 0) {
        return FALLBACK_TRIALS;
      }

      // Pad to 3 if needed
      while (trials.length < 3) {
        trials.push(FALLBACK_TRIALS[trials.length]!);
      }

      // 3. Update cache
      try {
        await ctx.runMutation(
          internal.featuredTrialsCache.upsertCachedTrials,
          {
            category,
            trials,
            fetchedAt: Date.now(),
          },
        );
      } catch {
        // Non-critical — proceed with fresh data
      }

      return trials;
    } catch (err) {
      console.error("Failed to fetch featured trials:", err);
      return FALLBACK_TRIALS;
    }
  },
});

// ── Parser ─────────────────────────────────────────────────────────

function parseFeatured(
  study: Record<string, unknown>,
): FeaturedTrial | null {
  const proto = study?.protocolSection as
    | Record<string, unknown>
    | undefined;
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
  const contactModule = proto.contactsLocationsModule as
    | Record<string, unknown>
    | undefined;
  const condModule = proto.conditionsModule as
    | Record<string, unknown>
    | undefined;

  const nctId = (idModule?.nctId as string) ?? "";
  const briefTitle = (idModule?.briefTitle as string) ?? "";
  if (!nctId || !briefTitle) return null;

  const rawSummary = (descModule?.briefSummary as string) ?? "";
  // Take first sentence, truncate to ~100 chars
  const firstSentence = rawSummary.split(/\.\s/)[0] ?? rawSummary;
  const summary =
    firstSentence.length > 100
      ? firstSentence.slice(0, 97) + "..."
      : firstSentence + (firstSentence.endsWith(".") ? "" : ".");

  const title =
    briefTitle.length > 60 ? briefTitle.slice(0, 57) + "..." : briefTitle;

  const phases = (designModule?.phases ?? []) as string[];
  const conditions = (condModule?.conditions ?? []) as string[];
  const rawLocations = (contactModule?.locations ?? []) as Array<unknown>;

  return {
    nctId,
    title,
    summary,
    phase: phases.join(", ") || "Not specified",
    status: (statusModule?.overallStatus as string) ?? "RECRUITING",
    locationCount: rawLocations.length,
    conditions,
  };
}

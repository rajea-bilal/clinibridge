import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ---------------------------------------------------------------------------
// Internal query: check cache
// ---------------------------------------------------------------------------
export const getCachedEligibility = internalQuery({
  args: { nctId: v.string() },
  returns: v.union(
    v.object({
      nctId: v.string(),
      eligibilityCriteria: v.optional(v.string()),
      minimumAge: v.optional(v.string()),
      maximumAge: v.optional(v.string()),
      sex: v.optional(v.string()),
      healthyVolunteers: v.optional(v.string()),
      fetchedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("eligibilityCache")
      .withIndex("by_nctId", (q) => q.eq("nctId", args.nctId))
      .unique();

    if (!row) return null;

    // Check TTL
    if (Date.now() - row.fetchedAt > CACHE_TTL_MS) return null;

    return {
      nctId: row.nctId,
      eligibilityCriteria: row.eligibilityCriteria,
      minimumAge: row.minimumAge,
      maximumAge: row.maximumAge,
      sex: row.sex,
      healthyVolunteers: row.healthyVolunteers,
      fetchedAt: row.fetchedAt,
    };
  },
});

// ---------------------------------------------------------------------------
// Internal mutation: upsert cache
// ---------------------------------------------------------------------------
export const upsertEligibilityCache = internalMutation({
  args: {
    nctId: v.string(),
    eligibilityCriteria: v.optional(v.string()),
    minimumAge: v.optional(v.string()),
    maximumAge: v.optional(v.string()),
    sex: v.optional(v.string()),
    healthyVolunteers: v.optional(v.string()),
    fetchedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("eligibilityCache")
      .withIndex("by_nctId", (q) => q.eq("nctId", args.nctId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        eligibilityCriteria: args.eligibilityCriteria,
        minimumAge: args.minimumAge,
        maximumAge: args.maximumAge,
        sex: args.sex,
        healthyVolunteers: args.healthyVolunteers,
        fetchedAt: args.fetchedAt,
      });
    } else {
      await ctx.db.insert("eligibilityCache", {
        nctId: args.nctId,
        eligibilityCriteria: args.eligibilityCriteria,
        minimumAge: args.minimumAge,
        maximumAge: args.maximumAge,
        sex: args.sex,
        healthyVolunteers: args.healthyVolunteers,
        fetchedAt: args.fetchedAt,
      });
    }
    return null;
  },
});

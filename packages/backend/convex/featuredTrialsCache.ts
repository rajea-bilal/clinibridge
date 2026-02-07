import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { featuredTrialValidator } from "./featuredTrials";

// ── Internal query: check cache ────────────────────────────────────

export const getCachedTrials = internalQuery({
  args: { category: v.string() },
  returns: v.union(
    v.object({
      trials: v.array(featuredTrialValidator),
      fetchedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("featuredTrialsCache")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .unique();

    if (!row) return null;

    return {
      trials: row.trials,
      fetchedAt: row.fetchedAt,
    };
  },
});

// ── Internal mutation: upsert cache ────────────────────────────────

export const upsertCachedTrials = internalMutation({
  args: {
    category: v.string(),
    trials: v.array(featuredTrialValidator),
    fetchedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("featuredTrialsCache")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        trials: args.trials,
        fetchedAt: args.fetchedAt,
      });
    } else {
      await ctx.db.insert("featuredTrialsCache", {
        category: args.category,
        trials: args.trials,
        fetchedAt: args.fetchedAt,
      });
    }
    return null;
  },
});

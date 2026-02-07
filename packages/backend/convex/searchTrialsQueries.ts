import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

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

/** Internal mutation to save a search */
export const saveSearchInternal = internalMutation({
  args: {
    createdAt: v.number(),
    mode: v.union(v.literal("chat"), v.literal("form")),
    condition: v.string(),
    age: v.number(),
    location: v.string(),
    medications: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
    results: v.array(trialSummaryValidator),
  },
  returns: v.id("searches"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("searches", args);
  },
});

/** Query: fetch a saved search by id */
export const getSearch = query({
  args: { id: v.id("searches") },
  returns: v.union(
    v.object({
      _id: v.id("searches"),
      _creationTime: v.number(),
      createdAt: v.number(),
      mode: v.union(v.literal("chat"), v.literal("form")),
      condition: v.string(),
      age: v.number(),
      location: v.string(),
      medications: v.optional(v.array(v.string())),
      additionalInfo: v.optional(v.string()),
      results: v.array(trialSummaryValidator),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

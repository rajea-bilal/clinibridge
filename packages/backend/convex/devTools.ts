import { v } from "convex/values";
import { components } from "./_generated/api";
import { mutation } from "./_generated/server";

/**
 * Clear all auth sessions from the database.
 * This is useful during development when schema changes cause validation errors.
 *
 * WARNING: This will log out all users!
 */
export const clearAllSessions = mutation({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    let deletedCount = 0;
    let cursor: string | null = null;
    let hasMore = true;

    // Delete sessions in batches using pagination
    while (hasMore) {
      const result = await ctx.runMutation(
        components.betterAuth.adapter.deleteMany,
        {
          input: {
            model: "session",
          },
          paginationOpts: {
            cursor,
            numItems: 100,
          },
        }
      );

      const typedResult = result as {
        count?: number;
        continueCursor?: string;
        isDone?: boolean;
      };

      deletedCount += typedResult.count ?? 0;
      cursor = typedResult.continueCursor ?? null;
      hasMore = !typedResult.isDone && cursor !== null;
    }

    return {
      deletedCount,
    };
  },
});

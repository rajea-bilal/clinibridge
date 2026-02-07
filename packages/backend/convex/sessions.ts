import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const messageValidator = v.object({
  role: v.string(),
  content: v.string(),
  createdAt: v.number(),
});

/** Save a chat session */
export const saveChatSession = mutation({
  args: {
    createdAt: v.number(),
    title: v.optional(v.string()),
    messages: v.array(messageValidator),
  },
  returns: v.id("chatSessions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatSessions", args);
  },
});

/** Get a chat session by id */
export const getChatSession = query({
  args: { id: v.id("chatSessions") },
  returns: v.union(
    v.object({
      _id: v.id("chatSessions"),
      _creationTime: v.number(),
      createdAt: v.number(),
      title: v.optional(v.string()),
      messages: v.array(messageValidator),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

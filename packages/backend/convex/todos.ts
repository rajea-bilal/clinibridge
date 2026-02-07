import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getAll = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) =>
    await ctx.db
      .query("todos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect(),
});

export const create = mutation({
  args: {
    text: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const newTodoId = await ctx.db.insert("todos", {
      text: args.text,
      completed: false,
      userId: args.userId,
    });
    return await ctx.db.get(newTodoId);
  },
});

export const toggle = mutation({
  args: {
    id: v.id("todos"),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { completed: args.completed });
    return { success: true };
  },
});

export const deleteTodo = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

/**
 * Helper function to check if current user is admin
 */
async function isAdmin(ctx: any): Promise<boolean> {
  const user = await authComponent.getAuthUser(ctx);
  if (!user) {
    return false;
  }

  const userId = (user as { _id: string })._id;

  const profile = await ctx.db
    .query("userProfiles")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();

  return profile?.isAdmin === true;
}

/**
 * Get all waitlist entries
 * Admin only
 */
export const listWaitlist = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("waitlist"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      approved: v.boolean(),
      invitedAt: v.optional(v.number()),
      metadata: v.optional(v.any()),
    })
  ),
  handler: async (ctx, _args) => {
    const isUserAdmin = await isAdmin(ctx);
    if (!isUserAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const entries = await ctx.db.query("waitlist").collect();
    return entries;
  },
});

/**
 * Approve a user from the waitlist
 * Admin only
 */
export const approveWaitlistEntry = mutation({
  args: {
    waitlistId: v.id("waitlist"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const isUserAdmin = await isAdmin(ctx);
    if (!isUserAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const entry = await ctx.db.get(args.waitlistId);
    if (!entry) {
      throw new Error("Waitlist entry not found");
    }

    await ctx.db.patch(args.waitlistId, {
      approved: true,
      invitedAt: Date.now(),
    });

    // Send invitation email via Resend
    try {
      await ctx.scheduler.runAfter(
        0,
        internal.sendEmails.sendWaitlistApprovalEmail,
        {
          email: entry.email,
          name: entry.name || "there",
        }
      );
    } catch (error) {
      // Don't fail the approval if email fails
    }

    return null;
  },
});

/**
 * Remove a user from the waitlist
 * Admin only
 */
export const removeWaitlistEntry = mutation({
  args: {
    waitlistId: v.id("waitlist"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const isUserAdmin = await isAdmin(ctx);
    if (!isUserAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    await ctx.db.delete(args.waitlistId);

    return null;
  },
});

/**
 * Join the waitlist
 * Public - allows users to add themselves to the waitlist
 */
export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existing) {
      throw new Error(
        "You're already on the waitlist! We'll notify you when you're approved."
      );
    }

    // Add to waitlist
    await ctx.db.insert("waitlist", {
      email: args.email,
      name: args.name,
      approved: false,
    });

    return null;
  },
});

/**
 * Check waitlist status for an email
 * Public - used to show waitlist position/status
 */
export const checkWaitlistStatus = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("not_found")
      ),
      position: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!entry) {
      return { status: "not_found" as const };
    }

    if (entry.approved) {
      return { status: "approved" as const };
    }

    // Calculate position in waitlist
    const allPending = await ctx.db
      .query("waitlist")
      .filter((q) => q.eq(q.field("approved"), false))
      .collect();

    const position = allPending.findIndex((e) => e._id === entry._id) + 1;

    return {
      status: "pending" as const,
      position,
    };
  },
});

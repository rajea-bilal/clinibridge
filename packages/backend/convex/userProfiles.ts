import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";

/**
 * Create or get user profile for a user
 */
export const getOrCreateUserProfile = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    _id: v.id("userProfiles"),
    _creationTime: v.number(),
    userId: v.string(),
    hasOnboarded: v.boolean(),
    isAdmin: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    // Check if user profile already exists
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      // Check if user is now a pending admin (in case they were added after profile creation)
      try {
        const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
          model: "user",
          where: [
            {
              field: "_id",
              operator: "eq",
              value: args.userId,
            },
          ],
        });

        if (user && (user as any).email) {
          const userEmail = (user as any).email;

          const pendingAdmin = await ctx.db
            .query("pendingAdmins")
            .withIndex("by_email", (q) => q.eq("email", userEmail))
            .unique();

          if (pendingAdmin && !existing.isAdmin) {
            // Update to admin and clean up pending entry
            await ctx.db.patch(existing._id, { isAdmin: true });
            await ctx.db.delete(pendingAdmin._id);
            return { ...existing, isAdmin: true };
          }
          if (pendingAdmin && existing.isAdmin) {
            // Already admin, just clean up
            await ctx.db.delete(pendingAdmin._id);
          }
        }
      } catch (error) {
        // Continue without admin status if we can't check
      }

      return existing;
    }

    // Get user email to check for pending admin
    let isAdmin = false;
    let userEmail: string | null = null;

    try {
      const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
        model: "user",
        where: [
          {
            field: "_id",
            operator: "eq",
            value: args.userId,
          },
        ],
      });

      if (user && (user as any).email) {
        userEmail = (user as any).email;

        const pendingAdmin = await ctx.db
          .query("pendingAdmins")
          .withIndex("by_email", (q) => q.eq("email", userEmail!))
          .unique();

        if (pendingAdmin) {
          isAdmin = true;
          // Clean up pending admin entry
          await ctx.db.delete(pendingAdmin._id);
        }
      }
    } catch (error) {
      // Continue without admin status if we can't check
    }

    // Create new user profile with correct admin status
    const profileId = await ctx.db.insert("userProfiles", {
      userId: args.userId,
      hasOnboarded: false,
      isAdmin,
    });

    const profile = await ctx.db.get(profileId);
    if (!profile) {
      throw new Error("Failed to create user profile");
    }

    return profile;
  },
});

/**
 * Check if user has completed onboarding
 */
export const checkOnboardingStatus = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      hasOnboarded: v.boolean(),
      isAdmin: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      hasOnboarded: profile.hasOnboarded,
      isAdmin: profile.isAdmin,
    };
  },
});

/**
 * Mark user as onboarded
 */
export const completeOnboarding = mutation({
  args: {
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(profile._id, {
      hasOnboarded: true,
    });

    return null;
  },
});

/**
 * Check if user is an admin
 */
export const isUserAdmin = query({
  args: {
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    return profile?.isAdmin === true;
  },
});

/**
 * Set admin status for a user
 * This should only be called by existing admins or during initial setup
 */
export const setAdminStatus = mutation({
  args: {
    userId: v.string(),
    isAdmin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(profile._id, {
      isAdmin: args.isAdmin,
    });

    return null;
  },
});

/**
 * Set admin status for a user by email
 * Can be run BEFORE user signs up - will be applied when they register
 *
 * Usage:
 * bunx convex run userProfiles:setAdminByEmail '{"email":"your@email.com","isAdmin":true}'
 * bunx convex run userProfiles:setAdminByEmail '{"email":"your@email.com","isAdmin":true}' --prod
 */
export const setAdminByEmail = mutation({
  args: {
    email: v.string(),
    isAdmin: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Query BetterAuth component to find user by email
    const user = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: "user",
      where: [
        {
          field: "email",
          operator: "eq",
          value: args.email,
        },
      ],
    });

    if (!user) {
      // User hasn't signed up yet - manage pending admin status
      const pendingAdmin = await ctx.db
        .query("pendingAdmins")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .unique();

      if (args.isAdmin) {
        // Add to pending admins if not already there
        if (!pendingAdmin) {
          await ctx.db.insert("pendingAdmins", { email: args.email });
        }
      } else {
        // Remove from pending admins if present
        if (pendingAdmin) {
          await ctx.db.delete(pendingAdmin._id);
        }
      }
      return null;
    }

    // User exists - set admin status directly
    const userId = (user as any)._id;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, { isAdmin: args.isAdmin });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        hasOnboarded: true,
        isAdmin: args.isAdmin,
      });
    }

    // Clean up pending admin entry if exists
    const pendingAdmin = await ctx.db
      .query("pendingAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (pendingAdmin) {
      await ctx.db.delete(pendingAdmin._id);
    }

    return null;
  },
});

/**
 * Check if an email is in pending admins (for debugging)
 */
export const checkPendingAdmin = query({
  args: {
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const pendingAdmin = await ctx.db
      .query("pendingAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return !!pendingAdmin;
  },
});

/**
 * Handle new user signup - check for pending admin status and send welcome email
 * Internal function called from auth.ts onSignUp hook
 */
export const handleNewUserSignup = internalMutation({
  args: {
    email: v.string(),
    name: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check if user is a pending admin
    const pendingAdmin = await ctx.db
      .query("pendingAdmins")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const isAdmin = !!pendingAdmin;

    // Create user profile with appropriate admin status
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existingProfile) {
      // Update existing profile with admin status
      await ctx.db.patch(existingProfile._id, { isAdmin });
    } else {
      await ctx.db.insert("userProfiles", {
        userId: args.userId,
        hasOnboarded: false,
        isAdmin,
      });
    }

    // Clean up pending admin entry
    if (pendingAdmin) {
      await ctx.db.delete(pendingAdmin._id);
    }

    // Send welcome email
    try {
      await ctx.scheduler.runAfter(0, internal.sendEmails.sendWelcomeEmail, {
        email: args.email,
        name: args.name,
      });
    } catch (error) {
      // Continue if email fails
    }

    return null;
  },
});

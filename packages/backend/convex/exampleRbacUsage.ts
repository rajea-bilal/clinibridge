/**
 * Example usage of RBAC helpers in Convex functions
 *
 * This file demonstrates how to use the RBAC helpers from rbac.ts
 * in your Convex mutations and queries.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getUserRole,
  hasPermission,
  requirePermission,
  requireRole,
} from "./rbac";

// Example 1: Require specific permissions before allowing an action
export const deleteProject = mutation({
  args: {
    projectId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Only users with "delete" permission can proceed
    await requirePermission(ctx, ["delete"]);

    // Your delete logic here
    console.log(`Deleting project ${args.projectId}`);

    return null;
  },
});

// Example 2: Require specific role
export const inviteMember = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Only owners and admins can invite members
    await requireRole(ctx, ["owner", "admin"]);

    // Your invitation logic here
    console.log(`Inviting ${args.email} as ${args.role}`);

    return null;
  },
});

// Example 3: Check permission and return different data
export const getProjectDetails = query({
  args: {
    projectId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    // Check if user can update (for showing edit button in UI)
    const canUpdate = await hasPermission(ctx, ["update"]);
    const canDelete = await hasPermission(ctx, ["delete"]);

    return {
      projectId: args.projectId,
      name: "Example Project",
      // Send permissions to client for UI rendering
      permissions: {
        canUpdate,
        canDelete,
      },
    };
  },
});

// Example 4: Get user role for conditional logic
export const getOrganizationStats = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const role = await getUserRole(ctx);

    // Owners and admins see full stats
    if (role === "owner" || role === "admin") {
      return {
        memberCount: 10,
        projectCount: 25,
        revenue: 50_000, // Sensitive data
      };
    }

    // Members see limited stats
    return {
      memberCount: 10,
      projectCount: 25,
      // No revenue data for members
    };
  },
});

// Example 5: Require multiple permissions
export const updateAndPublishProject = mutation({
  args: {
    projectId: v.string(),
    changes: v.any(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // User needs both update AND create permissions
    await requirePermission(ctx, ["update", "create"]);

    console.log(`Updating and publishing project ${args.projectId}`);

    return null;
  },
});

/**
 * RBAC (Role-Based Access Control) helpers for BetterAuth Organizations
 *
 * Usage in Convex functions:
 * 1. Check permissions: const hasAccess = await hasPermission(ctx, ["delete"])
 * 2. Require permissions: await requirePermission(ctx, ["create", "update"])
 */

import type { GenericMutationCtx, GenericQueryCtx } from "convex/server";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { authComponent } from "./auth";

// Define permission types based on your roles in auth.ts
export type OrgPermission =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "invite"
  | "remove";

// Context types that have db access
type DbCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>;

/**
 * Get the authenticated user and their auth headers
 */
export async function getAuthWithSessionHeaders(
  ctx: DbCtx
): Promise<{ auth: any; headers: Record<string, string> }> {
  const auth = await authComponent.getAuthUser(ctx as any);
  if (!auth) {
    throw new Error("Unauthorized: No active session");
  }

  const headersObj = await authComponent.getHeaders(ctx as any);
  // Convert Headers to Record<string, string>
  const headers: Record<string, string> = {};
  headersObj.forEach((value: string, key: string) => {
    headers[key] = value;
  });
  return { auth, headers };
}

/**
 * Check if the current user has specific permissions in their active organization
 *
 * @param ctx - Convex context
 * @param permissions - Array of permissions to check (e.g., ["create", "delete"])
 * @returns true if user has ALL specified permissions, false otherwise
 *
 * @example
 * const canDelete = await hasPermission(ctx, ["delete"]);
 * if (!canDelete) {
 *   throw new Error("You don't have permission to delete");
 * }
 */
export async function hasPermission(
  ctx: DbCtx,
  permissions: OrgPermission[]
): Promise<boolean> {
  try {
    const { auth, headers } = await getAuthWithSessionHeaders(ctx);

    // Check if user has an active organization
    if (!auth.session?.activeOrganizationId) {
      return false;
    }

    // Use BetterAuth's built-in permission checker
    // This checks against the roles defined in auth.ts
    const result = await fetch(
      `${process.env.SITE_URL}/api/auth/organization/has-permission`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          permissions: permissions.reduce(
            (acc, p) => {
              acc[p] = [p];
              return acc;
            },
            {} as Record<string, string[]>
          ),
        }),
      }
    );

    if (!result.ok) {
      return false;
    }

    const data = await result.json();
    return data.success === true;
  } catch (error) {
    console.error("Permission check failed:", error);
    return false;
  }
}

/**
 * Require specific permissions - throws an error if user doesn't have them
 *
 * @param ctx - Convex context
 * @param permissions - Array of required permissions
 * @throws Error if user is not authenticated or lacks required permissions
 *
 * @example
 * await requirePermission(ctx, ["delete"]);
 * // Code here only runs if user has delete permission
 */
export async function requirePermission(
  ctx: DbCtx,
  permissions: OrgPermission[]
): Promise<void> {
  const hasAccess = await hasPermission(ctx, permissions);
  if (!hasAccess) {
    throw new Error(
      `Unauthorized: Missing required permissions: ${permissions.join(", ")}`
    );
  }
}

/**
 * Get the current user's role in their active organization
 *
 * @param ctx - Convex context
 * @returns The user's role ("owner" | "admin" | "member") or null if not in an organization
 */
export async function getUserRole(
  ctx: DbCtx
): Promise<"owner" | "admin" | "member" | null> {
  const { auth } = await getAuthWithSessionHeaders(ctx);

  if (!auth.session?.activeOrganizationId) {
    return null;
  }

  // Query the member table from BetterAuth component
  // Note: "member" table is added by the organization plugin
  const member = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "member" as any,
    where: [
      {
        field: "organizationId",
        operator: "eq",
        value: auth.session.activeOrganizationId,
      },
      {
        field: "userId",
        operator: "eq",
        value: auth._id,
      },
    ],
  });

  return ((member as any)?.role as "owner" | "admin" | "member") || null;
}

/**
 * Require a specific role - throws an error if user doesn't have it
 *
 * @param ctx - Convex context
 * @param allowedRoles - Array of roles that are allowed
 * @throws Error if user doesn't have one of the allowed roles
 *
 * @example
 * await requireRole(ctx, ["owner", "admin"]);
 * // Only owners and admins can proceed
 */
export async function requireRole(
  ctx: DbCtx,
  allowedRoles: Array<"owner" | "admin" | "member">
): Promise<void> {
  const role = await getUserRole(ctx);

  if (!(role && allowedRoles.includes(role))) {
    throw new Error(
      `Unauthorized: Required role is one of: ${allowedRoles.join(", ")}. Current role: ${role || "none"}`
    );
  }
}

import { waitlist } from "@better-auth-kit/waitlist";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { v } from "convex/values";
import { config } from "../../../config";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";
import authSchema from "./betterAuth/schema";

// Define access control statements for organization permissions
const statement = {
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "read", "update"],
} as const;

const ac = createAccessControl(statement);

// Define roles using the access control instance
const owner = ac.newRole({
  organization: ["create", "read", "update", "delete"],
  member: ["invite", "remove", "read", "update"],
});

const admin = ac.newRole({
  organization: ["read", "update"],
  member: ["invite", "remove", "read", "update"],
});

const member = ac.newRole({
  organization: ["read"],
  member: ["read"],
});

const siteUrl = process.env.SITE_URL!;

// Create authComponent with local schema for Local Install
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    local: {
      schema: authSchema,
    },
  }
);

/**
 * Create BetterAuth options object.
 * This is separated from createAuth so it can be used for schema generation
 * in the local component without triggering env var errors.
 */
export function createAuthOptions(
  ctx: GenericCtx<DataModel>
): BetterAuthOptions {
  // Build plugins array conditionally
  const plugins = [
    convex({
      authConfig,
      jwksRotateOnTokenGenerationError: true,
    }),
    ...(config.features.waitlist
      ? [
          waitlist({
            enabled: true,
            waitlistEndConfig: {
              event: "trigger-only",
              onWaitlistEnd: () => {
                // Waitlist ended
              },
            },
          }),
        ]
      : []),
    ...(config.features.organizations
      ? [
          organization({
            ac,
            allowUserToCreateOrganization: true,
            organizationLimit: 10,
            roles: {
              owner,
              admin,
              member,
            },
            async sendInvitationEmail(data) {
              // Construct the invitation acceptance URL
              const inviteUrl = `${siteUrl}/accept-invitation/${data.invitation.id}`;

              // Schedule email to be sent via internal mutation
              try {
                await (
                  ctx as unknown as {
                    scheduler: {
                      runAfter: (
                        delay: number,
                        fn: unknown,
                        args: unknown
                      ) => Promise<void>;
                    };
                  }
                ).scheduler.runAfter(
                  0,
                  internal.sendEmails.sendOrganizationInvitationEmail,
                  {
                    email: data.email,
                    organizationName: data.organization.name,
                    inviterName: data.inviter.user.name || "",
                    inviterEmail: data.inviter.user.email || "",
                    url: inviteUrl,
                  }
                );
              } catch (error) {
                // Log error but don't fail the invitation creation
                console.error(
                  "Failed to schedule organization invitation email:",
                  error
                );
              }
            },
          }),
        ]
      : []),
  ];

  return {
    baseURL: siteUrl,
    trustedOrigins: [siteUrl],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins,
  };
}

/**
 * Create and configure the BetterAuth instance.
 */
function createAuth(ctx: GenericCtx<DataModel>) {
  const options = createAuthOptions(ctx);

  return betterAuth({
    ...options,
    onSignUp: {
      after: async (user: {
        email?: string;
        name?: string;
        id?: string;
        _id?: string;
      }) => {
        // Handle pending admin status and send welcome email
        if (user.email) {
          try {
            // Query BetterAuth to get the actual user ID (it might be _id or id)
            const userId =
              (user as unknown as { _id?: string; id?: string })._id ||
              (user as unknown as { _id?: string; id?: string }).id;

            if (userId) {
              await (
                ctx as unknown as {
                  scheduler: {
                    runAfter: (
                      delay: number,
                      fn: unknown,
                      args: unknown
                    ) => Promise<void>;
                  };
                }
              ).scheduler.runAfter(
                0,
                internal.userProfiles.handleNewUserSignup,
                {
                  email: user.email,
                  name: user.name || "there",
                  userId,
                }
              );
            } else {
              // Fallback: query by email to get user ID
              const foundUser = await ctx.runQuery(
                components.betterAuth.adapter.findOne,
                {
                  model: "user",
                  where: [
                    {
                      field: "email",
                      operator: "eq",
                      value: user.email,
                    },
                  ],
                }
              );

              if (!foundUser) {
                return;
              }

              const actualUserId =
                (foundUser as unknown as { _id?: string; id?: string })?._id ||
                (foundUser as unknown as { _id?: string; id?: string })?.id;
              if (!actualUserId) {
                return;
              }

              await (
                ctx as unknown as {
                  scheduler: {
                    runAfter: (
                      delay: number,
                      fn: unknown,
                      args: unknown
                    ) => Promise<void>;
                  };
                }
              ).scheduler.runAfter(
                0,
                internal.userProfiles.handleNewUserSignup,
                {
                  email: user.email,
                  name: user.name || "there",
                  userId: actualUserId,
                }
              );
            }
          } catch {
            // Continue if scheduling fails
          }
        }
      },
    },
  });
}

export { createAuth };

export const getCurrentUser = query({
  args: {},
  returns: v.union(v.any(), v.null()),
  async handler(ctx, _args) {
    try {
      return await authComponent.getAuthUser(
        ctx as unknown as GenericCtx<DataModel>
      );
    } catch {
      return null;
    }
  },
});

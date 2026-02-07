import type { AuthConfig } from "convex/server";

// Inline the auth config to avoid import resolution issues with cached packages
// This is equivalent to getAuthConfigProvider() from @convex-dev/better-auth/auth-config
export default {
  providers: [
    {
      type: "customJwt",
      issuer: `${process.env.CONVEX_SITE_URL}`,
      applicationID: "convex",
      algorithm: "RS256",
      jwks: `${process.env.CONVEX_SITE_URL}/api/auth/convex/jwks`,
    },
  ],
} satisfies AuthConfig;

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { config } from "@root/config";
import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [
    convexClient(),
    ...(config.features.organizations ? [organizationClient()] : []),
  ],
});

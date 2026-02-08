import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("clinibridge");

export const web = await TanStackStart("web", {
  bindings: {
    // Convex URLs (auto-managed)
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL || "",
    VITE_CONVEX_SITE_URL: process.env.VITE_CONVEX_SITE_URL || "",
    // HumanBehavior Analytics
    VITE_HUMANBEHAVIOR_API_KEY: process.env.VITE_HUMANBEHAVIOR_API_KEY || "",
    // Your custom variables
    VITE_TEST_VAR: process.env.VITE_TEST_VAR || "",
  },
  dev: {
    command: "bun run dev",
  },
});

console.log(`Web    -> ${web.url}`);

await app.finalize();

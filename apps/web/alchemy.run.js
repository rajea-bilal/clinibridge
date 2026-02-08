import alchemy from "alchemy";
import { TanStackStart } from "alchemy/cloudflare";
const app = await alchemy("clinibridge");
export const web = await TanStackStart("web", {
  bindings: {
    VITE_CONVEX_URL: process.env.VITE_CONVEX_URL || "",
    VITE_CONVEX_SITE_URL: process.env.VITE_CONVEX_SITE_URL || "",
  },
  dev: {
    command: "bun run dev",
  },
});
console.log(`Web    -> ${web.url}`);
await app.finalize();

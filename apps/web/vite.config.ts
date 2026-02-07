import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths({
      root: process.cwd(), // Only resolve from current directory
      ignoreConfigErrors: true, // Ignore errors in other tsconfig files
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    alchemy(),
  ],
  resolve: {
    dedupe: ["convex/react", "convex"], // Force single instance of convex
  },
  ssr: {
    noExternal: ["@convex-dev/better-auth"], // Bundle better-auth during SSR
  },
  clearScreen: false,
});

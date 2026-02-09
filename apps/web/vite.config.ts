import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  plugins: [
    tsconfigPaths({
      root: process.cwd(), // Only resolve from current directory
      ignoreConfigErrors: true, // Ignore errors in other tsconfig files
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    // Only include alchemy for builds (deployment). In dev, SSR runs in Bun
    // where process.env works natively — no workerd sandbox needed.
    ...(command === "build" ? [alchemy()] : []),
  ],
  resolve: {
    dedupe: ["convex/react", "convex"], // Force single instance of convex
  },
  ssr: {
    noExternal: ["@convex-dev/better-auth"], // Bundle better-auth during SSR
  },
  clearScreen: false,
}));

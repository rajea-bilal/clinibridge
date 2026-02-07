---
name: bugs
overview: Tracks bugs discovered during implementation and testing.
isProject: false
---

# Bugs

## Open

- **OPENAI_API_KEY required**: The chat API route (`/api/chat`) requires the `OPENAI_API_KEY` environment variable to be set. Without it, AI chat will fail. Add to `.env` or environment. Not a code bug — deployment configuration needed.

## Closed

- **Convex query in Node.js file**: `searchTrials.ts` had `"use node"` at the top, which tells Convex the whole file runs in Node.js. But `getSearch` (a query) and `saveSearchInternal` (a mutation) can't run in Node — only actions can. Convex rejected the push with "Only actions can be defined in Node.js." Fix: moved the query and mutation into a new file `searchTrialsQueries.ts` without `"use node"`, kept only the action in the original file.

- **Vite crash from Alchemy plugin**: `vite.config.ts` had the `alchemy()` Cloudflare deployment plugin enabled, but it needs a wrangler config file that only exists after running `alchemy dev` or `alchemy deploy`. On a fresh clone it crashes instantly. Fix: commented out the `alchemy()` plugin — not needed for local dev.

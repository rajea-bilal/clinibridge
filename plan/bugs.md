---
name: bugs
overview: Tracks bugs discovered during implementation and testing.
isProject: false
---

# Bugs

## Open

- **OPENAI_API_KEY required**: The chat API route (`/api/chat`) requires the `OPENAI_API_KEY` environment variable to be set. Without it, AI chat will fail. Add to `.env` or environment. Not a code bug — deployment configuration needed.

## Refinements / Improvements

### Trial cards showed unfiltered results — scoring never reached the UI (fixed)

**Problem**: Raw trials from ClinicalTrials.gov were returned directly to the UI with no scoring. The AI's text might say "this doesn't fit your age" but the cards had no way to read that — `matchScore` was always 0, no badges, no filtering.

**Fix**: Added a second AI call (`generateObject`) inside the tool execute that scores each trial against the patient profile before returning. Cards now get real `matchLabel`, `matchScore`, and `matchReason` data.

### Form path (Path B) had no scoring at all (fixed)

**Problem**: The form search at `/find` called `fetchTrials()` directly from the browser — bypassing any server-side scoring. All 9+ raw trials showed up unfiltered with no badges, even though the chat path was scoring correctly.

**Fix**: Created a server API route (`/api/search`) that does fetch + score using the same shared `scoreTrials()` function as the chat path. Updated `find.tsx` to call this route. Updated `TrialResultsList` to filter out "Unlikely" trials, sort by score, and cap at 4 visible with "Show more". Both paths now use identical scoring.

## Closed

- **Convex query in Node.js file**: `searchTrials.ts` had `"use node"` at the top, which tells Convex the whole file runs in Node.js. But `getSearch` (a query) and `saveSearchInternal` (a mutation) can't run in Node — only actions can. Convex rejected the push with "Only actions can be defined in Node.js." Fix: moved the query and mutation into a new file `searchTrialsQueries.ts` without `"use node"`, kept only the action in the original file.

- **Vite crash from Alchemy plugin**: `vite.config.ts` had the `alchemy()` Cloudflare deployment plugin enabled, but it needs a wrangler config file that only exists after running `alchemy dev` or `alchemy deploy`. On a fresh clone it crashes instantly. Fix: commented out the `alchemy()` plugin — not needed for local dev.

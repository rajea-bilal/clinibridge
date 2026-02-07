---
name: bugs
overview: Tracks bugs discovered during implementation and testing.
isProject: false
---

# Bugs

## Open

- **OPENAI_API_KEY required**: The chat API route (`/api/chat`) requires the `OPENAI_API_KEY` environment variable to be set. Without it, AI chat will fail. Add to `.env` or environment. Not a code bug — deployment configuration needed.

## Refinements / Improvements

### Trial cards show unfiltered results — no scoring reaches the UI (fixed)

**The problem**: The flow is: user types → AI asks follow-ups → AI calls `searchTrials` tool → tool fetches from ClinicalTrials.gov → raw trials come back → tool returns them → cards render them. Nobody scores the trials between fetching and displaying. The system prompt tells the AI to score trials in its *text reply*, but that scoring only lives in the chat paragraph — the actual trial objects the cards use still have `matchScore: 0` and no `matchLabel`. The cards can't read the AI's written opinion.

So even though the AI might say "trial #1 doesn't fit your age," the card for that trial still shows up with no badge, no filtering, nothing. The UI and the AI text are disconnected.

**The fix**: Add a second AI call *inside* the tool's `execute` function, between getting the raw trials and returning them. This call takes the raw trials + patient profile, uses structured JSON output to score each trial (`matchLabel`, `matchReason`, `matchScore`), and merges the scores into the trial objects. The tool then returns already-scored trials. Now the cards have real data for badges and the `TrialCardsFromChat` component can filter/sort by `matchScore`.

## Closed

- **Convex query in Node.js file**: `searchTrials.ts` had `"use node"` at the top, which tells Convex the whole file runs in Node.js. But `getSearch` (a query) and `saveSearchInternal` (a mutation) can't run in Node — only actions can. Convex rejected the push with "Only actions can be defined in Node.js." Fix: moved the query and mutation into a new file `searchTrialsQueries.ts` without `"use node"`, kept only the action in the original file.

- **Vite crash from Alchemy plugin**: `vite.config.ts` had the `alchemy()` Cloudflare deployment plugin enabled, but it needs a wrangler config file that only exists after running `alchemy dev` or `alchemy deploy`. On a fresh clone it crashes instantly. Fix: commented out the `alchemy()` plugin — not needed for local dev.

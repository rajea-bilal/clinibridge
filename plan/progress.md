---
name: progress
overview: Tracks feature implementation progress.
isProject: false
---

# Progress

## Status

- [x] feature-clinicaltrials-integration
- [x] feature-ai-chat
- [x] feature-backend-convex
- [x] feature-frontend-experience
- [x] feature-landing-and-routing
- [x] dev-environment-setup
- [x] refinement-ai-scoring-and-filtering

## Notes

### feature-clinicaltrials-integration (completed)

- Created `apps/web/src/lib/types.ts` with `TrialRaw`, `TrialSummary`, `TrialLocation`, `TrialSearchInput` types.
- Created `apps/web/src/lib/clinicalTrials.ts` with `fetchTrials()` — queries ClinicalTrials.gov v2 API, handles timeout (15s), normalizes raw records, skips invalid entries, returns max 10 results.

### feature-ai-chat (completed)

- Created `apps/web/src/lib/zodSchemas.ts` with `searchTrialsToolSchema` for AI tool validation.
- Created `apps/web/src/lib/aiPrompts.ts` with system prompt and tool description.
- Created `apps/web/src/routes/api/chat.ts` — TanStack Start API route using Vercel AI SDK `streamText` with `gpt-4o-mini`, registers `searchTrials` tool with 3 max steps.
- Created `apps/web/src/components/Chat/ChatPanel.tsx` — `useChat` wiring with auto-scroll, stop button, input focus.
- Created `apps/web/src/components/Chat/MessageList.tsx` — renders user/assistant messages, tool loading states, and tool results.
- Created `apps/web/src/components/Chat/TrialCardsFromChat.tsx` — renders tool result trial cards inside chat.

### feature-backend-convex (completed)

- Updated `packages/backend/convex/schema.ts` with `searches` and `chatSessions` tables.
- Created `packages/backend/convex/searchTrials.ts` — `searchTrials` action (Node.js runtime), `saveSearchInternal` mutation, `getSearch` query.
- Created `packages/backend/convex/sessions.ts` — `saveChatSession` mutation, `getChatSession` query.

### feature-frontend-experience (completed)

- Created `apps/web/src/routes/chat.tsx` — full-screen chat page with header and `ChatPanel`.
- Created `apps/web/src/routes/find.tsx` — form-based search page with `TrialSearchForm` and `TrialResultsList`.
- Created `apps/web/src/routes/results.$id.tsx` — saved search results page using Convex `getSearch` query.
- Created `apps/web/src/components/Form/TrialSearchForm.tsx` — validated form with condition, age, location, medications, additional info.
- Created `apps/web/src/components/Trials/TrialCard.tsx` — trial card with status badge, metadata grid, interventions, external link.
- Created `apps/web/src/components/Trials/TrialResultsList.tsx` — list with loading skeletons, error state, empty state, disclaimer.
- Created `apps/web/src/components/Trials/NoResults.tsx` — empty state component.
- Created `apps/web/src/components/Shared/Disclaimer.tsx` — amber disclaimer banner.

### feature-landing-and-routing (completed)

- Replaced `apps/web/src/routes/index.tsx` with CliniBridge landing page — hero, two CTAs (Chat / Form), three feature cards, footer disclaimer.
- Routes `/chat`, `/find`, `/results/$id` all created and reachable via TanStack Router file-based routing.

### dev-environment-setup (completed)

- Connected Convex dev deployment (`colorless-platypus-434`) — backend functions pushing successfully.
- Added `VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` to `apps/web/.env`.
- Added `OPENAI_API_KEY` to `apps/web/.env` (needed for `/chat` AI route).
- Added `CONVEX_DEPLOYMENT` to `packages/backend/.env`.
- Confirmed both `.env` files are gitignored.
- Fixed Convex push error: moved `getSearch` query and `saveSearchInternal` mutation out of `"use node"` file into new `searchTrialsQueries.ts`. Actions-only rule in Node.js runtime.
- Fixed `results.$id.tsx` to reference `api.searchTrialsQueries.getSearch` after the file split.
- Added `Id<"searches">` type annotation to fix TypeScript circular inference error.
- Commented out `alchemy()` plugin in `vite.config.ts` — crashes without wrangler config, not needed for local dev.
- Convex typecheck passing, functions deployed, UI rendering on `localhost:3001`.

### refinement-ai-scoring-and-filtering (completed)

- **Rewrote system prompt** (`aiPrompts.ts`) — explicit instructions to check age ranges, read eligibility criteria, assign match labels, filter unlikely trials, limit to 4, and write concise conversational responses instead of repeating card data.
- **Added scoring prompt** (`aiPrompts.ts`) — dedicated `SCORING_PROMPT` for the second AI call with rules for age checking, condition matching, medication cross-referencing, and label assignment.
- **Added structured scoring schemas** (`zodSchemas.ts`) — `trialScoreSchema` and `scoringResponseSchema` for `generateObject` structured output (`matchLabel`, `matchScore`, `matchReason` per trial).
- **Added second AI call inside tool execute** (`api/chat.ts`) — after `fetchTrials()` returns raw trials, a `generateObject` call scores each trial against the patient profile. Scores are merged into trial objects before the tool returns. Falls back to unscored trials if scoring fails.
- **Tool output now includes patient profile** (`api/chat.ts`) — `patientProfile` object echoed back alongside trials so the conversational AI can cross-reference.
- **Added match fields to data model** (`types.ts`) — `TrialSummary` now includes `eligibilityFull?`, `matchLabel?`, `matchReason?`.
- **Increased eligibility text for AI** (`clinicalTrials.ts`) — added `eligibilityFull` field (1500 chars) for scoring; UI still uses 500-char truncated version.
- **Added match badges to trial cards** (`TrialCard.tsx`) — color-coded `MatchBadge` component (green/amber/blue/red) with match reason text.
- **Cards now filter and sort** (`TrialCardsFromChat.tsx`) — filters out "Unlikely" trials, sorts by `matchScore` desc, shows first 4 with "Show more" button.
- **Updated Convex schema + validators** (`schema.ts`, `searchTrials.ts`, `searchTrialsQueries.ts`) — added `eligibilityFull`, `matchLabel`, `matchReason` as optional fields across all validators.
- **Verified**: tested with "12yo son, sickle cell disease, London, hydroxyurea" — correctly filtered 10 trials down to 4 matches (3 Strong, 1 Possible), excluded age-ineligible trials (under-2 and adults-only).

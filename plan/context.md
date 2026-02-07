# Context

## What is CliniBridge

AI-powered clinical trial finder. Two entry paths: **chat** (conversational AI) and **form** (structured search). Both query ClinicalTrials.gov v2 API for recruiting trials and render results as trial cards.

## Tech Stack

- **Frontend**: TanStack Start (React) + Tailwind + shadcn/ui — lives in `apps/web/`
- **Backend**: Convex (schema, actions, mutations) — lives in `packages/backend/convex/`
- **AI**: Vercel AI SDK v6 (`ai@6.0.77`, `@ai-sdk/openai@3.0.26`) with `gpt-4o-mini`
- **Package manager**: Bun
- **Monorepo**: Turborepo with workspaces (`apps/*`, `packages/*`)

## Files Created

### Shared types & API client
- `apps/web/src/lib/types.ts` — `TrialRaw`, `TrialSummary`, `TrialLocation`, `TrialSearchInput`
- `apps/web/src/lib/clinicalTrials.ts` — `fetchTrials()`: ClinicalTrials.gov v2 API client, 15s timeout, normalization, max 10 results

### AI chat (SDK v6 patterns)
- `apps/web/src/lib/zodSchemas.ts` — `searchTrialsToolSchema` (Zod, used as `inputSchema`)
- `apps/web/src/lib/aiPrompts.ts` — system prompt + tool description
- `apps/web/src/routes/api/chat.ts` — POST handler: `streamText` + `convertToModelMessages` + `toUIMessageStreamResponse`, `stopWhen: stepCountIs(3)`, `searchTrials` tool with `inputSchema`

### Chat UI
- `apps/web/src/components/Chat/ChatPanel.tsx` — `useChat` from `@ai-sdk/react`, local `useState` for input, `sendMessage({text})` pattern
- `apps/web/src/components/Chat/MessageList.tsx` — renders `UIMessage.parts` (`text`, `tool-searchTrials` with states `input-streaming`/`input-available`/`output-available`/`output-error`)
- `apps/web/src/components/Chat/TrialCardsFromChat.tsx` — renders tool output trials inside chat

### Form UI
- `apps/web/src/components/Form/TrialSearchForm.tsx` — validated form (condition*, age*, location, medications, additionalInfo)

### Trial display components
- `apps/web/src/components/Trials/TrialCard.tsx` — card with status badge, metadata grid, interventions, ClinicalTrials.gov link
- `apps/web/src/components/Trials/TrialResultsList.tsx` — list with loading skeletons, error state, empty state, disclaimer
- `apps/web/src/components/Trials/NoResults.tsx` — empty state
- `apps/web/src/components/Shared/Disclaimer.tsx` — amber disclaimer banner

### Routes
- `apps/web/src/routes/index.tsx` — landing page with Chat + Form CTAs, feature cards
- `apps/web/src/routes/chat.tsx` — full-screen chat page
- `apps/web/src/routes/find.tsx` — form search page, calls `fetchTrials` client-side
- `apps/web/src/routes/results.$id.tsx` — saved search results via Convex `getSearch` query

### Convex backend
- `packages/backend/convex/schema.ts` — added `searches` and `chatSessions` tables
- `packages/backend/convex/searchTrials.ts` — `searchTrials` action (`"use node"`), `saveSearchInternal` mutation, `getSearch` query
- `packages/backend/convex/sessions.ts` — `saveChatSession` mutation, `getChatSession` query

## Key API Decisions

| Area | Decision |
|---|---|
| ClinicalTrials.gov | v2 API, `query.cond` (OR-joined synonyms), `filter.overallStatus=RECRUITING`, `query.locn` for location, `pageSize=10` |
| AI SDK | v6 — `inputSchema` (not `parameters`), `stopWhen: stepCountIs()` (not `maxSteps`), `toUIMessageStreamResponse()`, `convertToModelMessages()` is async |
| useChat | v6 — no built-in input state; local `useState` + `sendMessage({text})`, messages use `parts` array, tool parts typed as `tool-{toolName}` |
| Convex actions | `"use node"` directive for `searchTrials` action (needs `fetch`) |

## Env Vars Needed

- `OPENAI_API_KEY` — required for `/api/chat` route
- `VITE_CONVEX_URL` — already in `.env.example`

## Open Items

- `OPENAI_API_KEY` must be set in environment for chat to work (logged in `plan/bugs.md`)
- Form search at `/find` calls ClinicalTrials.gov directly from client (no API key needed)
- Match scoring (`matchScore`) is placeholder (always 0) — can be enhanced with AI scoring later

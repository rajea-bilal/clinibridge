---
name: blueprint-technical-plan
overview: Create a detailed, file-oriented technical plan to implement the clinical trial finder with chat and form flows, keeping existing stack intact.
todos:
  - id: frontend-layer
    content: "Frontend — Plan routes + UI components + build order + QA"
    status: pending
  - id: backend-layer
    content: "Backend — Plan Convex schema + actions/mutations + data saves"
    status: pending
  - id: ai-layer
    content: "AI — Plan Vercel AI SDK route, prompts, tool contract"
    status: pending
isProject: false
---

# Blueprint Technical Plan

## Scope And Assumptions

- Use existing TanStack Router, Convex, Tailwind, shadcn/ui as-is.
- Add Vercel AI SDK and one LLM provider (OpenAI or Claude) with minimal wiring.
- ClinicalTrials.gov API v2 via `https://clinicaltrials.gov/api/v2/studies` with params `query.cond`, `filter.overallStatus=RECRUITING`, `pageSize=10` and 15s timeout.
- No auth; no permanent patient data; store only session/search artifacts with mock-friendly fields.

## File Structure (New Or Updated)

- `[frontend/src/routes/chat.tsx](frontend/src/routes/chat.tsx)` (or router location equivalent): Chat page.
- `[frontend/src/routes/find.tsx](frontend/src/routes/find.tsx)` (or equivalent): Form page.
- `[frontend/src/routes/results.tsx](frontend/src/routes/results.tsx)` (optional): Results-only view (reused by both paths if desired).
- `[frontend/src/components/Chat/ChatPanel.tsx](frontend/src/components/Chat/ChatPanel.tsx)`
- `[frontend/src/components/Chat/MessageList.tsx](frontend/src/components/Chat/MessageList.tsx)`
- `[frontend/src/components/Chat/TrialCardsFromChat.tsx](frontend/src/components/Chat/TrialCardsFromChat.tsx)`
- `[frontend/src/components/Form/TrialSearchForm.tsx](frontend/src/components/Form/TrialSearchForm.tsx)`
- `[frontend/src/components/Trials/TrialCard.tsx](frontend/src/components/Trials/TrialCard.tsx)`
- `[frontend/src/components/Trials/TrialResultsList.tsx](frontend/src/components/Trials/TrialResultsList.tsx)`
- `[frontend/src/components/Trials/NoResults.tsx](frontend/src/components/Trials/NoResults.tsx)`
- `[frontend/src/components/Shared/Disclaimer.tsx](frontend/src/components/Shared/Disclaimer.tsx)`
- `[frontend/src/lib/clinicalTrials.ts](frontend/src/lib/clinicalTrials.ts)` (shared fetch + parse helpers)
- `[frontend/src/lib/zodSchemas.ts](frontend/src/lib/zodSchemas.ts)` (tool input schemas)
- `[frontend/src/lib/aiPrompts.ts](frontend/src/lib/aiPrompts.ts)`
- `[frontend/src/lib/types.ts](frontend/src/lib/types.ts)`
- `[frontend/src/api/chat.ts](frontend/src/api/chat.ts)` or `[frontend/src/routes/api/chat.ts](frontend/src/routes/api/chat.ts)` (Vercel AI SDK route in your framework layout)
- `[packages/backend/convex/schema.ts](packages/backend/convex/schema.ts)` (Convex tables)
- `[packages/backend/convex/searchTrials.ts](packages/backend/convex/searchTrials.ts)` (Convex action)
- `[packages/backend/convex/sessions.ts](packages/backend/convex/sessions.ts)` (optional save/lookup)

## Convex Schema (Minimal)

- `searches`
  - `createdAt`: number
  - `mode`: "chat" | "form"
  - `condition`: string
  - `age`: number
  - `location`: string
  - `medications`: string[] (optional)
  - `additionalInfo`: string (optional)
  - `results`: array of summarized trial objects (store top 10)
- `chatSessions`
  - `createdAt`: number
  - `title`: string (optional)
  - `messages`: array of minimal message objects (role, content, createdAt)

## Convex Functions

- `searchTrials` (action)
  - Input: condition, age, location, medications?, additionalInfo?
  - Steps: call ClinicalTrials.gov API; map results; call AI scoring prompt; return scored summaries.
  - Output: array of `TrialSummary` objects.
- `saveSearch` (mutation)
  - Input: search metadata + results
  - Output: search id
- `saveChatSession` (mutation)
  - Input: session metadata + message list
  - Output: session id
- `getSearch` (query, optional)
  - Input: search id
  - Output: saved search + results

## Routes (TanStack Router)

- `/` landing with two CTAs (Chat / Form)
- `/chat` chat experience (Path A)
- `/find` form experience (Path B)
- `/results/:id` optional saved results view

## Components

- `ChatPanel`: wraps `useChat`, handles tool-call UI, error states, and results rendering.
- `MessageList`: renders chat messages with friendly styling.
- `TrialCardsFromChat`: maps tool results to cards.
- `TrialSearchForm`: collects condition, age, location, meds, additional info; validates and submits.
- `TrialCard`: displays title, location, match score, plain-English summary, eligibility tag.
- `TrialResultsList`: list layout, includes `Disclaimer` and `NoResults` handling.
- `Disclaimer`: persistent banner/text for non-medical advice.
- `NoResults`: compassionate empty state and next steps.

## API Route For Chat (Vercel AI SDK)

- Route file: `src/api/chat.ts` (or framework-equivalent API route).
- Uses `useChat` on client; server route handles model, system prompt, and tool definitions.
- `searchTrials` tool:
  - Zod schema requiring `condition`, `age`, `location`; optional `synonyms`, `medications`, `additionalInfo`.
  - Tool handler calls ClinicalTrials.gov API via `clinicalTrials.ts`, returns normalized trial data to model.
- System prompt: use provided chat prompt verbatim from requirements.

## ClinicalTrials.gov Integration

- Fetch URL: `https://clinicaltrials.gov/api/v2/studies`
- Params:
  - `query.cond`: condition + synonyms (joined by OR)
  - `filter.overallStatus`: `RECRUITING`
  - `pageSize`: 10
- Timeout: 15s; on timeout or error, return friendly error message.
- Extract fields:
  - NCT id, brief title, locations, eligibility criteria, phase, age range, status, brief summary
- Normalize to `TrialRaw` then to `TrialSummary` (plain English + match score).

## Build Order (Small Steps)

1. Create shared types and Zod schemas (`lib/types.ts`, `lib/zodSchemas.ts`).
2. Add `lib/clinicalTrials.ts` with fetch + normalization + timeout handling.
3. Add `lib/aiPrompts.ts` with both prompts.
4. Implement API route for chat tool calling + system prompt.
5. Build `TrialCard`, `TrialResultsList`, `Disclaimer`, `NoResults`.
6. Build `/chat` page and `ChatPanel` with tool-call result rendering.
7. Add Convex schema tables and deploy schema update.
8. Implement Convex `searchTrials` action (clinical trials fetch + AI scoring prompt).
9. Implement Convex `saveSearch` and optional `saveChatSession`.
10. Build `TrialSearchForm` and `/find` page using Convex action.
11. Add landing page with routing between chat/form.
12. Add optional `/results/:id` view to read saved search.
13. Add empty/error states and disclaimer on results screens.
14. Verify max 10 results, sorted by match strength.
15. Manual QA: chat tool call flow, form flow, timeout behavior.


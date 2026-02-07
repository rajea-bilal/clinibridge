---
name: feature-backend-convex
overview: Plan Convex schema, actions, and mutations for searches and sessions.
isProject: false
---

# Feature Plan: Backend (Convex)

## Goals

- Store search artifacts and (optionally) chat sessions.
- Provide a single action for trial search with AI scoring.
- Keep schema minimal and mock-friendly.

## Scope

- Convex schema tables: `searches`, `chatSessions`
- Convex action: `searchTrials`
- Convex mutations: `saveSearch`, `saveChatSession`
- Optional query: `getSearch`

## Files

- `packages/backend/convex/schema.ts`
- `packages/backend/convex/searchTrials.ts`
- `packages/backend/convex/sessions.ts`

## Schema

- `searches`
  - `createdAt`: number
  - `mode`: "chat" | "form"
  - `condition`: string
  - `age`: number
  - `location`: string
  - `medications?`: string[]
  - `additionalInfo?`: string
  - `results`: `TrialSummary[]` (top 10)
- `chatSessions`
  - `createdAt`: number
  - `title?`: string
  - `messages`: `{ role, content, createdAt }[]`

## Action: `searchTrials`

- Input: `condition`, `age`, `location`, `medications?`, `additionalInfo?`
- Steps: call ClinicalTrials.gov API, normalize, score/summarize, return summaries.
- Output: `TrialSummary[]`

## Mutations

- `saveSearch`: write search metadata + results; return id.
- `saveChatSession`: write session metadata + messages; return id.

## Query (Optional)

- `getSearch`: fetch saved search by id for `/results/:id`.

## Build Steps

1. Add tables in `schema.ts`.
2. Implement `searchTrials` action with shared fetch helpers.
3. Implement mutations in `sessions.ts` (or separate files).
4. (Optional) Implement `getSearch` query.

## QA Checklist

- `searchTrials` returns top 10 results, sorted by match score.
- Mutations store only non-PHI data.
- `getSearch` returns stored results without extra processing.

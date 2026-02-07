---
name: feature-ai-chat
overview: Plan the chat API route, prompts, and tool contract.
isProject: false
---

# Feature Plan: AI Chat

## Goals

- Provide chat UX that can call a search tool and render results.
- Keep prompts deterministic and aligned with clinical trial finder needs.
- Ensure tool contract is strict and validated.

## Scope

- Vercel AI SDK route for chat
- Zod schema for `searchTrials` tool
- System prompt and tool usage prompt
- Client `useChat` wiring to render tool results

## Files

- `frontend/src/api/chat.ts` or `frontend/src/routes/api/chat.ts`
- `frontend/src/lib/zodSchemas.ts`
- `frontend/src/lib/aiPrompts.ts`
- `frontend/src/components/Chat/ChatPanel.tsx`
- `frontend/src/components/Chat/TrialCardsFromChat.tsx`

## Tool Contract

- Tool name: `searchTrials`
- Inputs (required): `condition`, `age`, `location`
- Inputs (optional): `synonyms`, `medications`, `additionalInfo`
- Output: array of `TrialSummary`

## Runtime Flow

1. Client sends messages via `useChat`.
2. Server applies system prompt and registers tool definitions.
3. Model invokes `searchTrials` with validated args.
4. Tool handler calls `clinicalTrials.ts` and normalizes results.
5. Server returns tool result to client; UI renders trial cards.

## Error Handling

- Invalid tool args: return validation error, ask user to clarify.
- API timeout: return friendly message; do not retry automatically.
- No results: return empty array; UI shows `NoResults`.

## Build Steps

1. Add Zod schemas in `lib/zodSchemas.ts`.
2. Add system and tool prompts in `lib/aiPrompts.ts`.
3. Implement chat API route with model + tool registration.
4. Render tool output via `TrialCardsFromChat`.

## QA Checklist

- Tool validation rejects missing required fields.
- Tool call returns max 10 results.
- Chat UI renders tool output and handles empty/error states.

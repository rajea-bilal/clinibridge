---
name: feature-frontend-experience
overview: Plan frontend routes and UI for chat, form, and results experiences.
isProject: false
---

# Feature Plan: Frontend Experience

## Goals

- Provide two entry paths: chat and form.
- Render trial results consistently across both paths.
- Keep UI accessible, fast, and minimal; reuse shared components.

## Scope

- Routes: `/`, `/chat`, `/find`, optional `/results/:id`
- Components: `ChatPanel`, `MessageList`, `TrialCardsFromChat`, `TrialSearchForm`, `TrialCard`, `TrialResultsList`, `NoResults`, `Disclaimer`
- Client-side validation for form inputs

## Files

- `frontend/src/routes/chat.tsx`
- `frontend/src/routes/find.tsx`
- `frontend/src/routes/results.tsx` (optional)
- `frontend/src/components/Chat/ChatPanel.tsx`
- `frontend/src/components/Chat/MessageList.tsx`
- `frontend/src/components/Chat/TrialCardsFromChat.tsx`
- `frontend/src/components/Form/TrialSearchForm.tsx`
- `frontend/src/components/Trials/TrialCard.tsx`
- `frontend/src/components/Trials/TrialResultsList.tsx`
- `frontend/src/components/Trials/NoResults.tsx`
- `frontend/src/components/Shared/Disclaimer.tsx`
- `frontend/src/lib/types.ts`

## UI Behavior

- Landing page: two CTAs (Chat / Form).
- Chat page: `ChatPanel` includes message list, input, tool result rendering.
- Form page: `TrialSearchForm` submits to backend action; show results list below.
- Results view: optionally display saved results by id (read-only).
- Results list: show disclaimer, then cards; handle empty state.

## Data Contracts

- `TrialSummary` used by `TrialCard` and `TrialResultsList`.
- `TrialSearchInput` from form: condition, age, location, meds, additionalInfo.

## Error/Empty States

- Form validation errors: inline, non-blocking.
- API error: banner/toast with retry.
- No results: show `NoResults` with next steps.
- Always show `Disclaimer` on results screens.

## Build Steps

1. Add shared types (`TrialSummary`, `TrialSearchInput`) in `lib/types.ts`.
2. Implement `TrialCard` and `TrialResultsList` (with `Disclaimer`, `NoResults`).
3. Build `/chat` with `ChatPanel` + `MessageList`.
4. Build `/find` with `TrialSearchForm`.
5. (Optional) Add `/results/:id` view.

## QA Checklist

- Chat and form both render identical `TrialCard` layout.
- Disclaimer visible on results.
- Empty state appears on zero results.
- Form validation blocks invalid submit.

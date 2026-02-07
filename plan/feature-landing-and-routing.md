---
name: feature-landing-and-routing
overview: Plan landing page and route wiring between chat, form, and results.
isProject: false
---

# Feature Plan: Landing + Routing

## Goals

- Provide a simple entry point with clear CTAs.
- Wire TanStack Router paths for chat, form, and results.
- Keep routing minimal and predictable.

## Scope

- Landing page at `/`
- Route registration for `/chat`, `/find`, optional `/results/:id`
- Link between landing CTAs and routes

## Files

- `frontend/src/routes/index.tsx` (or router-equivalent)
- `frontend/src/routes/chat.tsx`
- `frontend/src/routes/find.tsx`
- `frontend/src/routes/results.tsx` (optional)

## UX Behavior

- Landing: two primary buttons for Chat and Form.
- Preserve query params if needed for handoff (optional).
- Results route displays saved search by id (read-only).

## Build Steps

1. Add/update route definitions in TanStack Router.
2. Implement landing page with two CTAs.
3. Ensure routes are reachable from nav or direct links.
4. (Optional) Add `/results/:id` route with loader.

## QA Checklist

- `/` shows both CTAs and routes correctly.
- `/chat` and `/find` render without errors.
- `/results/:id` loads saved search when enabled.

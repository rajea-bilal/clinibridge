---
name: code-review
description: Use when reviewing code changes, pull requests, or when asked to check code quality. Provides a review checklist tailored to this TanStack Start + Convex + React 19 monorepo.
allowed-tools: Read, Grep, Glob, Bash
---

# Code Review Checklist — CliniBridge

## 1. Type Safety

- [ ] No `any` types — use proper generics or `unknown` with type guards
- [ ] Convex validators match TypeScript types in schema
- [ ] Zod schemas (v4) validate all external input (API routes, form data)
- [ ] `noUncheckedIndexedAccess` is on — handle `undefined` from array/object access
- [ ] No non-null assertions (`!`) — use proper null checks

## 2. Convex Patterns

- [ ] All public functions have validators (`v.string()`, `v.object()`, etc.)
- [ ] Mutations don't call external APIs — use actions for side effects
- [ ] Queries are deterministic (no `Date.now()`, no randomness)
- [ ] Actions handle errors gracefully (Convex actions can't be retried)
- [ ] Database reads use indexes for performance (check schema.ts)
- [ ] No secrets in client-exposed code — secrets go in Convex env vars

## 3. React & Components

- [ ] React 19 patterns: `ref` as prop (no `forwardRef`), function components only
- [ ] Hook dependency arrays are correct and complete
- [ ] No components defined inside other components
- [ ] Keys in lists are stable (not array index)
- [ ] Loading/error states handled for async data
- [ ] `useQuery` / `useMutation` from Convex used correctly

## 4. TanStack Start / Routing

- [ ] Route files use `createFileRoute` pattern
- [ ] Data fetching in loaders, not in component body
- [ ] API routes handle errors with proper HTTP status codes
- [ ] Server functions don't leak server-only code to client bundle

## 5. AI / LLM Integration

- [ ] System prompts don't promise eligibility — only help understanding
- [ ] Structured output uses Zod schemas for validation
- [ ] LLM calls have retry logic and fallback behavior
- [ ] Token usage is reasonable (not sending entire HTML pages)
- [ ] API keys never appear in client-side code

## 6. Security

- [ ] No secrets in source code or client bundles
- [ ] User input sanitized before display (XSS via `dangerouslySetInnerHTML`)
- [ ] Auth checks on protected routes and Convex functions
- [ ] `rel="noopener"` on `target="_blank"` links
- [ ] CORS configured correctly for API routes

## 7. Performance

- [ ] No unnecessary re-renders (check memo boundaries)
- [ ] Images have width/height (prevents layout shift)
- [ ] Large dependencies not imported in client bundle unnecessarily
- [ ] Convex queries are granular (don't fetch entire tables)
- [ ] Three.js / Motion animations respect `prefers-reduced-motion`

## 8. Project Conventions

- [ ] Uses `bun` / `bunx` (never npm, npx, yarn)
- [ ] Path aliases: `@/` for src, `@root/` for repo root
- [ ] Component in feature folder with co-located files
- [ ] Follows dark theme + emerald accent design system
- [ ] New Convex functions have matching type exports

## Review Process

```bash
# Check for lint issues
bun run check

# Check types across monorepo
bun run check-types

# Check Convex types
cd packages/backend && bunx convex typecheck

# See what changed
git diff --stat
git diff --name-only
```

## Common Issues to Watch For

- Hardcoded ClinicalTrials.gov NCT IDs (should be dynamic)
- Missing error boundaries around AI-powered components
- Chat messages not persisted to localStorage/Convex
- Eligibility cache TTL not respected (7-day window)
- Form validation bypassed on the search page

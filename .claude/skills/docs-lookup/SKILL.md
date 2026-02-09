---
name: docs-lookup
description: Use when generating code that uses external libraries, APIs, or frameworks. Fetches current documentation via Context7 MCP instead of relying on training data. Activate for ANY code involving project dependencies.
allowed-tools: Read, Grep, Glob
---

# Documentation Lookup via Context7

## When to Activate

ALWAYS use this skill before writing code that involves any external library API.
Never guess at library-specific syntax — fetch docs first.

## Context7 Library IDs

These are the project's key dependencies. Use Context7's `resolve-library-id` tool
first, then `get-library-docs` with the resolved ID.

### Frontend (apps/web)

| Library | Search Term | Use For |
|---|---|---|
| TanStack Start | `tanstack-start` | SSR, routing, `createFileRoute`, loaders, server functions |
| TanStack Router | `tanstack-router` | Route definitions, navigation, params, search params |
| TanStack Form | `tanstack-react-form` | Form creation, validation, field binding |
| TanStack Query | `tanstack-react-query` | Cache, queries, mutations (used with Convex adapter) |
| React 19 | `react` | Hooks, ref-as-prop, use(), server components |
| Tailwind CSS 4 | `tailwindcss` | Utility classes, v4 config format, `@theme` |
| Radix UI | `radix-ui` | Primitives: Dialog, AlertDialog, Slider, Slot |
| Zod 4 | `zod` | Schema validation (v4 API — different from v3!) |
| Vercel AI SDK | `vercel-ai-sdk` | `useChat`, `streamText`, tool definitions |
| Motion | `motion` | Animations (formerly Framer Motion, now `motion` package) |
| React Three Fiber | `react-three-fiber` | 3D rendering, Canvas, mesh, drei helpers |
| Vaul | `vaul` | Drawer component (mobile bottom sheet) |
| Sonner | `sonner` | Toast notifications |
| Lucide React | `lucide-react` | Icon components |
| clsx + tailwind-merge | `clsx` | Class name merging (cn utility) |

### Backend (packages/backend)

| Library | Search Term | Use For |
|---|---|---|
| Convex | `convex` | Queries, mutations, actions, schema, validators |
| Better Auth | `better-auth` | Auth setup, session management, Convex adapter |
| OpenAI SDK | `openai` | Chat completions, structured output, function calling |
| AWS S3 SDK | `aws-sdk-s3` | Presigned URLs, object upload/download |
| Resend | `resend` | Transactional email sending |

## Lookup Process

1. **Resolve**: Use `mcp__context7__resolve-library-id` with the search term
2. **Fetch**: Use `mcp__context7__get-library-docs` with the resolved ID and a focused topic
3. **Apply**: Use the fetched docs to write correct, current API usage

### Example Flow

```
# Step 1: Resolve
resolve-library-id("tanstack-start")
→ Returns: /tanstack/router (or similar)

# Step 2: Fetch specific topic
get-library-docs(libraryId, topic="createFileRoute loader")
→ Returns: Current API docs for loaders

# Step 3: Write code using those docs
```

## Critical Libraries to ALWAYS Look Up

These libraries have frequent breaking changes or non-obvious APIs:
- **Zod 4** — v4 is significantly different from v3 (no `.parse()` on schemas, use `z.parse(schema, data)`)
- **TanStack Start** — Rapidly evolving, loader/action patterns change often
- **Tailwind CSS 4** — Config is completely different from v3 (CSS-based, not JS)
- **Vercel AI SDK v6** — Major changes from v3/v4, tool definitions differ
- **React 19** — `use()` hook, ref-as-prop, no forwardRef

## Fallback (Context7 Unavailable)

If Context7 is down or can't resolve a library:
1. Flag the code block with `// [Unverified API] — Context7 unavailable, verify against docs`
2. Use best available knowledge but be explicit about uncertainty
3. Provide the docs URL so the developer can verify manually:
   - TanStack: https://tanstack.com/start/latest
   - Convex: https://docs.convex.dev
   - Zod 4: https://zod.dev
   - Vercel AI: https://ai-sdk.dev
   - Tailwind 4: https://tailwindcss.com/docs
   - React 19: https://react.dev
   - Radix: https://www.radix-ui.com/primitives
   - Better Auth: https://www.better-auth.com

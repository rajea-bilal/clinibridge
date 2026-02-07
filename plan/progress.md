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
- [x] refinement-form-scoring-parity
- [x] redesign-landing-page
- [x] chat-ux-overhaul
- [x] chat-conversation-history

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

- Rewrote system prompt with explicit scoring instructions (age check, eligibility check, match labels, filter unlikely, limit to 4, concise output).
- Added `SCORING_PROMPT` and Zod schemas (`trialScoreSchema`, `scoringResponseSchema`) for structured AI scoring.
- Added second AI call (`generateObject`) inside the chat tool execute — scores trials against patient profile before returning them.
- Added `matchLabel`, `matchReason`, `eligibilityFull` fields to `TrialSummary` type, Convex schema, and all validators.
- Added color-coded match badges to `TrialCard`. Cards filter out "Unlikely" trials, sort by score, cap at 4 with "Show more".
- Tested: 12yo sickle cell patient in London → 9 raw trials filtered to 4 matches (3 Strong, 1 Possible).

### refinement-form-scoring-parity (completed)

- Form path (`/find`) was calling `fetchTrials()` directly from the browser — no scoring, no filtering, no badges.
- Extracted scoring logic into shared `scoreTrials()` utility (`lib/scoreTrials.ts`). Both paths now use it.
- Created `/api/search` server route — does fetch + score server-side (needs OpenAI key).
- Updated `find.tsx` to POST to `/api/search` instead of calling `fetchTrials` directly. Passes age, medications, additionalInfo.
- Updated `TrialResultsList` to filter/sort/cap identically to `TrialCardsFromChat`.
- Simplified `api/chat.ts` to use the same shared `scoreTrials()` function.
- Both paths now produce identical scored, filtered, badged results.

### redesign-landing-page (completed)

- Full cinematic landing page redesign adapted from an HTML+Tailwind reference into the existing React/TanStack codebase.
- Added Google Fonts (Bricolage Grotesque 300–700, Playfair Display 400–600) via preconnect + stylesheet links in `__root.tsx`.
- Added custom CSS keyframes and utilities to `index.css`: `cinematicEntrance`, `slideUpFade`, `shimmerMove`, `animationIn`, `spinReverse`, grain overlay (`.bg-grain`), scroll animation system (`.animate-on-scroll`), delay utilities.
- Created `apps/web/src/lib/useScrollAnimation.ts` — IntersectionObserver hook that triggers scroll-in animations once elements enter viewport.
- Created `apps/web/src/components/landing/navbar.tsx` — floating pill navigation with glassmorphism, HeartPulse logo, desktop nav links, search/menu buttons.
- Created `apps/web/src/components/landing/hero-section.tsx` — full-viewport cinematic hero with background image, staggered headline in Bricolage Grotesque, glassmorphism CTA card with shimmer overlay, two action buttons ("Get matches" → `/chat`, "I know the diagnosis" → `/find`), scroll indicator.
- Created `apps/web/src/components/landing/emerald-divider.tsx` — section divider with emerald pulsing dot and gradient lines.
- Created `apps/web/src/components/landing/featured-trials.tsx` — featured trials section with filter pill bar (All Studies / Oncology / Neurology), 12-column card grid with 3 image cards, grayscale→color hover effects.
- Rewrote `apps/web/src/components/landing/footer.tsx` — 4-column grid layout with CliniBridge branding, Platform/Company link columns, copyright bar.
- Rewrote `apps/web/src/routes/index.tsx` — composes Navbar, HeroSection, EmeraldDivider, FeaturedTrials, Footer with grain overlay.
- Zero functionality changes — `/chat` and `/find` navigation preserved, routing/auth/backend untouched, all lucide-react icons (no new deps).

### chat-ux-overhaul (completed)

- Replaced raw `<Input>` + `<form>` chat input with `prompt-kit` component system: `PromptInput`, `PromptInputTextarea`, `PromptInputActions`, `PromptInputAction`.
- Added `prompt-kit` component library under `apps/web/src/components/prompt-kit/` — `chat-container.tsx`, `loader.tsx`, `markdown.tsx`, `message.tsx`, `prompt-input.tsx`, `prompt-suggestion.tsx`, `scroll-button.tsx`.
- Added shadcn UI primitives: `avatar.tsx`, `textarea.tsx`, `tooltip.tsx` under `apps/web/src/components/ui/`.
- Replaced manual scroll-to-bottom with `ChatContainerRoot`/`ChatContainerContent`/`ChatContainerScrollAnchor` (backed by `use-stick-to-bottom` library) + floating `ScrollButton`.
- Replaced raw message divs with `Message`/`MessageAvatar`/`MessageContent` prompt-kit components. Assistant messages now render markdown via `react-markdown` + `remark-gfm` + `remark-breaks`.
- Added typing indicator: `Loader` component with `variant="typing"` shown during `status === "submitted"`.
- Made suggestion pills clickable via `PromptSuggestion` — clicking a suggestion now sends the message directly.
- Added new deps: `react-markdown`, `remark-gfm`, `remark-breaks`, `marked`, `use-stick-to-bottom`.

### chat-conversation-history (completed)

- Created `apps/web/src/lib/chatStorage.ts` — localStorage-based conversation persistence with `StoredConversation`/`ConversationMeta` types, CRUD API (`generateId`, `listConversations`, `getConversation`, `saveConversation`, `deleteConversation`, `clearAllConversations`), auto-derived titles from first user message, capped at 50 conversations.
- Created `apps/web/src/components/Chat/ChatSidebar.tsx` — sidebar drawer with conversation list, new-chat button, delete per conversation, relative timestamps ("Just now", "5m ago", "2h ago"), mobile overlay with backdrop, responsive (fixed overlay on mobile, inline on desktop).
- Updated `apps/web/src/routes/chat.tsx` — added sidebar toggle button in header, state management for `activeId`/`conversations`/`sidebarOpen`, auto-resumes most recent conversation on mount, `key={activeId}` on `ChatPanel` to force remount on conversation switch.
- Updated `ChatPanel` to accept `conversationId`, `initialMessages`, `onConversationUpdate` props. Passes `id` and `initialMessages` to `useChat`. Auto-persists to localStorage on message count changes and when streaming completes.

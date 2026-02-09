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
- [x] chat-ui-visual-refinement
- [x] trial-cards-visual-refinement
- [x] chat-persistence-bugfix
- [x] navbar-and-about-page
- [x] form-ui-visual-consistency
- [x] code-review-and-error-handling
- [x] refined-trial-search-logic
- [x] feature-understand-this-trial
- [x] bugfix-duplicate-chat-output
- [x] bugfix-eligibility-validation-and-ux

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

### chat-ui-visual-refinement (completed)

- Restyled entire chat UI to match the landing page's premium dark aesthetic — emerald accents, glass morphism, grain overlay, understated borders.
- **Sidebar**: Replaced flat `border-r border-white/10` with a custom CSS emerald glow border (`sidebar-glow-border` class using `::after` gradient line + `::before` radial bleed). Darkened surface to `bg-neutral-950/60 backdrop-blur-2xl`. Section headers use `font-mono text-[9px] uppercase tracking-[0.25em]` matching landing page patterns. Active conversation item has a gradient emerald accent bar (`from-emerald-400/60 via-emerald-500/40`). User footer uses gradient divider, mono typography for "Local Session" label.
- **Chat layout**: Tuned ambient glow blobs to be barely perceptible (`emerald-900/[0.04]`). Mobile nav and export button opacity dialled down.
- **Message bubbles**: Fixed zero-radius bug — theme's `--radius: 0rem` caused `rounded-lg` to render as rectangles. Added CSS overrides (`.chat-bubble-user`, `.chat-bubble-assistant`) with asymmetric rounding (iMessage-style). User bubble: glass pill with `hover:bg-white/[0.09]` micro-interaction. Assistant bubble: subtle glass with full prose typography control (`prose-p`, `prose-strong`, `prose-code`, `prose-a` with emerald tints). Text bumped to `text-[15px] font-light leading-relaxed` for readability.
- **Message entrance animation**: Added `messageSlideIn` keyframe (0.4s, blur-to-sharp + slide-up) via `.message-enter` class.
- **Avatars**: Replaced `MessageAvatar` wrapper with inline circles — assistant uses solar health icon with emerald tint + faint glow shadow, user shows "U" initial.
- **Atmospheric depth**: Added decorative layers behind message area — radial emerald gradient mesh, edge vignette, geometric grid pattern at `opacity-[0.015]`, diagonal emerald light streak.
- **Input area**: Bumped send button to `size-9 rounded-xl bg-white/90`. Actions bar padding increased to `px-5 pb-4` for better spacing. Focus glow tuned down.
- **CSS additions**: `animate-fade-in`, `message-enter`, `sidebar-glow-border`, `chat-bubble-user`, `chat-bubble-assistant`, `no-scrollbar` utilities.
- **Icon migration**: Switched chat components from lucide-react to `@iconify/react` (solar icon set) for sidebar, avatars, nav, and action buttons.
- Zero functionality changes — all `useChat`, message rendering, tool outputs, suggestion clicks, auto-scroll, keyboard submit preserved.

### trial-cards-visual-refinement (completed)

- **TrialCard.tsx**: Replaced shadcn `Card`/`CardHeader`/`CardContent` with raw glass morphism divs (`bg-white/[0.03] border-white/[0.05] rounded-2xl backdrop-blur-sm`). Added top accent line that shifts to emerald on hover. Hover micro-interactions: background brightens, border glows, faint emerald shadow appears, title goes full white, CTA arrow animates up-right. Badges and pills use `rounded-full` instead of `rounded-sm`. Metadata grid uses solar icons. Internal gradient divider.
- **TrialCardsFromChat.tsx**: Results header uses landing page pattern (mono uppercase + flanking emerald gradient lines). Staggered card entrance animation — each card enters with 80ms delay via `.trial-card-enter` CSS class. Show-more button restyled as glass button with emerald icon accent on hover. Error state uses consistent dark glass.
- **Disclaimer.tsx**: Restyled to dark glass theme — `amber-500/10` border, `amber-500/[0.03]` bg, solar icon, refined typography.
- **NoResults.tsx**: Dark glass card with solar search icon, refined text hierarchy.
- **CSS**: Added `trialCardEnter` keyframe (`translateY(12px) scale(0.98) blur(3px)` → clean, 0.5s) via `.trial-card-enter` class.

### chat-persistence-bugfix (completed)

- **Bug**: Clicking "New Session" lost the current conversation. The old ChatPanel unmounted (due to `key={activeId}` change) but React effects don't fire on unmount — only cleanup functions run. No cleanup was saving messages.
- **Fix 1**: Added save-on-unmount effect in `ChatPanel` using a `messagesRef` that always holds latest messages. Cleanup function calls `saveConversation(conversationId, messagesRef.current)` when unmounting.
- **Fix 2**: Added `useEffect([activeId])` in `chat.tsx` that calls `refreshConversations()` whenever activeId changes. Runs after the old ChatPanel's cleanup (React runs cleanup before new effects), so the sidebar picks up the just-saved conversation.
- **Fix 3**: `saveConversation` now deep-clones messages via `JSON.parse(JSON.stringify())` before storing, stripping any non-serializable proxies/getters from `useChat` internals.
- **Fix 4**: Added `try/catch` with `console.error` to both `writeStore` and `saveConversation` so failures are visible in the console instead of silently swallowed.
- **Fix 5**: Added `console.debug` logs in ChatPanel persist calls for debugging (`[ChatPanel] persisting`, `[ChatPanel] unmount save`).

### form-ui-visual-consistency (completed)

- Restyled the `/find` page and form components to match the premium dark aesthetic of the landing page and chat UI. Zero functionality changes.
- **`find.tsx` (page wrapper)**: Replaced generic `bg-background text-foreground` with `bg-neutral-950 text-neutral-50`, Inter font, `antialiased`, emerald selection color. Added grain overlay, ambient emerald/neutral glow blobs. Added atmospheric depth layers matching ChatPanel — radial emerald mesh, center vignette, geometric grid at `opacity-[0.015]`, diagonal light streak. Header restyled with CliniBridge logo + solar icons, `backdrop-blur-2xl`, `border-white/[0.05]`. Page intro uses emerald accent line, mono label, Bricolage Grotesque heading, staggered `animate-fade-in` entrance. Decorative centered-dot divider between intro and form.
- **`TrialSearchForm.tsx`**: Removed shadcn `<Input>`, `<Label>`, `<Button>` components (used CSS-variable tokens that clashed with the dark page). Inputs are now minimal bottom-border-only (`border-b border-white/[0.06]`, transparent bg) with whisper-quiet focus state (`border-white/[0.12]`, no rings). Labels use `font-mono text-[11px] uppercase tracking-[0.15em] text-white/70` matching chat section headers. Required asterisks use `text-emerald-400/50`. Errors use `text-red-400/60`. Submit button is an understated ghost button (`bg-white/[0.04] border-white/[0.05]`) with near-invisible emerald glow on hover matching the chat input focus pattern. Added footer disclaimer with flanking emerald gradient lines.
- **`TrialResultsList.tsx`**: Loading skeletons use `border-white/[0.05] bg-white/[0.02] rounded-2xl`. Error state uses `border-red-500/10 bg-red-500/[0.03]` glass. Results header uses mono-label pattern with emerald accent line. Trial cards wrapped with staggered `.trial-card-enter` animations. Show-more button is borderless, barely-there text. Removed shadcn `Button` import, switched to `@iconify/react` solar icons.
- **Icon migration**: Switched from lucide-react (`ArrowLeft`, `ClipboardList`, `Search`, `Loader2`) to `@iconify/react` solar icons across all form page components.

### navbar-and-about-page (completed)

- **Navbar**: Stripped down to three links — Search (`/chat`), Trials (`/#trials` scroll anchor), About (`/about`). Removed action buttons (search icon, hamburger). Logo wraps in `<Link to="/">`. Links visible on all screen sizes.
- **FeaturedTrials**: Changed section `id` from `"projects"` to `"trials"` for cleaner anchor linking from navbar.
- **About page** (`apps/web/src/routes/about.tsx`): New route at `/about` adapting the provided HTML reference into React + Tailwind matching the existing dark/emerald aesthetic.
  - Hero section with "The Problem" label, headline, subtitle.
  - Stats row — three individual cards with subtle top gradient accent lines, stat values in Bricolage Grotesque.
  - "The Gap" section with blockquote-style callout (left emerald border).
  - "The Solution" — vertical timeline with 4 steps, emerald dot connectors, hover interactions.
  - "Under the Hood" — prose section on AI matching.
  - "What's Next" — roadmap timeline with 6 items, color-coded phase tags (Now=emerald, Soon=amber, Later=neutral), inline labels next to titles.
  - CTA card with "Start Matching" white pill button matching the network section style.
  - Ambient glows matching chat UI (`emerald-900/[0.03]`, `neutral-800/[0.05]`), grain overlay, `slideUpFade` animations.
  - `useScrollAnimation()` hook for footer scroll-triggered animations.
  - `useEffect` to force `html`/`body` background to `#0a0a0a` (global CSS sets `bg-white` which bled through below footer).
- **Footer**: Changed `bg-black` to `bg-neutral-950` for seamless blending. Updated links — "About Us" → `/about`, added "Recruiting Now" → `/#trials`, removed dead "Careers" link. Attribution ("Built by Rajea Bilal — exploring how AI and thoughtful design can make clinical research accessible...") moved into the bottom bar, centered above copyright.

### code-review-and-error-handling (completed)

- **Comprehensive review** of all modified and new files from git status — checked TypeScript types, linting, formatting, and error/loading state patterns.
- **Files reviewed**: `TrialSearchForm.tsx`, `TrialResultsList.tsx`, `featured-trials.tsx`, `network-section.tsx`, `about.tsx`, `find.tsx`, `featuredTrials.ts`, `featuredTrialsCache.ts`, plus schema and supporting components.
- **TypeScript validation**: Ran `bunx convex typecheck` from `packages/backend` — all types valid, no errors.
- **Linting**: No linter errors found across all reviewed files.
- **Loading states**:
  - `TrialSearchForm`: Disabled button + "Searching..." text with pulsing emerald dot during `isLoading`.
  - `TrialResultsList`: Three staggered skeleton cards with `animate-pulse` + `animationDelay` during loading.
  - `FeaturedTrials`: Skeleton placeholders for phase badges, titles, and metadata while loading; always shows 3 cards (uses fallback data if API fails).
  - `NetworkSection`: Static content, no loading states needed.
  - `about.tsx`: Static page, no async operations.
  - `find.tsx`: Passes `isLoading` to form and results list; manages state properly.
- **Error states**:
  - `TrialResultsList`: Red glass card with helpful error message + "try again" copy.
  - `FeaturedTrials`: Silent fallback to hardcoded trials on API failure (logged to console); uses try-catch around fetch, cache reads, and cache writes.
  - `featuredTrials.ts`: Multiple fallback layers — cache check wrapped in try-catch, fetch wrapped in try-catch with timeout handling, padding to 3 cards if needed, cache upsert non-critical (wrapped in try-catch).
  - `featuredTrialsCache.ts`: Returns `null` on cache miss (no throw).
  - `find.tsx`: Catch block sets user-facing error message + clears trials on fetch failure.
  - All error boundaries use consistent dark glass styling (`border-red-500/10 bg-red-500/[0.03]`).
- **User feedback**:
  - Loading: Skeletons use realistic shapes + staggered delays for polish.
  - Error: Clear actionable messages ("Please try again or adjust your search criteria").
  - Empty state: `NoResults` component with helpful copy ("Try broadening your search...").
  - Success: Smooth fade-in animations with staggered delays per card.
- **API resilience**:
  - `featuredTrials.ts`: 12s timeout on ClinicalTrials.gov fetch, abortController cleanup, status code check, fallback data for empty responses, padding logic to always return 3 trials.
  - Cache layer with 1-hour TTL to reduce API load.
  - Non-blocking cache updates (failures don't break the user flow).
- **Convex schema**: `featuredTrialsCache` table properly indexed by `category`, validator matches TypeScript types exactly.
- **Code quality**: Clean separation of concerns, consistent naming, proper TypeScript annotations, no magic numbers (constants at top of files), proper cleanup in useEffect hooks.
- **Accessibility**: Proper ARIA labels on form inputs (`aria-invalid`), semantic HTML, keyboard navigation works, focus states visible.
- **No regressions**: All existing functionality preserved — chat, form search, trial cards, navigation, persistence all working as expected.

### refined-trial-search-logic (completed)

- **Status filter broadened**: Changed `filter.overallStatus` from just `RECRUITING` to `RECRUITING,NOT_YET_RECRUITING,ENROLLING_BY_INVITATION,ACTIVE_NOT_RECRUITING`. Rare diseases often have few purely "recruiting" trials — the broader filter captures all trials actively accepting or about to accept patients.
- **Location normalization**: Added `LOCATION_ALIASES` map in `clinicalTrials.ts` that expands common abbreviations (`US` → `United States`, `USA` → `United States`, `UK` → `United Kingdom`, `GB` → `United Kingdom`). The ClinicalTrials.gov API `query.locn` parameter does free-text matching, so abbreviations like "US" failed to match "United States" in trial location fields. Updated `normalizeLocation()` to apply the alias before querying.
- **Tool schema guidance**: Updated `searchTrialsToolSchema` location field description to instruct the AI model to always use full country names (e.g. "United States") instead of abbreviations — defense in depth alongside the server-side alias map.
- **Fallback search strategy**: Refactored `fetchTrials()` to use a new `runSearch()` helper and a 3-attempt fallback cascade: (1) full query with condition + synonyms + location, (2) primary condition + location only (drops synonyms that may narrow results), (3) primary condition only, worldwide (drops location filter). Returns the first non-empty result set. Each attempt is individually logged with its label for debugging.
- **Zod v4 compatibility fix**: Changed `z.record(z.unknown())` to `z.record(z.string(), z.unknown())` in `studiesResponseSchema`. Zod v4 requires explicit key+value validators. This was a latent bug — never triggered before because the API always returned 0 results due to the status/location issues above.
- **Verified**: Rett syndrome search now returns 10 active trials in the US (was 0). Includes gene therapy (NGN-401), Bionetide (NA-921), Trofinetide cognitive study, Rett Global Registry, and more.

### feature-understand-this-trial (completed)

**Goal:** On-demand, per-trial eligibility translation into plain English with a preparation checklist, without claiming eligibility.

#### Step 1 — Convex schema + cache table
- Added `eligibilityCache` table to `packages/backend/convex/schema.ts`
- Fields: `nctId`, `eligibilityCriteria`, `minimumAge`, `maximumAge`, `sex`, `healthyVolunteers`, `fetchedAt`
- Index: `by_nctId`
- Convex typecheck passes

#### Step 2 — Convex action to fetch + cache raw criteria
- Created `packages/backend/convex/eligibilityQueries.ts` — internal query (`getCachedEligibility`) + mutation (`upsertEligibilityCache`). Separated from action file because `"use node"` files can only contain actions.
- Created `packages/backend/convex/eligibility.ts` — public action `getEligibilityBreakdown`
- Fetches from `https://clinicaltrials.gov/api/v2/studies/{NCT_ID}` with 15s timeout
- Extracts `eligibilityModule` fields (criteria, age, sex, healthyVolunteers)
- Cache-first with 7-day TTL; upserts on miss
- Handles: no criteria, partial criteria, API errors (returns structured fallback)
- Added `zod` to backend package for response validation

#### Step 3 — LLM integration + Zod validation
- System prompt + user prompt match the plan exactly
- Zod schema validates: `trialId`, `disclaimer`, `inclusionCriteria[]`, `exclusionCriteria[]`, `preparationChecklist[]`, `meta`
- Each criterion: `original`, `plainEnglish`, `status` (met/not_met/unknown), `reason`
- Calls `gpt-4o-mini` with `response_format: { type: "json_object" }`
- On validation failure: retries once with "fix JSON" prompt
- On second failure: returns fallback with raw criteria text + checklist
- Parses raw eligibility into inclusion/exclusion sections before sending to LLM
- Trims input to ~8000 chars if needed

#### Step 4 — Frontend components
- Created `apps/web/src/components/Eligibility/` with:
  - `EligibilityDrawer.tsx` — Vaul drawer (mobile) / Radix Dialog (desktop), renders disclaimer → checklist → criteria
  - `CriteriaSection.tsx` — Collapsible section with title, count, and status summary (X met, Y to discuss, Z may not apply)
  - `CriteriaItem.tsx` — Status icon + pill (✅ met / ❓ to discuss / ❌ may not apply), plain English, reason
  - `EligibilitySkeleton.tsx` — Shimmer loading placeholder
  - `types.ts` — TypeScript interfaces mirroring the Convex action return type
  - `index.ts` — Barrel exports
- Installed: `vaul` (bottom sheet), `@radix-ui/react-dialog` (modal)

#### Step 5 — Wire UI to Convex action
- `TrialCard.tsx` — Added "Understand this trial" emerald CTA button, eligibility state, `useAction(api.eligibility.getEligibilityBreakdown)`, opens `EligibilityDrawer`. Caches result in component state (won't re-fetch same trial).
- `TrialResultsList.tsx` — Accepts + passes `patientProfile` to `TrialCard`
- `TrialCardsFromChat.tsx` — Extracts `patientProfile` from tool output, passes to `TrialCard`
- `MessageList.tsx` — Passes `patientProfile` from `searchTrials` tool output through to `TrialCardsFromChat`
- `find.tsx` — Captures form input as `PatientProfileForEligibility`, passes to `TrialResultsList`
- `results.$id.tsx` — Reconstructs `patientProfile` from saved search data
- Data flow: User clicks button → drawer/modal opens → skeleton → Convex action (cache → API → LLM → Zod) → render disclaimer → checklist → criteria

#### Step 6 — Polish
- Disclaimer always visible at top of breakdown (amber card matching app style)
- ❓ items labeled "Things to discuss with the coordinator"
- Copy tone: plain English suitable for a 16-year-old (LLM prompt enforces this)
- Mobile: bottom sheet drawer (85vh), criteria collapsed by default
- Desktop: centered modal (max-w-2xl, 85vh), inclusion criteria open by default
- Status pills: emerald (met), amber (to discuss), red (may not apply)
- Error state with retry suggestion
- No eligibility claims anywhere — only "helps you understand what the trial requires"

#### New files
- `packages/backend/convex/eligibility.ts`
- `packages/backend/convex/eligibilityQueries.ts`
- `apps/web/src/components/Eligibility/EligibilityDrawer.tsx`
- `apps/web/src/components/Eligibility/CriteriaSection.tsx`
- `apps/web/src/components/Eligibility/CriteriaItem.tsx`
- `apps/web/src/components/Eligibility/EligibilitySkeleton.tsx`
- `apps/web/src/components/Eligibility/types.ts`
- `apps/web/src/components/Eligibility/index.ts`

#### Modified files
- `packages/backend/convex/schema.ts` — added `eligibilityCache` table
- `apps/web/src/components/Trials/TrialCard.tsx` — added button + drawer + action call
- `apps/web/src/components/Trials/TrialResultsList.tsx` — passes `patientProfile`
- `apps/web/src/components/Chat/TrialCardsFromChat.tsx` — passes `patientProfile`
- `apps/web/src/components/Chat/MessageList.tsx` — extracts `patientProfile` from tool output
- `apps/web/src/routes/find.tsx` — captures `patientProfile` from form
- `apps/web/src/routes/results.$id.tsx` — reconstructs `patientProfile` from saved search

#### Packages added
- `vaul` (web) — bottom sheet drawer
- `@radix-ui/react-dialog` (web) — desktop modal
- `zod` (backend) — LLM response validation

### bugfix-duplicate-chat-output (completed)

- **Bug**: After the AI called `searchTrials` and received scored trials, the chat response duplicated trial summaries — first a "summary of ones that suit your profile" block, then a "please review the following details" block with the same trials.
- **Root cause**: `SYSTEM_PROMPT` in `aiPrompts.ts` had two instruction blocks that both told the AI to describe trials:
  1. "AFTER RECEIVING TRIAL RESULTS — SCORING" — instructed the chat AI to re-score every trial (age check, eligibility check, assign labels, filter, sort). Redundant because `scoreTrials()` already does this in a separate structured AI call.
  2. "RESPONSE FORMAT" — instructed the AI to output a formatted bullet list of the same trials.
  The model interpreted these as two sequential tasks → wrote trial descriptions twice.
- **Fix**: Replaced the scoring section with a note that trials come pre-scored (with `matchLabel` and `matchReason` already populated by `scoreTrials()`). Added explicit instruction: "Do NOT output multiple sections. Your entire response about the trials should be ONE block — summary sentence, bullet list, closing note. Nothing else."
- **File changed**: `apps/web/src/lib/aiPrompts.ts`

### bugfix-eligibility-validation-and-ux (completed)

- **Bug 1 — `ArgumentValidationError` on `healthyVolunteers`**: ClinicalTrials.gov API returns `healthyVolunteers` as a boolean (`true`/`false`), but the Convex schema and `upsertEligibilityCache` mutation expected `v.string()`. Caused the action to throw during cache write, hitting the catch block fallback with no raw criteria.
- **Fix**: In `fetchEligibilityFromApi()`, all fields that could come back as non-string types (`healthyVolunteers`, `minimumAge`, `maximumAge`, `sex`) are now coerced with `String()` before storing. Schema stays as `v.string()`.
- **Bug 2 — LLM response failing Zod validation**: The strict Zod schema rejected valid-but-slightly-different LLM outputs (e.g. `meta.notes: null`, missing `trialId`, casing variations like `"Not Met"` instead of `"not_met"`). Both attempts failed → fallback with raw criteria blob shown.
- **Fix**: Made Zod schema lenient:
  - `status` accepts any casing/spacing and normalizes (`"Not Met"` → `"not_met"`, `"Met"` → `"met"`, etc.)
  - `meta` fully optional with sensible defaults (source, criteriaPresent, notes)
  - `notes` accepts `string | null`, transforms null → `""`
  - All top-level fields have `.optional().default(...)` so partial responses still parse
  - `.passthrough()` allows extra keys; return block strips them for Convex validator
  - Added error logging to both catch blocks (logs Zod error message + raw response keys)
- **Bug 3 — No loading feedback**: User stared at empty drawer while the action ran (5-10s).
- **Fix**: Upgraded `EligibilitySkeleton` with a progress indicator showing rotating messages:
  - "Fetching eligibility criteria from ClinicalTrials.gov..."
  - "Translating medical language into plain English..."
  - "Comparing criteria against your profile..."
  - "Almost there — building your personalised breakdown..."
  Messages rotate every 3.5s with subtitle "This usually takes 5–10 seconds".
- **UX addition**: Added scroll hint between checklist and criteria sections — bouncing arrow + "Scroll for full eligibility criteria" text so users know there's more content below.
- **Files changed**:
  - `packages/backend/convex/eligibility.ts` — String coercion, lenient Zod schema, error logging, explicit return
  - `apps/web/src/components/Eligibility/EligibilitySkeleton.tsx` — Progress messages
  - `apps/web/src/components/Eligibility/EligibilityDrawer.tsx` — Scroll hint

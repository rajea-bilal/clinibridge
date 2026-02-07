---
name: bugs
overview: Tracks bugs discovered during implementation and testing.
isProject: false
---

# Bugs

## Open

- **OPENAI_API_KEY required**: Chat API needs `OPENAI_API_KEY` in `.env`. Not a code bug — config needed for deployment.
- **About page body bleed**: Global CSS sets `html, body { bg-white }`. Dark pages like `/about` show a white flash below the footer when content is short. Workaround: `useEffect` forces body bg to `#0a0a0a` on mount and cleans up on unmount. Proper fix: set body bg dark globally or per-route via a layout.
- **Footer invisible on non-landing pages**: Footer uses `animate-on-scroll` (starts at `opacity: 0`, paused). Only pages that call `useScrollAnimation()` trigger it. Added the hook to `/about` — any new page using `<Footer />` also needs it or the footer stays invisible.

## Refinements / Improvements

### Trial cards showed unfiltered results — scoring never reached the UI (fixed)

**Problem**: Raw trials from ClinicalTrials.gov were returned directly to the UI with no scoring. The AI's text might say "this doesn't fit your age" but the cards had no way to read that — `matchScore` was always 0, no badges, no filtering.

**Fix**: Added a second AI call (`generateObject`) inside the tool execute that scores each trial against the patient profile before returning. Cards now get real `matchLabel`, `matchScore`, and `matchReason` data.

### Form path (Path B) had no scoring at all (fixed)

**Problem**: The form search at `/find` called `fetchTrials()` directly from the browser — bypassing any server-side scoring. All 9+ raw trials showed up unfiltered with no badges, even though the chat path was scoring correctly.

**Fix**: Created a server API route (`/api/search`) that does fetch + score using the same shared `scoreTrials()` function as the chat path. Updated `find.tsx` to call this route. Updated `TrialResultsList` to filter out "Unlikely" trials, sort by score, and cap at 4 visible with "Show more". Both paths now use identical scoring.

### Chat messages lost on "New Session" click (fixed)

**Problem**: Clicking "New Session" in the sidebar caused the current conversation to disappear. The old `ChatPanel` was unmounted (via `key={activeId}` change) but React effects don't fire on unmount — only cleanup functions do. There was no cleanup function saving messages. Additionally, `handleNewChat` didn't refresh the sidebar conversation list.

**Root cause**: Two issues — (1) no save-on-unmount in ChatPanel, (2) sidebar state wasn't refreshed after switching active conversation.

**Fix**:
- Added a cleanup effect in `ChatPanel` that saves the current messages to localStorage when the component unmounts. Uses a `messagesRef` to capture latest messages (avoids stale closure).
- Added `useEffect([activeId])` in `chat.tsx` that refreshes the sidebar after every conversation switch. Runs after the old panel's cleanup, so the saved conversation appears immediately.
- `saveConversation` now deep-clones messages via `JSON.parse(JSON.stringify())` before storing — strips any non-serializable proxies or getters from `useChat` internals.
- Added `try/catch` with `console.error` to `writeStore` and `saveConversation` so failures show up in the console instead of failing silently.

### Chat bubbles rendered as sharp rectangles (fixed)

**Problem**: Message bubbles in the chat looked rigid and boxy — completely flat rectangles with no rounding. Visually jarring compared to the premium glass aesthetic of the rest of the UI.

**Root cause**: The theme sets `--radius: 0rem`. The prompt-kit `MessageContent` component uses `rounded-lg` which resolves to `calc(var(--radius))` = `0px`. Every bubble had zero border radius.

**Fix**: Added CSS overrides (`.chat-bubble-user`, `.chat-bubble-assistant`) with `!important` rounding — asymmetric corners (iMessage-style: three rounded, one sharp). Replaced `MessageContent` wrapper for user messages with raw div + custom class. Assistant messages keep `MessageContent` for markdown rendering but override all conflicting styles.

### Trial cards used generic shadcn styling (fixed)

**Problem**: Trial result cards used shadcn `Card` components with default theme tokens (`bg-card`, `border-border`, `rounded-xl`). The same `--radius: 0rem` issue meant zero rounding. Colors were generic grays, completely disconnected from the emerald/glass chat aesthetic.

**Fix**: Replaced `Card`/`CardHeader`/`CardContent` with raw divs using glass morphism (`bg-white/[0.03]`, `border-white/[0.05]`, `rounded-2xl`, `backdrop-blur-sm`). Added hover micro-interactions, emerald accents, solar icons, staggered entrance animations. Also restyled `Disclaimer.tsx` and `NoResults.tsx` to match.

## Closed

- **Convex query in Node.js file**: `searchTrials.ts` had `"use node"` at the top, which tells Convex the whole file runs in Node.js. But `getSearch` (a query) and `saveSearchInternal` (a mutation) can't run in Node — only actions can. Convex rejected the push with "Only actions can be defined in Node.js." Fix: moved the query and mutation into a new file `searchTrialsQueries.ts` without `"use node"`, kept only the action in the original file.

- **Vite crash from Alchemy plugin**: `vite.config.ts` had the `alchemy()` Cloudflare deployment plugin enabled, but it needs a wrangler config file that only exists after running `alchemy dev` or `alchemy deploy`. On a fresh clone it crashes instantly. Fix: commented out the `alchemy()` plugin — not needed for local dev.

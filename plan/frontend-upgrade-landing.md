# Landing Page Redesign — Transformation Plan

## Current State
- Landing page: `apps/web/src/routes/index.tsx` (simple hero + feature cards + CTAs)
- Landing components: `apps/web/src/components/landing/` (footer, section-divider, etc.)
- Styling: Tailwind CSS v4, CSS variables, dark mode via `.dark` class
- Icons: `lucide-react`
- Animations: `motion` library available
- Fonts: Inter + Geist Mono (no Bricolage Grotesque or Playfair Display yet)
- Router: TanStack Router (`createFileRoute`)

## Target State
Full cinematic landing page with: floating pill nav, hero with background image + glassmorphism CTA card, emerald divider, featured trials grid with filter tabs, redesigned footer. All using existing React/TanStack patterns.

---

## Step-by-Step Transformation

### Step 1 — Add Fonts (Bricolage Grotesque + Playfair Display)
**File:** `apps/web/src/routes/__root.tsx`
- Add Google Fonts `<link>` tags for `Bricolage Grotesque` (weights 300–700) and `Playfair Display` (weights 400–600, italic 400) in the `head()` config's `links` array.

**File:** `apps/web/src/index.css`
- Add `--font-bricolage` and `--font-serif` CSS variables pointing to the new font families.
- Add a utility class `.font-bricolage` via `@layer utilities` or inline style.

### Step 2 — Add Custom CSS Animations
**File:** `apps/web/src/index.css`
- Add the following `@keyframes`:
  - `cinematicEntrance` — scale 1.4→1, blur 20→0, grayscale 100→0%
  - `slideUpFade` — translateY(30)→0, opacity 0→1
  - `shimmerMove` — translateX(-150%) skewX(-20deg) → translateX(200%)
  - `animationIn` — translateY(30)→0, opacity 0→1, blur 8→0
  - `spinReverse` — rotate 360→0 (12s linear infinite)
- Add corresponding utility classes:
  - `.animate-cinematic`
  - `.animate-shimmer-effect`
  - `.animate-spin-slow-reverse`
- Add the grain overlay CSS (`.bg-grain` with SVG noise texture, `position: fixed`, `pointer-events: none`, `opacity: 0.04`)
- Add `.animate-on-scroll` base styles (opacity: 0, paused animation) — these will be driven by an IntersectionObserver hook.
- Add animation delay utilities: `.delay-100`, `.delay-200`, `.delay-300`, `.delay-400`

### Step 3 — Create `useScrollAnimation` Hook
**File:** `apps/web/src/lib/useScrollAnimation.ts` (new)
- Create a React hook using `IntersectionObserver` that adds an `.animate` class to elements with `.animate-on-scroll` when they enter the viewport.
- Options: threshold 0.1, rootMargin "0px 0px -5% 0px", observe once.
- Return a `ref` callback or accept a container ref.

### Step 4 — Create Reusable Landing Sub-Components
All new files go in `apps/web/src/components/landing/`.

#### 4a — `navbar.tsx` (Floating Pill Navigation)
- Fixed position, centered, `max-w-4xl`
- Logo icon (use `Heart` from lucide-react or a custom SVG) + "CliniBridge" text
- Nav links: Search, Trials, AI, Stories (hidden on mobile)
- Search + menu icon buttons
- Glassmorphism: `bg-neutral-900/60 border border-white/10 backdrop-blur-xl rounded-full`
- Entrance animation: `slideUpFade` with 0.2s delay

#### 4b — `hero-section.tsx`
- Full viewport height (`min-h-screen`), flexbox, `justify-end`
- Background: absolute-positioned `<img>` with `animate-cinematic` class + gradient overlays
- Left column (md:col-span-7): emerald accent line, subtitle, `<h1>` in Bricolage Grotesque (two lines, second at 60% opacity), description with emerald left border
- Right column (md:col-span-5): glassmorphism card with shimmer overlay containing:
  - Description text
  - "Get matches" button (emerald gradient border, DNA icon, links to `/chat`)
  - "I know the diagnosis" button (outline style, search icon, links to `/find`)
  - "No account needed. Privacy first." footer text
- Scroll indicator at bottom center
- All text blocks staggered with `slideUpFade` delays

#### 4c — `emerald-divider.tsx`
- Replaces existing `section-divider.tsx` style
- Horizontal line + centered emerald pulsing dot with glow shadow
- Gradient line from transparent → emerald → transparent

#### 4d — `featured-trials.tsx`
- Section with heading "Featured Trials." in Bricolage Grotesque
- Filter pill bar (All Studies / Oncology / Neurology) with active state toggle
- 12-column grid: large card (col-span-8) + two stacked cards (col-span-4)
- Each card: background image, gradient overlay, title, hover effects (grayscale→color, scale, reveal description)
- Filter logic as React state (`useState`) toggling card visibility with CSS transitions
- All cards use `animate-on-scroll` with staggered delays

#### 4e — Update `footer.tsx`
- 4-column grid layout: brand + description (col-span-2), Platform links, Company links
- Logo + "CliniBridge" branding in Bricolage Grotesque
- Bottom bar with copyright
- Uses `animate-on-scroll`

### Step 5 — Rewrite `routes/index.tsx`
**File:** `apps/web/src/routes/index.tsx`
- Import and compose: `Navbar`, `HeroSection`, `EmeraldDivider`, `FeaturedTrials`, `Footer`
- Wrap in `<div className="bg-neutral-950 text-neutral-50 overflow-x-hidden selection:bg-white/20">`
- Add grain overlay div
- Call `useScrollAnimation()` hook in a `useEffect`
- Keep `createFileRoute("/")` structure unchanged
- **DO NOT** change any routing logic, auth logic, or navigation destinations (`/chat`, `/find`)

### Step 6 — Icon Strategy
- Use `lucide-react` icons as replacements for Iconify:
  - `solar:health-bold-duotone` → `Heart` or `HeartPulse`
  - `solar:dna-linear` → `Dna`
  - `solar:magnifer-linear` → `Search`
  - `solar:arrow-right-linear` → `ArrowRight`
  - `solar:arrow-right-up-linear` → `ArrowUpRight`
  - `solar:menu-dots-square-linear` → `Menu` or `MoreHorizontal`
- No new icon dependencies needed.

### Step 7 — Image Assets
- The hero background and trial card images reference external Supabase URLs. For now, keep them as-is (external URLs). Optionally download to `public/assets/` later.
- Ensure `<img>` tags have proper `alt` text and `loading="lazy"` on below-fold images.

### Step 8 — Verify & Clean Up
- Remove unused landing components from `apps/web/src/components/landing/` that are no longer referenced (e.g., `features.tsx`, `testimonials.tsx`, `pricing.tsx`, `documentation.tsx`, `faq.tsx`, `tech-stack-badges.tsx`, `boilerplate-quiz.tsx`, `price-negotiator.tsx`, `production-calculator.tsx`) — **only if confirmed unused elsewhere**.
- Run `bun run typecheck` to ensure no TS errors.
- Test responsive behavior at mobile (375px), tablet (768px), desktop (1440px).
- Confirm `/chat` and `/find` navigation still works from CTA buttons.

---

## Files Modified
| File | Action |
|---|---|
| `apps/web/src/routes/__root.tsx` | Add font links |
| `apps/web/src/index.css` | Add animations, font vars, grain, scroll-anim CSS |
| `apps/web/src/routes/index.tsx` | Full rewrite (composition only) |
| `apps/web/src/components/landing/footer.tsx` | Rewrite layout |
| `apps/web/src/components/landing/section-divider.tsx` | Replace or keep alongside new divider |

## Files Created
| File | Purpose |
|---|---|
| `apps/web/src/lib/useScrollAnimation.ts` | IntersectionObserver hook for scroll animations |
| `apps/web/src/components/landing/navbar.tsx` | Floating pill navigation |
| `apps/web/src/components/landing/hero-section.tsx` | Cinematic hero with glassmorphism card |
| `apps/web/src/components/landing/emerald-divider.tsx` | Emerald accent divider |
| `apps/web/src/components/landing/featured-trials.tsx` | Trial cards grid with filter tabs |

## Constraints
- **ZERO functionality changes** — navigation targets, auth flow, routing, backend calls untouched
- **No new icon libraries** — map all Iconify icons to lucide-react equivalents
- **No Iconify runtime** — everything compiled at build time via React components
- **Keep TanStack Router pattern** — `createFileRoute("/")` stays identical
- **Tailwind CSS v4 only** — no tailwind.config.js (it uses CSS-based config)

---

## Prompt

```
You are transforming the CliniBridge landing page from a basic React page into a cinematic, dark-themed design. The HTML+Tailwind reference design is provided below. You must convert it into the existing React + TanStack Router + Tailwind CSS v4 codebase. 

CRITICAL RULES:
- TOUCH NO FUNCTIONALITY. Do not change routing, auth, navigation destinations (/chat, /find), backend calls, or any business logic.
- Use lucide-react icons ONLY (no Iconify). Map: Heart/HeartPulse for health icon, Dna for DNA, Search for magnifier, ArrowRight, ArrowUpRight, Menu/MoreHorizontal.
- Use the motion library (already installed) for animations where appropriate, but CSS @keyframes are fine for simpler effects.
- All new components go in apps/web/src/components/landing/.
- The landing route stays at apps/web/src/routes/index.tsx using createFileRoute("/").
- Tailwind CSS v4 — styles go in apps/web/src/index.css using @theme/@layer directives, NOT a tailwind.config.js.
- Use bun, never npm/npx/yarn.

STEP-BY-STEP:

1. FONTS: Add Google Fonts links for "Bricolage Grotesque" (300-700) and "Playfair Display" (400-600, italic) to the head() config in apps/web/src/routes/__root.tsx. Add CSS variable --font-bricolage and a .font-bricolage utility class in index.css.

2. CSS ANIMATIONS in index.css: Add @keyframes for cinematicEntrance (scale 1.4→1, blur 20→0, grayscale out), slideUpFade (translateY 30→0, opacity), shimmerMove (translateX with skew), animationIn (translateY + blur), spinReverse (360→0). Add utility classes .animate-cinematic, .animate-shimmer-effect, .animate-spin-slow-reverse. Add .bg-grain overlay (SVG noise, fixed, pointer-events none, opacity 0.04). Add .animate-on-scroll with paused state + .animate-on-scroll.animate with running state. Add delay utilities.

3. HOOK: Create apps/web/src/lib/useScrollAnimation.ts — a React hook using IntersectionObserver (threshold: 0.1, rootMargin: "0px 0px -5% 0px") that adds class "animate" to .animate-on-scroll elements once they enter viewport.

4. COMPONENTS — create these in apps/web/src/components/landing/:

   a) navbar.tsx — Fixed floating pill nav. Logo (Heart icon + "CliniBridge" in font-bricolage). Desktop nav links (Search, Trials, AI, Stories). Search + menu icon buttons. Glass: bg-neutral-900/60 border-white/10 backdrop-blur-xl rounded-full. slideUpFade entrance.

   b) hero-section.tsx — min-h-screen, flex justify-end. Background <img> with cinematic animation + gradient overlays. 12-col grid. Left (col-span-7): emerald accent, h1 in font-bricolage (7xl desktop), description with emerald left border. Right (col-span-5): glassmorphism card (bg-neutral-950/60 backdrop-blur-2xl border-white/10 rounded-2xl) with shimmer overlay, description text, two CTA buttons:
      - "Get matches" → links to /chat (emerald accent, Dna icon)
      - "I know the diagnosis" → links to /find (outline style, Search icon)
      - Footer text "No account needed. Privacy first."
   Scroll indicator at bottom.

   c) emerald-divider.tsx — Full-width divider with horizontal line, centered emerald pulsing dot with glow.

   d) featured-trials.tsx — Section heading "Featured Trials." in font-bricolage. Filter pill bar (All Studies, Oncology, Neurology) with useState for active filter. 12-col card grid: large card (col-span-8, 2 rows) + 2 stacked cards (col-span-4). Each card: bg image, gradient overlay, title, hover effects (grayscale→color, scale 105%, reveal description). Filter toggles card visibility with CSS transitions.

   e) Rewrite footer.tsx — 4-col grid: brand section (col-span-2) with Heart icon + "CliniBridge", description. Platform column (Search Trials, For Patients). Company column (About Us, Careers). Bottom copyright bar.

5. COMPOSE in routes/index.tsx: Import Navbar, HeroSection, EmeraldDivider, FeaturedTrials, Footer. Wrap in dark bg container. Add grain overlay div. Call useScrollAnimation in useEffect. Keep createFileRoute("/") unchanged.

6. IMAGES: Use the external Supabase URLs from the HTML reference for hero background and trial card images. Add alt text and loading="lazy" on below-fold images.

REFERENCE HTML (the complete design to adapt):
[The full HTML provided by the user — all sections: nav, hero, divider, featured trials, footer]

EXISTING FILES FOR CONTEXT:
- Current index.tsx uses createFileRoute("/") with LandingPage component
- __root.tsx has head() config for meta/links/scripts  
- index.css uses Tailwind v4 @theme directive with CSS variables
- Footer imports from @root/config
- lucide-react is the icon library (already installed)
- motion library is installed for animations
```

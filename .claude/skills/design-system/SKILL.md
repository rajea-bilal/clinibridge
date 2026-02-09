# Design System Skill

Use when creating or modifying UI, styling components, choosing colors/spacing/typography, or making any visual decisions.

## Tech Stack

- **CSS**: Tailwind CSS v4 (CSS-based config, no JS config file)
- **Components**: shadcn/ui (New York style) on Radix UI primitives
- **Icons**: `lucide-react` (primary), `@iconify/react` (secondary — Solar icon set)
- **Animation**: `motion/react` (Motion One), `tw-animate-css`, custom CSS keyframes
- **3D**: React Three Fiber (hero section only)
- **Utilities**: `cn()` from `clsx` + `tailwind-merge`

## Design Tokens

All tokens live in `@apps/web/src/index.css` inside the `@theme` block and `:root` / `.dark` selectors. **Never hardcode values — always use CSS variables or Tailwind classes.**

### Color System (OKLCH)

Semantic color variables (use via `bg-primary`, `text-muted-foreground`, etc.):
- `--background` / `--foreground` — page base
- `--card` / `--card-foreground` — card surfaces
- `--primary` / `--primary-foreground` — primary actions
- `--secondary` / `--secondary-foreground` — secondary surfaces
- `--muted` / `--muted-foreground` — subdued text/backgrounds
- `--accent` / `--accent-foreground` — highlights
- `--destructive` / `--destructive-foreground` — errors/danger
- `--border`, `--input`, `--ring` — form elements

**Emerald accent**: The brand accent is emerald, applied via raw values like `bg-emerald-500/20`, `text-emerald-400`, `border-emerald-500/30`. Used for glows, highlights, and interactive elements.

<!-- NOTE: The palette is monochrome grayscale + emerald accents. Do not introduce new hue families without explicit approval. -->

### Typography

Three font families — see `@theme` in @apps/web/src/index.css:
- `font-sans` → Inter (body text, UI)
- `font-bricolage` → Bricolage Grotesque (headings, display)
- `font-display` → Playfair Display (editorial, decorative)

Fluid hero text: `text-hero` = `clamp(2.25rem, 8vw, 8rem)` with `leading-[0.85]`

Custom tracking tokens: `tracking-tighter` through `tracking-widest` (relative calc values)

### Spacing & Radius

- Base spacing unit: `--spacing: 0.25rem` (Tailwind default scale)
- Border radius: `--radius: 0rem` (sharp corners by default)
- Derived: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`

### Shadows

All shadows are currently transparent/disabled. The design relies on border + glassmorphism instead.

## Visual Language

### Dark Cinematic Theme

The app is **dark-mode only** in practice (`<html class="dark">` set in `__root.tsx`). Background: `#010101` / `oklch(0.1448 0 0)`.

Key visual patterns:
1. **Grain overlay**: `.bg-grain` — fixed SVG noise texture at 4% opacity
2. **Ambient glows**: Fixed positioned divs with `bg-emerald-900/[0.04]` and large blur
3. **Glassmorphism**: `bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm`
4. **Gradient borders**: Emerald-tinted gradient borders (`.sidebar-glow-border`)

### Glassmorphism Recipe

```
bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-xl
```
or lighter:
```
bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm
```

## Layout Conventions

### Container Patterns

No global container component — each page defines its own:
- Content pages: `max-w-2xl mx-auto px-6` (find, results, chat content)
- About page: `max-w-[880px] mx-auto px-6`
- Wide layouts: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Landing: full-width sections, no max-width

### Page Wrapper Pattern

```tsx
<div className="min-h-screen bg-neutral-950 text-neutral-50 w-full overflow-x-hidden">
  <div className="bg-grain" />
  {/* Optional ambient glows */}
  <main className="relative z-10 mx-auto max-w-2xl px-6 py-12 md:py-16">
    {/* Content */}
  </main>
</div>
```

### Z-Index Layers

- `z-0` — backgrounds
- `z-10` — content
- `z-20` — fixed elements (navs, inputs)
- `z-50` — modals/drawers

## Responsive Design

**Mobile-first** using Tailwind defaults:
- `sm:` — 640px+
- `md:` — 768px+ (sidebar breakpoint, layout shifts)
- `lg:` — 1024px+ (grid expansions)
- `xl:` — 1280px+

Common responsive patterns:
- Text: `text-4xl sm:text-5xl md:text-[3.5rem]`
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Visibility: `hidden md:flex` (sidebar), `md:hidden` (mobile menu)
- Spacing: `px-6 md:px-12`, `py-12 md:py-16`

<!-- NOTE: A custom `useIsMobile()` hook exists in EligibilityDrawer for drawer/dialog switching at 768px -->

## Animations

### CSS Animations (defined in @apps/web/src/index.css)

- `cinematicEntrance` — scale + blur + grayscale entrance (3.5s)
- `slideUpFade` — slide up with fade (1s)
- `shimmerMove` — shimmer effect (3s infinite)
- `fadeIn` — simple fade (0.8s)
- `messageSlideIn` — chat message entrance (0.4s)
- `trialCardEnter` — staggered card entrance (0.5s)
- Delay utilities: `.anim-delay-100` through `.anim-delay-400`

### Motion (Framer Motion)

Use `motion/react` for:
- `AnimatePresence` for mount/unmount transitions
- `motion.div` for gesture-driven or complex animations
- Text scramble effects (see `hyper-text.tsx`)

Prefer CSS animations for simple transitions; use Motion for interactive/complex sequences.

## Reference Components

When building new UI, study these as patterns:

| Pattern | Component | Why |
|---|---|---|
| shadcn/ui primitive | @apps/web/src/components/ui/avatar.tsx | Radix wrapping, `cn()`, data attributes |
| Feature component | @apps/web/src/components/Trials/TrialCard.tsx | Glassmorphism, icons, loading states, responsive |
| Responsive modal | @apps/web/src/components/Eligibility/EligibilityDrawer.tsx | Drawer (mobile) vs Dialog (desktop), ARIA |
| Landing section | @apps/web/src/components/landing/hero-section.tsx | Full-width, ambient glows, cinematic entry |
| Chat UI | @apps/web/src/components/Chat/ChatPanel.tsx | State management, streaming, Convex integration |

## Quick Rules

1. **Never introduce new hue families** — monochrome + emerald only
2. **Always use `cn()` for className merging** — never string concatenation
3. **Use CSS variables** for semantic colors, not raw OKLCH/hex values
4. **Glassmorphism over shadows** — shadows are disabled by design
5. **Grain overlay** on all full-page views (`.bg-grain`)
6. **Sharp corners** by default (`--radius: 0rem`), round only when intentional
7. **Font pairing**: Inter for body, Bricolage Grotesque for headings, Playfair Display sparingly

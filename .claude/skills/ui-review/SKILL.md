# UI Review Skill

Use when reviewing components or pages for visual consistency, responsive behavior, accessibility, and performance.

## Visual Consistency Checklist

### Colors
- [ ] Only uses monochrome (neutral/gray) + emerald accents — no stray hue families
- [ ] Semantic colors via CSS variables (`text-foreground`, `bg-card`, etc.) — not raw OKLCH/hex
- [ ] Emerald accent used consistently (`emerald-400`/`emerald-500` range)
- [ ] Surfaces use glassmorphism (`bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm`)
- [ ] No shadows (disabled by design) — use borders and backdrop-blur instead

### Typography
- [ ] Body text uses `font-sans` (Inter) — default, no class needed
- [ ] Headings use `font-bricolage` (Bricolage Grotesque)
- [ ] Display/editorial text uses `font-display` (Playfair Display) sparingly
- [ ] Hero text uses `text-hero` for fluid sizing
- [ ] Tracking values use design tokens (`tracking-tight`, etc.)

### Spacing & Layout
- [ ] Consistent container pattern (`max-w-2xl mx-auto px-6` for content pages)
- [ ] Spacing uses Tailwind scale (multiples of 4: `p-4`, `gap-6`, `mb-8`)
- [ ] No arbitrary spacing values unless justified (prefer `gap-6` over `gap-[23px]`)
- [ ] Z-index follows convention: 0 bg, 10 content, 20 fixed, 50 modals
- [ ] Grain overlay present on full-page views (`.bg-grain`)

### Borders & Radius
- [ ] Sharp corners by default (`rounded-none` / `--radius: 0rem`)
- [ ] Rounded corners only when intentional (cards, pills, avatars)
- [ ] Border colors use `border-white/[0.05]` to `border-white/10` range

## Responsive Behavior

### Required Checks
- [ ] Mobile-first approach: base styles are mobile, breakpoints add desktop
- [ ] Content readable without horizontal scroll on 320px width
- [ ] Touch targets ≥ 44px on mobile
- [ ] Text doesn't overflow containers at any breakpoint
- [ ] Grid columns reduce on smaller screens (`lg:grid-cols-3 sm:grid-cols-2 grid-cols-1`)

### Breakpoint Usage
- [ ] `sm:` (640px) — minor adjustments, text size bumps
- [ ] `md:` (768px) — layout shifts, sidebar visibility, grid changes
- [ ] `lg:` (1024px) — wider grids, more columns
- [ ] `xl:` (1280px) — rarely needed, max-width expansions only
- [ ] No `2xl:` unless justified

### Common Responsive Patterns
- Sidebar: `hidden md:flex`
- Text scaling: `text-2xl sm:text-3xl md:text-4xl`
- Padding: `px-4 sm:px-6 lg:px-8`
- Mobile drawer / desktop dialog pattern (see `EligibilityDrawer`)

## Accessibility (UI-Specific)

### Focus & Interaction
- [ ] All interactive elements keyboard-accessible
- [ ] `focus-visible:ring-2` or equivalent focus indicator
- [ ] No focus traps outside modals
- [ ] Tab order follows visual order

### ARIA & Semantics
- [ ] Icon-only buttons have `aria-label`
- [ ] Modals/drawers use Radix primitives (built-in ARIA)
- [ ] Form inputs have associated labels
- [ ] Loading states announced (`aria-busy`, `aria-live`)
- [ ] Decorative images have empty `alt=""`

### Color & Contrast
- [ ] Text meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- [ ] `text-neutral-400` minimum on dark backgrounds (check `text-neutral-500` for insufficient contrast)
- [ ] Interactive states distinguishable without color alone
- [ ] Emerald accent text (`text-emerald-400`) only on dark backgrounds

### Motion
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No auto-playing animations that can't be paused
- [ ] Transitions under 400ms for UI interactions

## Performance

### Images
- [ ] Use `loading="lazy"` for below-fold images
- [ ] Appropriate image format (WebP/AVIF preferred)
- [ ] Width/height attributes or aspect-ratio set to prevent CLS

### Bundle Impact
- [ ] No large libraries imported for simple effects (e.g., don't use `motion/react` for a simple fade — use CSS)
- [ ] Icons imported individually (`import { Search } from "lucide-react"` not `import * as Icons`)
- [ ] Heavy components lazy-loaded if below-fold

### Rendering
- [ ] No unnecessary re-renders (stable callbacks, memoized expensive computations)
- [ ] Lists use `key` prop correctly (stable IDs, not array index for dynamic lists)
- [ ] Convex queries use specific args (avoid over-fetching)

## Anti-Patterns to Flag

| Anti-Pattern | Fix |
|---|---|
| Inline styles (`style={{}}`) | Use Tailwind classes |
| String concatenation for classes | Use `cn()` utility |
| `className="dark:..."` prefixes | Not needed — app is dark-only |
| Raw hex/rgb colors | Use CSS variables or Tailwind palette |
| `!important` in styles | Restructure specificity instead |
| `useEffect` for derived state | Compute during render |
| Hardcoded breakpoint values in JS | Use Tailwind responsive classes or `useIsMobile()` |
| `<div>` as clickable element | Use `<button>` or `<a>` |
| Missing loading state for async data | Add Skeleton or spinner |
| `forwardRef` usage | React 19 — pass `ref` as prop |
| Shadows on surfaces | Use glassmorphism pattern instead |
| `npm` / `npx` / `yarn` in scripts | Always use `bun` / `bunx` |

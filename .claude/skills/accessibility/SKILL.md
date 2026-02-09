---
name: accessibility
description: Use when creating or modifying React components, JSX, HTML elements, or UI code. Provides ARIA best practices and a11y guidelines for TanStack Start + React 19 + Radix UI.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# Accessibility Guidelines — CliniBridge

This project uses Radix UI primitives (via shadcn/ui) which handle most ARIA patterns.
Focus on these areas where manual a11y work is still needed.

## Interactive Elements

- Every `<button>` must have `type="button"` (or `type="submit"` in forms)
- Links (`<a>`) must have meaningful text content or `aria-label`
- Custom clickable elements need `role="button"`, `tabIndex={0}`, and keyboard handlers (`onKeyDown`/`onKeyUp`)
- Pair `onClick` with keyboard equivalents — never mouse-only interactions

## Images and Media

- All `<img>` must have `alt` text — descriptive for content images, `alt=""` for decorative
- Never use "image", "picture", or "photo" in alt text
- All `<img>` should have explicit `width` and `height` attributes
- SVGs need a `<title>` element for accessibility
- Audio/video elements need caption tracks

## Forms (TanStack Form)

- Every input must have an associated `<label>` with text content
- Use `aria-describedby` to link error messages to inputs
- Group related fields with `<fieldset>` and `<legend>`
- Use `aria-invalid="true"` on fields with validation errors
- Autocomplete attributes should use valid values

## Focus Management

- Never use positive `tabIndex` values (only `0` or `-1`)
- Modal/drawer focus must be trapped (Radix Dialog handles this)
- After dynamic content changes (chat messages, search results), manage focus announcements
- Skip-to-content link on pages with significant navigation

## Semantic HTML

- Use semantic elements over ARIA roles: `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`
- Headings must be hierarchical (h1 > h2 > h3) — never skip levels
- Heading elements must have accessible text content
- `<html>` must have a `lang` attribute
- `<iframe>` must have a `title` attribute

## Color and Motion

- This project uses a dark theme with emerald accents — maintain 4.5:1 contrast ratio for text
- Never convey information through color alone
- Respect `prefers-reduced-motion` — wrap Motion (Framer) animations:
  ```tsx
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ```
- Three.js hero animations (React Three Fiber) should degrade gracefully

## Project-Specific Patterns

- **Chat interface**: Messages need `role="log"` or `aria-live="polite"` for screen reader announcements
- **Trial cards**: Each card should be a semantic article with heading
- **Eligibility drawer** (Vaul): Uses Radix Dialog — ensure close button is keyboard accessible
- **Search results**: Announce result count changes with `aria-live="polite"`
- **Loading states**: Use `aria-busy="true"` on containers during data fetching

## Testing A11y

```bash
# Check for common a11y issues in components
bunx biome check --diagnostic-level=warn apps/web/src/components/
```

Radix primitives handle: focus trapping, escape-to-close, arrow key navigation, ARIA attributes on dialogs/dropdowns/tooltips. Don't re-implement these.

# Create New Component

Create a new React component following project conventions.

## Arguments

- `$ARGUMENTS` — Component name and brief description (e.g., "StatusBadge - displays trial status with color-coded indicator")

## Instructions

MANDATORY: Before writing any code, read and follow these skills:
1. Read @.claude/skills/design-system/SKILL.md — understand tokens, colors, layout
2. Read @.claude/skills/component-creation/SKILL.md — follow the step-by-step process
3. Read @.claude/skills/accessibility/SKILL.md — ensure a11y compliance

### Step 1 — Parse Arguments

Extract from `$ARGUMENTS`:
- **Component name** (PascalCase)
- **Description** of what it does
- **Type**: UI primitive, feature component, or landing section

### Step 2 — Plan

Before writing code, state:
1. Which folder it belongs in (`ui/`, `{Feature}/`, `landing/`, `Shared/`)
2. File name (kebab-case for ui/landing, PascalCase for features)
3. Props interface — what data/callbacks it needs
4. Which existing components to compose with (check @apps/web/src/components/)
5. Responsive considerations
6. Any data fetching needed (Convex queries/mutations)

### Step 3 — Create Component

Create the component file following the template from the component-creation skill:
- Props interface at top
- Named export (default only for routes/standalone sections)
- `cn()` for all className merging
- Accept `className` prop for composability
- Tailwind only — no inline styles
- Dark theme styling (monochrome + emerald accents, glassmorphism)
- Loading/error/empty states if it fetches data

### Step 4 — Add Barrel Export (if applicable)

If the component is in a feature folder with an `index.ts`, add the export there.

### Step 5 — Verify

1. Run `bun run check` to verify lint/format
2. Run `bun run check-types` to verify TypeScript
3. Confirm the component:
   - Uses `cn()` for class merging
   - Has proper TypeScript types
   - Handles all states (loading/error/empty if async)
   - Is responsive (mobile-first)
   - Follows accessibility baseline (semantic HTML, ARIA labels)

### Reference Components

Study these before creating your component:
- UI primitive pattern: @apps/web/src/components/ui/avatar.tsx
- Feature component pattern: @apps/web/src/components/Trials/TrialCard.tsx
- Feature module pattern: @apps/web/src/components/Eligibility/

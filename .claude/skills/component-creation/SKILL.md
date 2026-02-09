# Component Creation Skill

Use when creating new React components, adding UI features, or scaffolding component files.

## Step-by-Step Process

### 1. Determine Component Type

| Type | Location | Example |
|---|---|---|
| Shared UI primitive | `apps/web/src/components/ui/` | button, input, card |
| Feature component | `apps/web/src/components/{Feature}/` | ChatPanel, TrialCard |
| Landing section | `apps/web/src/components/landing/` | hero-section, faq |
| Shared utility | `apps/web/src/components/Shared/` | Disclaimer |
| Page/route | `apps/web/src/routes/` | find.tsx, chat.tsx |

### 2. File Naming

- **UI primitives**: `kebab-case.tsx` (e.g., `alert-dialog.tsx`, `custom-select.tsx`)
- **Feature components**: `PascalCase.tsx` (e.g., `ChatPanel.tsx`, `TrialCard.tsx`)
- **Landing sections**: `kebab-case.tsx` (e.g., `hero-section.tsx`, `featured-trials.tsx`)
- **Routes**: `kebab-case.tsx` or `$param.tsx` for dynamic segments
- **Types file**: `types.ts` in feature folder when types are shared across components
- **Barrel file**: `index.ts` for feature folders with 3+ components (see `Eligibility/index.ts`)

### 3. Props Interface Pattern

```tsx
// Primary pattern: interface with descriptive name
interface TrialCardProps {
  trial: TrialSummary;
  index?: number;
  onSelect?: (id: string) => void;
}

// Extending HTML attributes (for UI primitives)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
}

// Using React.ComponentProps (for Radix wrappers)
function Avatar({ ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
```

Rules:
- Prefer `interface` over `type` for component props
- Use `React.ComponentProps<typeof X>` when wrapping Radix primitives
- Optional props with `?` — never use `defaultProps`
- Destructure props in function signature

### 4. Component Structure Template

```tsx
import { cn } from "@/lib/utils";
// Other imports...

interface ComponentNameProps {
  // props
}

export function ComponentName({ prop1, prop2, className }: ComponentNameProps) {
  // Hooks first
  // Derived state
  // Event handlers
  // Early returns (loading, error, empty)

  return (
    <div className={cn("base-classes", className)}>
      {/* content */}
    </div>
  );
}
```

### 5. Styling Rules

- Always accept `className` prop and merge with `cn()`
- Use Tailwind classes — never inline styles
- Use CSS variables for semantic colors: `text-foreground`, `bg-card`, etc.
- Use emerald for accents: `text-emerald-400`, `bg-emerald-500/20`
- Apply glassmorphism for elevated surfaces (see design-system skill)
- Dark theme only — no need for light mode variants

### 6. State Management

| Need | Solution |
|---|---|
| Local UI state | `useState` / `useReducer` |
| Server data | `useQuery(api.module.queryName, { args })` from Convex |
| Mutations | `useMutation(api.module.mutationName)` from Convex |
| URL state | `Route.useSearch()` + Zod validation via TanStack Router |
| Navigation | `Route.useNavigate()` or `useNavigate()` from TanStack Router |
| Mobile detection | `useIsMobile()` custom hook (768px breakpoint) |

### 7. Export Pattern

- **Named exports** (preferred): `export function ComponentName() {}`
- **Default exports**: Only for route components and standalone page sections
- **Barrel exports**: `index.ts` re-exporting from feature folder

```ts
// Eligibility/index.ts
export { CriteriaItem } from "./CriteriaItem";
export { CriteriaSection } from "./CriteriaSection";
export { EligibilityDrawer } from "./EligibilityDrawer";
```

### 8. Icon Usage

```tsx
// Primary — lucide-react (most components)
import { Search, ChevronDown, X } from "lucide-react";

// Secondary — @iconify/react (when lucide lacks the icon)
import { Icon } from "@iconify/react";
<Icon icon="solar:heart-bold" className="size-5" />
```

### 9. Loading & Error States

Every component that fetches data should handle:
- **Loading**: Use `Skeleton` component or `animate-pulse` placeholders
- **Error**: Graceful fallback with retry option
- **Empty**: Meaningful empty state (see `NoResults.tsx`)

### 10. Accessibility Baseline

- Semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<section>`)
- `aria-label` on icon-only buttons
- Keyboard navigation support (Radix handles this for primitives)
- Focus-visible styles via Tailwind (`focus-visible:ring-2`)
- See @.claude/skills/accessibility/SKILL.md for full checklist

## Gold Standard Examples

### 1. UI Primitive — `avatar.tsx`

**File**: @apps/web/src/components/ui/avatar.tsx

Why it's a good example:
- Wraps Radix primitives cleanly
- Uses `React.ComponentProps` for prop typing
- `data-slot` attributes for styling hooks
- `cn()` for all class merging
- Multiple named sub-component exports

### 2. Feature Component — `TrialCard.tsx`

**File**: @apps/web/src/components/Trials/TrialCard.tsx

Why it's a good example:
- Clear `interface` props definition
- Glassmorphism styling pattern
- Loading/error/data states handled
- Responsive layout
- Uses both `lucide-react` and `@iconify/react` icons
- Composes with `EligibilityDrawer`

### 3. Feature Module — `Eligibility/`

**Directory**: @apps/web/src/components/Eligibility/

Why it's a good example:
- Feature folder with barrel exports (`index.ts`)
- Shared types file (`types.ts`)
- Responsive behavior (drawer on mobile, dialog on desktop)
- Loading skeleton component
- Clean separation: container (Drawer) vs presentational (CriteriaItem, CriteriaSection)

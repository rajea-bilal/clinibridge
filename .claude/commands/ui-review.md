# UI Review

Review a component or page for design system compliance, responsive behavior, and accessibility.

## Arguments

- `$ARGUMENTS` — File path or component name to review (e.g., "apps/web/src/components/Trials/TrialCard.tsx" or "the chat page")

## Instructions

MANDATORY: Before reviewing, read these skills:
1. Read @.claude/skills/ui-review/SKILL.md — the full review checklist
2. Read @.claude/skills/design-system/SKILL.md — the design tokens and conventions
3. Read @.claude/skills/accessibility/SKILL.md — a11y requirements

### Step 1 — Read the Target

Read the file(s) specified in `$ARGUMENTS`. If a page is named, find the route file in `apps/web/src/routes/` and all components it imports.

### Step 2 — Design System Compliance

Check against @.claude/skills/ui-review/SKILL.md:

**Report findings in this format:**

#### Colors & Surfaces
- ✅ / ❌ findings with specific line numbers

#### Typography
- ✅ / ❌ findings with specific line numbers

#### Spacing & Layout
- ✅ / ❌ findings with specific line numbers

#### Borders & Radius
- ✅ / ❌ findings with specific line numbers

### Step 3 — Responsive Behavior

- Check all breakpoint usage
- Verify mobile-first approach
- Flag any fixed widths that could overflow
- Check touch target sizes

### Step 4 — Accessibility

- Check semantic HTML usage
- Verify ARIA attributes
- Check keyboard navigation
- Verify color contrast (especially `text-neutral-500` and lighter on dark bg)
- Check focus indicators

### Step 5 — Performance

- Flag large imports
- Check for unnecessary re-renders
- Verify lazy loading for heavy content

### Step 6 — Anti-Patterns

Check for all anti-patterns listed in @.claude/skills/ui-review/SKILL.md and flag any found.

### Step 7 — Summary

Provide:
1. **Score**: X/10 for design system compliance
2. **Critical issues** that must be fixed
3. **Suggestions** for improvement
4. **Code fixes** — actual code changes, not just descriptions

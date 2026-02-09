---
description: Run and validate tests for a specific file or feature
argument-hint: file-or-feature (e.g. src/lib/scoreTrials.ts or "chat")
allowed-tools: Bash, Read, Write, Edit, Grep, Glob
---

Run and validate tests for: $ARGUMENTS

## Steps

1. **Find the target**: Locate the source file(s) matching `$ARGUMENTS`
2. **Find existing tests**: Look for `*.test.ts` or `*.test.tsx` files co-located with or related to the target
3. **If no tests exist**: Use the testing skill to create tests following project conventions
4. **Run tests**:

```bash
cd apps/web && bun vitest run --reporter=verbose $ARGUMENTS 2>&1
```

If Vitest isn't configured yet, follow the bootstrap steps in the testing skill.

5. **Report results**: Show pass/fail counts, any failures with context, and coverage gaps

## Guidelines

- Use @testing-library/react for component tests
- Mock Convex client, Vercel AI SDK, and fetch as needed
- Test user interactions with `userEvent`, not `fireEvent`
- Prioritize: utility functions > form validation > interactive components
- Don't test Radix primitives or generated files

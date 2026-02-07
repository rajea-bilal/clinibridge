# Bun Verify & Build Checklist

Use this command whenever you finish your changes so the workflow always matches our tooling expectations.

1. **Package manager** — Use `bun` for every install, script, or task. No `npm`/`pnpm`/`yarn`.
2. **Change verification** — Before running commands, review your diff and confirm only the intended files changed.
3. **Lint check** — Run the repo's lint step (or the relevant `bun run lint`/`bun run typecheck` command here) and clear every warning/error.
4. **Build** — Execute `bun run build` and confirm it succeeds without warnings that require action.
5. **Convex compilation** — Execute `bunx convex dev --once` and ensure there are zero schema/validator/runtime compilation issues.
6. **Re-verify** — After the commands pass, re-check `git status` to make sure no unexpected files changed during the process.

If any command fails, fix the issue immediately and rerun the checklist from the failing step onward.

---

## MDX File Guidelines

**CRITICAL: The `<` character in MDX files**

MDX interprets `<` as the start of a JSX component. This causes build errors like:
- `Unexpected character before name`
- `Unexpected end of file in name`

**Common mistakes:**
```mdx
❌ Cost reduced to <$1          → MDX sees "<$1" as a broken JSX tag
❌ <5 min response time         → MDX sees "<5" as a broken JSX tag  
❌ <2% error rate               → MDX sees "<2" as a broken JSX tag
❌ if (x < 10)                  → In inline code this is fine, but in prose it breaks
```

**Fixes:**
```mdx
✅ Cost reduced to under $1
✅ Under 5 min response time
✅ Less than 2% error rate
✅ `if (x < 10)`               → Wrap in backticks for code
✅ &lt;5 min                    → Use HTML entity (ugly but works)
```

**Rule:** When writing MDX content, NEVER use bare `<` followed by numbers or `$`. Always use:
- "under", "less than", "below" instead of `<`
- "over", "greater than", "above" instead of `>`
- Or wrap in backticks if it's code: `<5`

**Before committing any `.mdx` file**, search for `<[0-9]` and `<\$` patterns and fix them.

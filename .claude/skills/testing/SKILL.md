---
name: testing
description: Use when writing tests, creating test files, or asked about testing patterns. Provides testing conventions for this TanStack Start + Convex + React 19 codebase with Testing Library.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Testing Conventions — CliniBridge

## Setup

- **Test runner**: Not yet configured — use Vitest (compatible with Vite 7)
- **DOM testing**: @testing-library/react 16 + @testing-library/dom 10
- **Environment**: jsdom 26
- **Assertions**: Vitest built-in (`expect`)

## Bootstrap Vitest (if not configured)

```bash
cd apps/web
bun add -d vitest @vitejs/plugin-react
```

Add to `apps/web/package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `apps/web/vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

Create `apps/web/src/test-setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

## File Naming

- Test files: `*.test.ts` or `*.test.tsx`
- Co-locate with source: `components/Chat/ChatMessage.test.tsx`
- Shared test utils: `src/lib/test-utils.ts`

## Component Test Pattern

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TrialCard } from "./TrialCard";

describe("TrialCard", () => {
  const mockTrial = {
    nctId: "NCT00000001",
    briefTitle: "Test Trial",
    overallStatus: "RECRUITING",
    score: 85,
    matchLabel: "Strong" as const,
    matchReasons: ["Age match"],
  };

  it("renders trial title and score", () => {
    render(<TrialCard trial={mockTrial} />);
    expect(screen.getByText("Test Trial")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
  });

  it("calls onSelect when clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<TrialCard trial={mockTrial} onSelect={onSelect} />);
    await user.click(screen.getByRole("article"));
    expect(onSelect).toHaveBeenCalledWith("NCT00000001");
  });
});
```

## Testing Convex Functions

Convex functions run server-side. Test them with Convex's test helpers:

```ts
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "../convex/schema";

describe("searchTrials", () => {
  it("returns scored results", async () => {
    const t = convexTest(schema);
    // Use t.run() to test actions, t.query() for queries
  });
});
```

## Mocking Patterns

### Mock Convex client
```tsx
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn()),
  useAction: vi.fn(() => vi.fn()),
}));
```

### Mock Vercel AI SDK
```tsx
vi.mock("@ai-sdk/react", () => ({
  useChat: vi.fn(() => ({
    messages: [],
    input: "",
    handleSubmit: vi.fn(),
    handleInputChange: vi.fn(),
    isLoading: false,
  })),
}));
```

### Mock fetch (ClinicalTrials.gov API)
```ts
globalThis.fetch = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify({ studies: [] })))
);
```

## What to Test

### Priority (high → low)
1. **Utility functions** in `src/lib/` — pure logic, easy to test
2. **Zod schemas** in `zodSchemas.ts` — validate edge cases
3. **Components** with user interaction — chat input, search form, trial cards
4. **API routes** — mock fetch, verify request/response shape
5. **Convex functions** — use convex-test for queries/mutations

### Skip testing
- Radix UI primitives (already tested upstream)
- Pure CSS / layout-only components
- TanStack Router config
- Generated files (`_generated/`)

## Running Tests

```bash
cd apps/web
bun run test              # Run all tests
bun run test:watch        # Watch mode
bun vitest run src/lib/   # Run tests in specific directory
```

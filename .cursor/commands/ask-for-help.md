# Rule: Create Ask for Help Message

## Goal

To help developers create a comprehensive, well-structured help request by gathering all relevant context from the conversation history, codebase, and current issue.

## Process

1. **Analyze the conversation history** - Review all previous messages and context to understand what the developer has been working on
2. **Identify the problem** - Extract the core issue or question from the conversation
3. **Gather technical context** - Collect relevant code, errors, and technical details
4. **Suggest visual aids** - Recommend what screenshots or recordings would be helpful
5. **Format the request** - Structure everything into the standard help request format

## Help Request Format

Use this exact format when creating the help request:

```
Title of post = [Insert-question-or-generic-plea-for-help]

[Insert description of your problem]

[Add a screen recording link or images if applicable]

1) [insert-link-to-pr-for-your-repo] or mention which branch the issue is occurring on

2) Steps to reproduce the error/issue 

3) Any error logs that would be helpful to know about

4) Any other info that could be useful (browser, environment etc.)

5) Anything you've already tried (with results)
```

## Context Gathering

When creating the help request, gather and include:

### 1. Problem Description
- What is the user trying to accomplish?
- What's not working as expected?
- When did the issue start?
- Is it consistent or intermittent?

### 2. Code Context
- Relevant file paths and code snippets
- Recent changes made (from git history if available)
- Related components or functions
- Configuration files involved

### 3. Error Information
- Full error messages from console/logs
- Stack traces
- Network request failures
- Build/compilation errors

### 4. Environment Details
- Development vs Production
- Operating system
- Browser and version (if web-related)
- Node/bun version
- Package versions (check package.json)

### 5. Reproduction Steps
- Clear, numbered steps to reproduce
- Test data or conditions needed
- User actions that trigger the issue

### 6. Attempted Solutions
- What has already been tried
- Results of those attempts
- Related issues or documentation consulted

### 7. Visual Aids Recommendations

Suggest appropriate visual aids based on the issue:

**For UI/Browser Issues:**
- Screenshot of the error/issue
- Browser console errors (screenshot)
- Network tab showing failed requests
- **Recommended:** Jam.dev replay link for full context

**For Build/Compilation Issues:**
- Terminal output showing the error
- Build logs
- TypeScript/ESLint errors

**For Backend/API Issues:**
- Server logs
- Request/response payloads
- Database query results (if applicable)
- Convex function logs (use Convex MCP to gather)

**For Integration Issues:**
- Configuration files (redact secrets)
- Environment variable setup
- Third-party service responses

## Screenshot Guidelines

When recommending screenshots, advise:

- **MacBook:** Use `Command-Control-Shift-4` then drag to select an area for precise screenshots
- **Full screen errors:** Capture the entire error message and stack trace
- **Console logs:** Include the full console output, not just the error
- **Network requests:** Show request headers, payload, and response
- **Code snippets:** Highlight the relevant code section causing the issue

## Best Practices

- **Use Jam.dev:** Strongly recommend using [Jam.dev](https://jam.dev) for instant bug reports with automatic screen recording, console logs, network activity, and session replay
- **Be specific:** Include exact error messages, line numbers, and file paths
- **Include code:** Share relevant code snippets, but keep them focused
- **Check git history:** Review recent commits to identify what changed
- **Use Convex MCP:** For Convex-related issues, use MCP tools to gather database state, logs, and function specs
- **Check dependencies:** Reference package.json to include relevant library versions

## Output

Create a complete help request that includes:

1. **Clear title** - Summarizes the issue in one line
2. **Detailed problem description** - Explains what's happening and what's expected
3. **Visual aids section** - Lists recommended screenshots/recordings with specific guidance
4. **All 5 required sections** - Formatted exactly as specified:
   - PR/branch information
   - Reproduction steps
   - Error logs
   - Environment info
   - Attempted solutions

## Example Output Structure

```
Title of post = [TypeScript error: Cannot find module '@total-typescript/ts-reset']

I'm trying to add the @total-typescript/ts-reset package to improve TypeScript type inference, but I'm getting a module resolution error when importing it in my router.tsx file.

[RECOMMENDED SCREENSHOTS TO TAKE:]
1. Terminal showing the error when running `bun run dev`
2. Browser console errors (if any)
3. The router.tsx file showing the import statement (lines 1-5)
4. package.json showing the dependency is listed

[RECOMMENDED: Create a Jam.dev replay for full context]

1) Branch: main (no PR yet) - https://github.com/code-and-creed/yugen

2) Steps to reproduce the error/issue:
   - Run `bun add @total-typescript/ts-reset`
   - Add `import "@total-typescript/ts-reset";` at the top of apps/web/src/router.tsx
   - Run `bun run dev`
   - Error occurs during module resolution

3) Any error logs that would be helpful to know about:
   ```
   [Error message from terminal]
   ```

4) Any other info that could be useful:
   - Environment: Local development
   - OS: macOS 24.6.0
   - Package manager: bun 1.2.16
   - TypeScript version: 5.7.2
   - Framework: TanStack Start

5) Anything you've already tried:
   - Verified the package is in package.json ✓
   - Checked node_modules - package exists ✓
   - Tried clearing node_modules and reinstalling - same error
   - Checked tsconfig.json paths - no custom path mappings
```

## Special Instructions

- **Review conversation history:** Look back through all messages to understand the full context
- **Extract technical details:** Pull out all relevant code, errors, and configuration from the conversation
- **Suggest specific screenshots:** Don't just say "add screenshots" - specify exactly what to capture
- **Format consistently:** Follow the exact format provided above
- **Be thorough:** Include all relevant context, even if it seems obvious


# Rule: Debugging Issues

## Goal

To guide an AI assistant in debugging issues by analyzing problems thoroughly, identifying root causes, and proposing clean solutions.

## Process

1. **Receive Error Description:** The user provides an error description and relevant context
2. **Gather Context:** Collect all relevant debugging information (logs, screenshots, network requests, etc.)
3. **Analyze Root Causes:** Reflect on 5-7 different potential root causes
4. **Distill to Most Likely:** Narrow down to the 1-2 most likely sources of the issue
5. **Propose Solution:** Provide a simple and clean solution that fixes the bug without introducing messy code

## Required Context

When debugging, the user should provide maximum context. The more context provided, the better the agent can understand and fix the issue:

✅ **Jam.dev Replay** (Recommended) - Screen recordings with automatic console logs, network requests, and browser info  
✅ **Screenshots** - Show the error visually  
✅ **Server-side logs** - Backend errors, database queries, API responses  
✅ **Client-side logs** - Browser console errors and warnings (add console.log statements if missing)  
✅ **Network tab** - Failed requests, response payloads, status codes  
✅ **Code snippets** - Relevant file sections around the error  
✅ **Environment** - Dev vs production, OS, browser version  
✅ **Convex data** - Use Convex MCP server to inspect database state, run functions, and check logs directly from Cursor. For custom component tables (e.g., betterAuth, resend) that MCP can't access, use CLI: `bunx convex data --component <componentName> <tableName>` (dev) or `bunx convex data --component <componentName> <tableName> --prod` (production)

## Debugging Prompt Template

Use this template when debugging:

```
I'm getting this error: [DESCRIBE ERROR]

Jam.dev replay: [PASTE JAM.DEV LINK]
(Or if not using Jam.dev, attach the following:)

[Screenshot of error]

Server-side logs:
[Paste backend/API logs]

Client-side logs:
[Paste browser console errors]
(If console logs are missing, add console.log statements to trace the issue)

Network tab:
[Paste failed requests and responses]

Relevant code in @[filename]

Context:
- When/where it occurs: [DESCRIBE]
- Which users affected: [DESCRIBE]
- Started when: [DESCRIBE]
- What changed recently: [DESCRIBE]
- Environment: [Local dev / Production]

IMPORTANT: Use Convex MCP server to inspect database state and debug backend issues:
- Call `mcp_convex_status` to get available deployments
- Call `mcp_convex_tables` to list all tables and their schemas
- Call `mcp_convex_data` to read table data (supports dev and prod deployments)
- Call `mcp_convex_logs` to check recent function execution logs
- Call `mcp_convex_functionSpec` to see available functions and their validators
- Call `mcp_convex_run` to test functions with specific arguments

Example queries:
- "Show me the users table" → reads table data
- "Check the last 10 log entries from production" → inspects logs
- "Run the sendEmail mutation with these params" → tests function
- "What environment variables are set in dev?" → checks env config

**Note:** For custom component tables (e.g., betterAuth, resend) that the MCP server can't access, use the CLI fallback:
- Dev: `bunx convex data --component <componentName> <tableName>`
- Production: `bunx convex data --component <componentName> <tableName> --prod`
  - Example: `bunx convex data --component betterAuth user` to view the user table in the betterAuth component

Analyse the problem thoroughly and reflect on 5-7 different potential 
root causes. From those, distill it down to the 1-2 most likely sources. 
Propose a simple and clean solution that fixes the bug without introducing 
messy code.

Refer to my @package.json to check which libraries are in use - this 
will help ensure your solution aligns with existing dependencies.
```

## Analysis Approach

1. **Multiple Root Cause Analysis:** Consider 5-7 different potential root causes:
   - Configuration issues
   - Data state problems
   - Code logic errors
   - Integration/API issues
   - Environment-specific problems
   - Race conditions or timing issues
   - Dependency version conflicts

2. **Distillation:** From the 5-7 potential causes, identify the 1-2 most likely sources based on:
   - Evidence from logs and error messages
   - Recent changes that correlate with the issue
   - Common patterns in similar codebases
   - Data state inconsistencies

3. **Solution Design:** Propose a solution that:
   - Fixes the root cause, not just symptoms
   - Is simple and clean
   - Doesn't introduce messy code or workarounds
   - Aligns with existing dependencies (check @package.json)
   - Maintains consistency with codebase patterns

## Best Practices

- **Use Jam.dev:** Recommend using [Jam.dev](https://jam.dev) for instant bug reports with automatic screen recording, console logs, network activity, and session replay
- **MacBook Screenshots:** Use `Command-Control-Shift-4` then drag to select an area for precise screenshots
- **Convex MCP Server:** Always use Convex MCP to inspect database state, check logs, and test functions when debugging Convex-related issues
- **Research Documentation:** Use Context7 MCP or Firecrawl MCP (if available) to research how to implement solutions in the context of this codebase and tech stack
- **Check Dependencies:** Always refer to @package.json to ensure solutions align with existing library versions
- **Add Logging:** If console logs are missing, add console.log statements to trace the issue before asking for help

## Output

- Provide a clear root cause analysis
- Explain the 1-2 most likely sources of the issue
- Propose a clean, simple solution
- Reference relevant code files and dependencies
- Include any necessary code changes or fixes


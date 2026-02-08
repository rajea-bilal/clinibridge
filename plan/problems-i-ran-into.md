Problems I Ran Into
Overview

There were no hard blockers, but I found a few reliability issues that would show up under real user traffic.

Key Issues

No rate limiting: Every search/chat hits ClinicalTrials.gov and OpenAI. Without limits, users can spam requests and trigger upstream rate limits or failures.

Chat save collisions: Chat history was saving on every message update. If messages update quickly (especially during streaming), saves can overlap and overwrite each other.

Fragile localStorage restore: Stored chat data could be malformed or corrupted. Without validation, restoring chats can fail or crash the UI.

Debugging Approach

Audited the API routes that call ClinicalTrials.gov and OpenAI.

Followed the persistence path from ChatPanel → chatStorage to see when and how saves were triggered.

Inspected localStorage parsing to identify missing validation/guardrails.

Fixes Implemented

Rate limiting (/api/chat, /api/search): Put a cap on how many requests a user can send in a short time. If they exceed it, the API returns 429 (Too Many Requests) so the app can tell them to slow down.

Retry + backoff (ClinicalTrials.gov): If ClinicalTrials.gov fails temporarily, the app automatically tries again, waiting a bit longer between attempts. This reduces random failures. Applied in both the frontend and the Convex action.

Debounced chat saving: Instead of saving to localStorage on every tiny message update (which can overwrite changes), saving is delayed and consolidated into fewer writes. A final save still happens when the user leaves the page (unmount).

Runtime validation for stored chats: When loading conversations from localStorage, the app checks the data is the expected shape. If it’s corrupted or outdated, it safely ignores/fixes it instead of crashing.

AI scoring consistency checks: Verifies that the AI’s numeric score matches its label (e.g., “high/medium/low”) so you don’t show contradictory results.

Added short-term caching for ClinicalTrials.gov results to reduce duplicate calls.

Added scoring retries and a basic age-based fallback when structured scoring fails.

Persisted active chat session in the URL so refresh keeps the same conversation.

Trimmed and limited AI-generated synonyms to reduce hallucinated or noisy terms.

Sanitized eligibility text and improved missing-eligibility fallback copy.

Adjusted timeouts for location-filtered searches to reduce false timeouts.

Expanded medication scoring instructions in the AI prompt.
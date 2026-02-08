# Bug Analysis - CliniBridge

Comprehensive analysis of potential bugs across API integration, state management, and AI-specific issues.

---

## 1. API Integration Bugs

### 1.1 ClinicalTrials.gov API Rate Limits

**Current Implementation:**
```typescript
// apps/web/src/lib/clinicalTrials.ts
const TIMEOUT_MS = 15_000;
const PAGE_SIZE = 10;
```

**Issues:**
- ❌ **No rate limiting implementation** - Multiple rapid searches can trigger 429 errors from ClinicalTrials.gov
- ❌ **No exponential backoff** - Failed requests retry immediately without delay
- ❌ **No caching** - Identical searches re-fetch data even if recently fetched
- ⚠️ **Duplicate implementation** - Two separate fetch implementations (`clinicalTrials.ts` + Convex `searchTrials.ts`)

**Impact:**
- Users hitting ClinicalTrials.gov rate limits will see generic timeout errors
- No graceful degradation when API is slow/throttled
- Wasted API quota on duplicate queries

**Fixes Needed:**
1. Add rate limiter middleware (use `@convex-dev/rate-limiter` already installed)
2. Implement response caching with TTL (5-10 minutes for recruiting trials)
3. Add exponential backoff for retries (start at 1s, max 30s)
4. Consolidate duplicate fetch logic into single source

---

### 1.2 Malformed/Missing Eligibility Criteria

**Current Implementation:**
```typescript
// parseRawTrial() in clinicalTrials.ts
eligibilityCriteria: (eligModule?.eligibilityCriteria as string) ?? undefined,
```

**Issues:**
- ⚠️ **Weak validation** - Relies on type casting without schema validation
- ❌ **Missing field fallbacks** - Some trials have empty/null eligibility text
- ❌ **No structured parsing** - Eligibility criteria is free-text, no extraction of key requirements

**Examples of Real-World Issues:**
```
# Missing eligibility
- Trial NCT05XXX has eligibilityCriteria: null → displays "See full listing..."

# Malformed age ranges
- "18 Years and older" → correctly parsed
- "Adult" → not parsed, shows "Not specified"
- "Child, Adult, Older Adult" → not parsed

# Special characters
- Eligibility with \n\n bullets may render poorly in UI
```

**Fixes Needed:**
1. Add Zod schema validation for trial response structure
2. Provide explicit fallback text: "Eligibility criteria not available from ClinicalTrials.gov"
3. Handle special age format cases ("Adult", "Child", etc.)
4. Sanitize eligibility text for display (normalize whitespace, strip HTML entities)

---

### 1.3 Timeout Issues

**Current Implementation:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
```

**Issues:**
- ⚠️ **15s timeout may be too short** for complex queries with location filters
- ❌ **No retry logic** - Timeout = immediate failure
- ❌ **No partial results** - If 5 trials load before timeout, all are discarded

**Fixes Needed:**
1. Increase timeout to 25-30s for location-filtered queries
2. Implement retry with exponential backoff (2 retries max)
3. Consider streaming partial results if API supports pagination
4. Log timeout events to identify problematic query patterns

---

### 1.4 Response Format Changes

**Issues:**
- ❌ **No version pinning** - API endpoint is `v2` but no guarantee of schema stability
- ❌ **Silent failures** - If ClinicalTrials.gov changes field names, `parseRawTrial()` returns `null` without logging
- ❌ **No monitoring** - Can't detect if trials are being silently dropped

**Fixes Needed:**
1. Add response schema validation with Zod before parsing
2. Log warnings when trials are dropped due to missing fields
3. Add health check endpoint to monitor API schema compliance
4. Version lock API endpoint and monitor for deprecation notices

---

## 2. State Management Bugs

### 2.1 Chat Persistence Issues

**Current Implementation:**
```typescript
// chatStorage.ts
const STORAGE_KEY = "clinibridge-chats";
const MAX_CONVERSATIONS = 50;
```

**Issues:**
- ❌ **Race condition on rapid saves** - Multiple `saveConversation()` calls can overwrite each other
```typescript
// If two messages arrive quickly:
// 1. Read store → [msg1]
// 2. Read store → [msg1] (stale)
// 3. Write store → [msg1, msg2]
// 4. Write store → [msg1, msg3] ❌ msg2 lost
```

- ⚠️ **No error recovery** - If `localStorage.setItem()` throws (quota exceeded), conversation is lost
- ❌ **Deep clone on every save** - `JSON.parse(JSON.stringify(messages))` is expensive for long conversations
- ⚠️ **No version migration** - If storage schema changes, old conversations may break

**Fixes Needed:**
1. Add debouncing to persist calls (save after 500ms idle)
2. Wrap all localStorage operations in try-catch with fallback to in-memory storage
3. Implement incremental saves (only save new messages, not entire array)
4. Add storage version field + migration handler
5. Implement quota management (warn user if >80% full)

---

### 2.2 Session Management Across Refreshes

**Current Implementation:**
```typescript
// chat.tsx
const [activeId, setActiveId] = useState<string>(() => {
  const existing = listConversations();
  return existing.length > 0 ? existing[0].id : generateId();
});
```

**Issues:**
- ⚠️ **No URL persistence** - Refreshing page always loads most recent conversation, not current one
- ❌ **Lost streaming state** - Mid-stream refresh loses AI response in progress
- ❌ **No recovery** - If OpenAI call fails mid-stream, user must restart conversation

**Fixes Needed:**
1. Add conversation ID to URL search params
2. Store streaming state in sessionStorage (fallback on refresh)
3. Add "Resume" button if incomplete AI response detected
4. Implement optimistic UI updates (show user message immediately, roll back on error)

---

### 2.3 Flow Between Conversation → Search → Results

**Current Implementation:**
```typescript
// MessageList.tsx renders trials inline with messages
<TrialCard trial={trial} variant="chat" />
```

**Issues:**
- ❌ **No state for "expand trial details"** - User loses context when clicking trial links
- ⚠️ **Trials re-render on every message** - No memoization, causes layout shift
- ❌ **No "save search" functionality** - Can't bookmark or share trial results
- ⚠️ **Lost filters** - If AI returns 10 trials but user only wants Strong Matches, must re-ask

**Fixes Needed:**
1. Add trial detail modal (opens inline, preserves conversation context)
2. Memoize trial list with `useMemo(() => trials, [trials])`
3. Add "Save Search" → generates shareable link with filters
4. Add filter pills above trial list (Strong Match | Possible Match | All)

---

### 2.4 Chat History Corruption

**Issues:**
- ❌ **No validation on load** - Corrupted localStorage data crashes chat page
```typescript
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return [];
return JSON.parse(raw) as StoredConversation[]; // ❌ No schema check
```

- ⚠️ **Tool call results stored verbatim** - Large trial objects bloat storage
```json
{
  "role": "assistant",
  "parts": [
    { "type": "tool-result", "result": { "trials": [...1000 lines...] } }
  ]
}
```

**Fixes Needed:**
1. Validate storage schema on load with Zod
2. Add error boundary to catch corrupt data + offer "Clear All" button
3. Strip large tool results before saving (keep only trial IDs, not full objects)
4. Compress stored conversations with LZ-string or similar

---

## 3. AI-Specific Bugs

### 3.1 LLM Hallucinating Medical Terms

**Current System Prompt:**
```typescript
export const SYSTEM_PROMPT = `You are CliniBridge...
- Think of medical synonyms for the condition to broaden the search.
```

**Issues:**
- ❌ **Synonym hallucination** - AI invents non-existent synonyms
```
User: "My son has SCD"
AI: synonyms: ["Sickle Cell Disease", "Sicklemia", "Drepanocytosis", "HbS Disease", "FakeTerm123"]
                                                                                        ^^^^^ hallucinated
```

- ❌ **No medical ontology** - Synonyms aren't validated against UMLS/MeSH/SNOMED
- ⚠️ **Over-broad synonyms** - "lung cancer" → includes "bronchial carcinoma" + "small cell lung cancer" but misses NSCLC-specific trials

**Fixes Needed:**
1. **Remove synonym generation from AI** - Use curated medical synonym API instead:
   - Integrate UMLS API (free, NIH-hosted)
   - Or use pre-built mappings: https://github.com/clinicalml/omop-learn
2. Add validation step: log all AI-generated synonyms, flag unknown terms
3. Provide explicit synonym list in tool schema:
```typescript
synonyms: z.array(z.enum(["SCD", "Sickle Cell Disease", "HbSS", ...])).optional()
```

---

### 3.2 Inconsistent Structured Output

**Current Implementation:**
```typescript
// zodSchemas.ts
export const trialScoreSchema = z.object({
  nctId: z.string(),
  matchLabel: z.enum(["Strong Match", "Possible Match", "Worth Exploring", "Unlikely"]),
  matchScore: z.number().min(0).max(100),
  matchReason: z.string(),
});
```

**Issues:**
- ⚠️ **GPT-4o-mini sometimes omits fields** - Even with schema enforcement
```json
// Expected
{ "nctId": "NCT05XXX", "matchScore": 85, "matchLabel": "Strong Match", "matchReason": "..." }

// Sometimes get
{ "nctId": "NCT05XXX", "matchScore": 85, "matchLabel": null } ❌
```

- ❌ **No retry logic** - If structured output fails, trials shown unscored
- ⚠️ **Score-label mismatch** - AI returns `matchScore: 90` but `matchLabel: "Unlikely"`

**Fixes Needed:**
1. Add `refine()` to Zod schema to validate score-label alignment:
```typescript
.refine(s => {
  if (s.matchScore >= 80) return s.matchLabel === "Strong Match";
  if (s.matchScore >= 50) return s.matchLabel === "Possible Match";
  return true;
})
```
2. Implement retry with different temperature (0.0 → 0.3) if schema validation fails
3. Add fallback scoring: if AI fails, use rule-based age check + keyword matching
4. Log all malformed responses to detect patterns

---

### 3.3 Vague Patient Descriptions

**Current Prompt:**
```typescript
SYSTEM_PROMPT: "If the patient is vague about their condition, ask clarifying questions — never guess a diagnosis."
```

**Issues:**
- ⚠️ **AI sometimes searches anyway** - Doesn't always ask clarifying questions
```
User: "My son has breathing problems"
AI: [calls searchTrials with condition="breathing problems"] ❌
Should ask: "What diagnosis has he received?" or "Is it asthma, CF, or something else?"
```

- ❌ **No disambiguation for common terms** - "cancer", "heart disease", "diabetes" are too broad
- ⚠️ **Ignores negative context** - "NOT on medication" sometimes parsed as "on medication"

**Fixes Needed:**
1. Add pre-flight validation before tool call:
```typescript
if (condition.split(" ").length < 2 && !isKnownDisease(condition)) {
  return "Please provide more specific diagnosis..."
}
```
2. Add disambiguation prompt for common broad terms:
```typescript
const BROAD_TERMS = ["cancer", "diabetes", "heart disease", ...];
if (BROAD_TERMS.includes(condition)) {
  return "I found ${condition}. Can you specify the type? (e.g., Type 1 diabetes, lung cancer)"
}
```
3. Use RAG with disease taxonomy - query vector DB of disease names before searching

---

### 3.4 Age Parsing Failures

**Issues:**
- ❌ **Age range parsing is fragile** - Many edge cases not handled
```typescript
// Works
"18 Years - 65 Years" → 18-65 ✓

// Fails
"Adult (18-65)"       → "Not specified" ❌
"18 to 65 years"      → "Not specified" ❌
"18+"                 → "18 Years+" ✓ (but not parsed by AI)
"Older Adult (≥65)"   → "Not specified" ❌
```

**Fixes Needed:**
1. Normalize age ranges server-side before sending to AI:
```typescript
function normalizeAge(raw: string): { min?: number, max?: number } {
  // "Adult" → { min: 18, max: 64 }
  // "18 to 65 years" → { min: 18, max: 65 }
  // etc.
}
```
2. Pass numeric age bounds to AI instead of raw strings
3. Add unit tests for all observed age format variations

---

### 3.5 Medication Exclusion Logic

**Issues:**
- ❌ **AI misinterprets "requires prior medication failure"** - Treats it as exclusion
```
Trial: "Must have failed at least one prior therapy including hydroxyurea"
Patient: "Currently on hydroxyurea"
AI: "Unlikely - patient is on hydroxyurea which trial excludes" ❌
Should be: "Possible Match - patient meets prior treatment requirement"
```

- ⚠️ **Doesn't recognize drug classes** - "on ibuprofen" ≠ "NSAIDs excluded"

**Fixes Needed:**
1. Improve scoring prompt with medication examples:
```typescript
SCORING_PROMPT: `
Medication checks:
- "Failed prior X" = GOOD if patient was/is on X
- "Excluded: NSAIDs" = BAD if patient on ibuprofen/naproxen/aspirin
- Check drug classes, not just exact names
`
```
2. Pre-process medications with drug class lookup (RxNorm API)
3. Add explicit "medication eligibility" field in scoring output

---

## 4. Cross-Cutting Issues

### 4.1 Error Reporting

**Issues:**
- ❌ **Generic error messages** - User sees "Unable to reach ClinicalTrials.gov" for all failures
- ❌ **No error logging** - Can't diagnose production issues
- ❌ **Silent AI failures** - If scoring fails, trials shown with `matchScore: 0` and no label

**Fixes Needed:**
1. Add structured logging (Sentry/LogRocket)
2. Create specific error messages:
   - "ClinicalTrials.gov is slow - trying again..."
   - "OpenAI API is unavailable - showing unscored results"
   - "Your search returned no trials - try broadening location"
3. Add "Report Issue" button on error screens

---

### 4.2 Race Conditions

**Issues:**
- ❌ **Chat panel + sidebar updates conflict** - Can cause stale UI
```typescript
// chat.tsx
useEffect(() => {
  refreshConversations(); // Reads from localStorage
}, [activeId]);

// ChatPanel.tsx (same time)
useEffect(() => {
  saveConversation(id, messages); // Writes to localStorage
}, [messages]);
```

**Fixes Needed:**
1. Use single source of truth (React Context or Zustand)
2. Add optimistic UI updates (don't wait for save to complete)
3. Implement event bus for cross-component coordination

---

## 5. Priority Matrix

| Bug | Severity | Frequency | Fix Effort | Priority |
|-----|----------|-----------|------------|----------|
| Rate limiting (1.1) | High | Medium | Medium | **P0** |
| Chat persistence race (2.1) | Medium | High | Medium | **P0** |
| LLM synonym hallucination (3.1) | High | Low | High | **P1** |
| Malformed eligibility (1.2) | Low | High | Low | **P1** |
| Inconsistent AI output (3.2) | Medium | Medium | Medium | **P1** |
| Session recovery (2.2) | Medium | Low | High | **P2** |
| Age parsing (3.4) | Low | Medium | Low | **P2** |
| Medication logic (3.5) | Medium | Low | Medium | **P2** |
| Timeout issues (1.3) | Low | Low | Low | **P3** |

---

## 6. Recommended Action Plan

### Phase 1 (P0 - Critical)
1. Implement API rate limiting with `@convex-dev/rate-limiter`
2. Add debounced saves to fix chat persistence race conditions
3. Wrap all localStorage ops in try-catch

### Phase 2 (P1 - High)
1. Replace AI synonym generation with UMLS API integration
2. Add Zod validation for trial response schema + scoring output
3. Implement retry logic for AI calls

### Phase 3 (P2 - Medium)
1. Add URL persistence for active conversation
2. Normalize age ranges before sending to AI
3. Improve medication eligibility prompt

### Phase 4 (P3 - Low)
1. Add response caching with TTL
2. Implement exponential backoff for retries
3. Add structured logging

---

## 7. Testing Recommendations

### Integration Tests
- Mock ClinicalTrials.gov with various failure modes (timeout, 429, malformed response)
- Test localStorage quota exceeded scenario
- Test rapid chat message saves (race condition)

### AI Prompt Tests
- Collect 50+ real patient descriptions → ensure no hallucinated synonyms
- Test age parsing with all observed formats
- Verify medication exclusion logic with 20+ examples

### Load Tests
- Simulate 100 concurrent searches → verify rate limiting works
- Fill localStorage to 90% capacity → ensure graceful degradation

---

## Conclusion

Most critical bugs are in **API integration** (rate limits, timeouts) and **state management** (race conditions, corruption). AI bugs are concerning but less frequent.

**Highest ROI fixes:**
1. Rate limiting (prevents API quota issues)
2. Chat persistence debouncing (improves reliability)
3. Error validation (catches issues early)

**Quick wins:**
- Add Zod schemas everywhere
- Wrap localStorage in try-catch
- Log all AI synonym outputs for review

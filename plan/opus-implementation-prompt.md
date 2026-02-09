# Implementation Task: "Understand This Trial" Feature

## Instructions

You are implementing Feature 1 of CliniBridge — an "Understand This Trial" eligibility criteria translation feature. You have a detailed technical plan below. Follow it step-by-step in the exact order specified.

## Rules

1. **Follow the plan's implementation order exactly.** Do not skip ahead or combine steps. Complete each step, verify it works, then move to the next.
2. **Do not modify existing functionality.** The current trial matching, chat, and scoring must continue working. You are extending, not refactoring.
3. **Ask me before making architectural decisions not covered in the plan.** If something is ambiguous, ask — don't assume.
4. **Test each step with NCT05898620** (Rett syndrome, recruiting) before moving on.
5. **No file uploads. No eligibility claims.** The app translates and explains criteria — it never confirms or denies eligibility. The disclaimer must always be visible.
6. **Use the existing patientProfile from tool result + form input state** for the profile passthrough. Do not parse chat messages.
7. **Keep eligibility AI output in React component state only** — do not persist it to localStorage. The Convex-side raw criteria cache (eligibilityCache table) handles re-fetch prevention.

## Before You Start

Before writing any code, do these three things:
1. Read the full technical plan below.
2. Explore the current codebase structure — understand where trial cards are rendered, how the chat tool results work, where the AI scoring happens, and how the Convex schema is structured.
3. Tell me your understanding of the current architecture and confirm the implementation order. Then start Step 1.

## Implementation Steps (from technical plan)

### Step 1 — Convex schema + cache table (30-40 min)
- Add `eligibilityCache` table with: `nctId`, `eligibilityCriteria`, `minimumAge`, `maximumAge`, `sex`, `healthyVolunteers`, `fetchedAt`
- Add index on `nctId`
- **Done when:** Schema deploy passes and table is available

### Step 2 — Convex action to fetch + cache raw criteria (45-60 min)
- Add `getEligibilityRaw(nctId)` helper
- Fetch from `https://clinicaltrials.gov/api/v2/studies/{NCT_ID}`
- Extract eligibilityModule fields
- Cache in eligibilityCache table
- Check cache first, fetch only if missing or stale (7 day TTL)
- Handle: no criteria, partial criteria, API errors
- **Done when:** Action returns raw criteria for NCT05898620

### Step 3 — LLM integration + Zod validation (60-75 min)
- Add the system prompt and user prompt exactly as specified in the plan
- Build Zod schema matching the expected JSON output
- Call gpt-4o-mini with raw criteria + patient profile
- Validate response with Zod
- If validation fails: retry once with a "fix JSON" prompt
- If still fails: return fallback with raw criteria text (NOT empty lists) and message "We couldn't process these criteria automatically — here's the original text from ClinicalTrials.gov"
- **Done when:** Action returns valid structured response for NCT05898620

### Step 4 — Frontend components (45-60 min)
- Build: EligibilityDrawer/Modal, CriteriaSection, CriteriaItem, EligibilitySkeleton
- Drawer on mobile, modal on desktop
- Disclaimer at top, preparation checklist next, then expandable criteria sections
- Status indicators: ✅ "You meet this" / ❓ "To discuss" / ❌ "May not apply"
- Criteria sections collapsed by default on mobile
- **Done when:** Components render correctly with mocked data

### Step 5 — Wire UI to Convex action (45-60 min)
- Add "Understand this trial" button to TrialCard
- On click: open drawer/modal, call Convex action, show skeleton loading
- Pass patientProfile from existing tool result + form state
- Render real response data
- Handle loading, error, and empty states
- **Done when:** Full end-to-end flow works for NCT05898620

### Step 6 — Polish (20-30 min)
- Verify disclaimer is always visible
- Label ❓ items as "Things to discuss with the coordinator"
- Verify copy tone is encouraging, not clinical
- Test mobile layout
- **Done when:** Feature is demo-ready

## Technical Plan


# Feature 1 Technical Plan — Understand This Trial

Goal: on-demand, per-trial eligibility translation into plain English with a preparation checklist, without claiming eligibility.

---

## 1) Architecture Decisions

### Where does the eligibility criteria fetch happen?
- **Server-side (Convex action)** to avoid CORS issues, keep API logic centralized, and enable caching. ClinicalTrials.gov is public, but server-side keeps a single flow for rate limiting and caching.

### Where does AI processing happen?
- **Convex action** using OpenAI `gpt-4o-mini` (same model as current scoring). This keeps keys on the server and matches current architecture (AI scoring uses server-side calls).

### Caching strategy
- **Raw eligibility text cache in Convex** keyed by `nctId`.
- Store: `nctId`, `eligibilityCriteria`, `minimumAge`, `maximumAge`, `sex`, `healthyVolunteers`, `fetchedAt`.
- TTL target: **7 days** (hackathon-friendly, reduces repeated API hits).
- **Client-side per-session cache** for AI output (keyed by `nctId` + profile hash). This avoids storing patient profile server-side while preventing repeated LLM calls in the same session.

### End-to-end data flow
1. User taps **“Understand this trial”** on a trial card.
2. UI opens a drawer/modal and requests eligibility breakdown.
3. Frontend calls Convex action `getEligibilityBreakdown(nctId, patientProfile)`.
4. Convex action:
   - Checks `eligibilityCache` table for fresh raw criteria.
   - If missing/stale, fetches `https://clinicaltrials.gov/api/v2/studies/{NCT_ID}` and stores raw eligibility.
   - Sends raw criteria + patient profile to LLM with strict JSON schema.
   - Validates response and returns structured output.
5. Frontend renders:
   - Disclaimer
   - Preparation checklist (top)
   - Expandable inclusion/exclusion sections with ✅/❓/❌ labels

---

## 2) API Integration

### ClinicalTrials.gov API call
- **Endpoint:** `GET https://clinicaltrials.gov/api/v2/studies/{NCT_ID}`
- **Fields to extract:**
  - `protocolSection.eligibilityModule.eligibilityCriteria`
  - `protocolSection.eligibilityModule.minimumAge`
  - `protocolSection.eligibilityModule.maximumAge`
  - `protocolSection.eligibilityModule.sex`
  - `protocolSection.eligibilityModule.healthyVolunteers`

### Parsing `eligibilityCriteria` (semi-structured)
Process before LLM for clean input:
- Normalize line endings to `\n`.
- Remove leading/trailing whitespace.
- Split into lines and remove empty bullets.
- Detect headers using case-insensitive regex:
  - `^Inclusion Criteria:?`
  - `^Exclusion Criteria:?`
  - Also accept `Inclusion` / `Exclusion` alone.
- If both sections found, pass them separately to the LLM.
- If only one section or no headers, pass entire block as “unclassified criteria” and let LLM classify.

### Error handling
- **No eligibility criteria:** return a fallback response with empty criteria arrays and a checklist explaining the trial lacks posted criteria.
- **Partial criteria:** process whatever is present, mark missing sections as empty.
- **Malformed text:** keep original text but send sanitized lines to LLM, plus a note in response metadata.

### Rate limiting strategy (~50 req/min)
- Cache raw eligibility by `nctId` (primary limiter).
- Add **in-action throttle**: if multiple requests for same `nctId` within 60s, reuse the cached raw value even if “stale” by TTL to avoid bursts.

---

## 3) AI/LLM Prompt Design

### System prompt (exact)
```
You translate clinical trial eligibility criteria into plain English.
You do NOT determine eligibility. You classify each criterion as:
- "met" only if the patient profile explicitly satisfies it.
- "not_met" only if the patient profile explicitly contradicts it.
- "unknown" for anything else.
Be conservative: when unsure, use "unknown".
Use plain English suitable for a 16-year-old.
If you use medical terms, add a short parenthetical explanation.
Return only valid JSON matching the provided schema. No extra text.
Include the disclaimer exactly as provided.
```

### User prompt (exact)
```
Trial ID: {{nctId}}

Patient profile:
{{profileJson}}

Eligibility criteria (raw):
{{eligibilityRaw}}

Task:
1) Separate inclusion vs exclusion criteria.
2) For each criterion, provide: original, plainEnglish, status ("met" | "not_met" | "unknown"), reason.
3) Generate a "preparationChecklist" derived from all "unknown" items.
4) Use the disclaimer exactly:
"This breakdown helps you understand what the trial requires. Only the trial's research team can confirm eligibility after formal screening."

Return JSON only.
```

### Patient profile structure
Send minimal, explicit fields only:
```json
{
  "age": 34,
  "sex": "female",
  "location": "United Kingdom",
  "condition": "Ehlers-Danlos Syndrome (hypermobile type)",
  "medications": ["..."],
  "additionalInfo": "..."
}
```

### Expected output schema (JSON)
```json
{
  "trialId": "NCT00000000",
  "disclaimer": "This breakdown helps you understand what the trial requires. Only the trial's research team can confirm eligibility after formal screening.",
  "inclusionCriteria": [
    {
      "original": "Age ≥ 18 years",
      "plainEnglish": "You must be 18 years old or older.",
      "status": "met",
      "reason": "You told us you're 34."
    }
  ],
  "exclusionCriteria": [
    {
      "original": "Current use of immunosuppressive therapy",
      "plainEnglish": "You cannot currently be taking medications that suppress your immune system (like methotrexate or biologics).",
      "status": "unknown",
      "reason": "We don't have your current medication list."
    }
  ],
  "preparationChecklist": [
    "Bring any recent blood test results, especially kidney and liver function.",
    "Have a list of your current medications and dosages."
  ],
  "meta": {
    "source": "clinicaltrials.gov",
    "criteriaPresent": true,
    "notes": ""
  }
}
```

### Validation & malformed response handling
- Validate with Zod in the Convex action.
- If invalid: retry once with a short “fix JSON to schema” prompt.
- If still invalid: return a safe fallback with empty criteria + checklist that explains the issue.

### Token budget considerations
- Eligibility blocks can be long; cap input by:
  - Removing empty lines and non-informative headers.
  - Trimming to max ~6,000–8,000 chars if needed (keep the start and end, add a note in meta).

### Model choice
- `gpt-4o-mini` for cost and speed; sufficient quality for simple translation and conservative classification in a hackathon.

---

## 4) Component & UI Plan

### Existing components to modify
- `apps/web/src/components/Trials/TrialCard.tsx`
  - Add “Understand this trial” button.
  - Add loading state while eligibility breakdown loads.
- `apps/web/src/components/Trials/TrialResultsList.tsx`
  - Pass patient profile data and handle selected trial state.
- `apps/web/src/components/Chat/TrialCardsFromChat.tsx`
  - Same button for chat results.

### New components
- `EligibilityDrawer` or `EligibilityModal`
  - Shows disclaimer, checklist, expandable criteria sections.
- `CriteriaSection`
  - Title + count + collapsible list of criteria.
- `CriteriaItem`
  - Status pill (✅/❓/❌), plain English text, optional reasoning.
- `EligibilitySkeleton`
  - Loading shimmer for breakdown.

### State management
- Keep eligibility breakdown in **component state** of the parent list.
- Cache per-session in `localStorage` keyed by `eligibility:{nctId}:{profileHash}`.
- Persist selected trial state across navigation by keeping the modal tied to list context only (no deep linking for hackathon scope).

### Mobile responsiveness
- Use drawer on mobile (bottom sheet), modal on desktop.
- Checklist shown first with compact cards.
- Criteria sections collapsed by default on mobile.

---

## 5) Integration Points With Existing Code

### Trial matching / scoring flow
- No change to matching. This feature is **post-match**, on-demand only.
- Use existing `TrialSummary` fields to populate the modal header.

### Trial card changes
- Extend `TrialCard` with a secondary CTA button.
- No restructuring needed; just add a button and a callback.

### Chat integration
- Use the same modal/drawer within chat results.
- Optional enhancement: after modal closes, add a chat message summary. (Not required for MVP.)

---

## 6) Edge Cases & Failure Modes

- **No eligibility criteria:** show message: “This trial does not list eligibility criteria on ClinicalTrials.gov.”
- **No clear inclusion/exclusion split:** treat all as “unclassified,” let LLM separate and mark unknown conservatively.
- **LLM malformed output:** retry once; then fallback response with empty lists and a checklist note.
- **Minimal patient profile:** most criteria become ❓; checklist still useful.
- **ClinicalTrials.gov down / rate-limited:** show error state and suggest retry; keep last cached raw criteria if available.
- **Non-English criteria:** add meta note “Criteria appear non-English,” checklist still derived from unknowns.

---

## 7) Step-by-Step Implementation Order (4–5 hours)

### Step 1 — Convex schema + cache table (30–40 min)
- Add `eligibilityCache` table with fields above + index on `nctId`.
- Done = schema deploy passes and table available.

### Step 2 — Convex action to fetch + cache raw criteria (45–60 min)
- Add `getEligibilityRaw(nctId)` helper.
- Add fetch with timeout and error handling.
- Done = action returns raw criteria for a test NCT ID.

### Step 3 — LLM integration + Zod validation (60–75 min)
- Add prompt constants and response schema.
- Add LLM call in action `getEligibilityBreakdown`.
- Add JSON validation + retry-once.
- Done = action returns valid structured response for test trial.

### Step 4 — Frontend modal/drawer components (45–60 min)
- Build `EligibilityDrawer`, `CriteriaSection`, `CriteriaItem`, `EligibilitySkeleton`.
- Done = mocked data renders correctly on desktop/mobile.

### Step 5 — Wire UI to action + caching (45–60 min)
- Add “Understand this trial” button to `TrialCard`.
- Trigger action; show loading, error, success.
- Add localStorage cache by profile hash.
- Done = real data renders for test NCT ID.

### Step 6 — Polish copy + disclaimers (20–30 min)
- Place disclaimer at top.
- Label ❓ as “Things to discuss”.
- Done = copy matches constraints and tone.

Parallelizable:
- Step 1–3 (backend) can run in parallel with Step 4 (frontend UI).
Blocking:
- Step 5 depends on Step 2–3.

---

## 8) Testing Strategy

### Accuracy checks
- Compare 3–5 criteria lines manually to plain-English output.
- Verify “met” only when profile clearly matches.

### Test trial (use consistently)
- **NCT ID:** `NCT04852770` (example from spec; has clear inclusion/exclusion).

### Done checklist per step
- **Step 1:** Convex typecheck passes.
- **Step 2:** Raw eligibility fetch returns non-empty for `NCT04852770`.
- **Step 3:** Valid JSON response, criteria arrays non-empty.
- **Step 4:** UI shows checklist + collapsible criteria.
- **Step 5:** “Understand this trial” works end-to-end.
- **Step 6:** Disclaimer always visible and matches exact required text.


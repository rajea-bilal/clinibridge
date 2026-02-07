# Changes: AI Scoring & Filtering Overhaul

## What Was Wrong

### 1. No eligibility scoring or filtering
The system prompt told the AI to "present results clearly" but never instructed it to **compare** each trial's age range, eligibility criteria, or location against the patient's actual profile. The AI returned every trial from ClinicalTrials.gov verbatim — including trials for under-2-year-olds and adults-only when the patient was 12.

### 2. Vague system prompt
The prompt was generic: "be warm, present results clearly, remind users you're an AI." No instructions to check age ranges, cross-reference medications, assign match labels, filter ineligible trials, or limit output count. The AI had no scoring rubric.

### 3. Patient profile not echoed in tool output
When the `searchTrials` tool returned results, it sent `{ trials, count }` — but **not** the patient's age, medications, or condition alongside the trials. The AI had to rely on conversation memory to cross-reference, which was unreliable.

### 4. matchScore was always 0
`normalizeToSummary()` in `clinicalTrials.ts` hardcoded `matchScore: 0` as a placeholder. No scoring ever happened.

### 5. Eligibility text truncated too aggressively
Eligibility criteria were cut to 500 chars for both the UI and the AI. The AI couldn't read enough of the criteria to make informed scoring decisions.

### 6. Verbose, redundant AI output
The AI dumped all 9 trial summaries in markdown (### headers, bullet lists), repeating everything already visible in the trial cards above. A parent isn't going to read 9 full study descriptions in a chat window.

### 7. No match labels on trial cards
Cards showed status ("RECRUITING") but no indication of whether the trial actually fits the patient. No "Strong Match" / "Possible Match" differentiation.

---

## What Changed

### 1. Rewrote system prompt with explicit scoring instructions (`aiPrompts.ts`)
- AI must check each trial's age range against patient age
- AI must read eligibility criteria and compare against medications/condition
- AI assigns labels: "Strong Match", "Possible Match", or "Unlikely"
- AI drops "Unlikely" trials entirely — only shows matches
- AI limits output to top 4-5 trials, sorted by match strength
- AI writes ONE plain-English sentence per trial explaining why it fits
- AI does NOT repeat card data (title, NCT ID, full summary)
- AI does NOT use markdown headers — keeps it conversational

### 2. Tool output now includes patient profile (`api/chat.ts`)
The `searchTrials` tool now returns `{ trials, count, patientProfile }` where `patientProfile` echoes back `{ condition, age, location, medications, additionalInfo }`. The AI can cross-reference without relying on conversation memory.

### 3. Added match fields to data model (`types.ts`)
`TrialSummary` now includes:
- `matchLabel?: "Strong Match" | "Possible Match" | "Worth Exploring" | "Unlikely"`
- `matchReason?: string` — plain English explanation
- `eligibilityFull?: string` — longer eligibility text for AI scoring (1500 chars)

### 4. Increased eligibility text for AI scoring (`clinicalTrials.ts`)
UI still shows 500-char truncated version. A separate `eligibilityFull` field passes up to 1500 chars to the AI for better scoring decisions.

### 5. Trial cards now show match badges (`TrialCard.tsx`)
Color-coded badges: green for "Strong Match", amber for "Possible Match", blue for "Worth Exploring". Plus a one-line match reason below the badge.

### 6. Chat trial cards sorted and filtered (`TrialCardsFromChat.tsx`)
Trials are sorted by `matchScore` descending. If more than 5, excess are hidden behind "Show more". Trials labeled "Unlikely" are excluded from display.

---

## Expected Behavior After Changes

**Before**: "Found 9 recruiting trials" → dumps all 9 including ineligible ones → AI repeats everything in markdown

**After**: "I found 3 trials that look relevant for your son" → shows only matching trials with badges → AI gives one-line explanation per match → brief, conversational, actionable

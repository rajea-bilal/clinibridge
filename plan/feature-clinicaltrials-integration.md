---
name: feature-clinicaltrials-integration
overview: Plan API fetch, normalization, and scoring inputs for ClinicalTrials.gov.
isProject: false
---

# Feature Plan: ClinicalTrials.gov Integration

## Goals

- Query ClinicalTrials.gov API v2 reliably.
- Normalize raw records into `TrialRaw` and `TrialSummary`.
- Provide stable inputs for AI scoring and UI rendering.

## Scope

- API client with timeout and error handling
- Normalization and field extraction
- Shared types for raw/summary models

## Files

- `frontend/src/lib/clinicalTrials.ts`
- `frontend/src/lib/types.ts`

## Request Details

- Base URL: `https://clinicaltrials.gov/api/v2/studies`
- Params:
  - `query.cond`: condition + synonyms (OR-joined)
  - `filter.overallStatus`: `RECRUITING`
  - `pageSize`: 10
- Timeout: 15s

## Normalization

- Extract: NCT id, brief title, locations, eligibility criteria, phase, age range, status, brief summary
- Build `TrialRaw` with fields close to API response.
- Build `TrialSummary` with plain-English summary and match score placeholder.

## Error Handling

- Timeout: return friendly error message.
- Network/API error: return empty array with error metadata.
- Partial data: skip records missing critical fields (id/title).

## Build Steps

1. Define `TrialRaw` and `TrialSummary` in `lib/types.ts`.
2. Implement fetch helper in `clinicalTrials.ts`.
3. Add normalization helpers (map raw -> summary).
4. Add unit test fixtures (optional) for normalization.

## QA Checklist

- Handles empty results without throwing.
- Fails gracefully on timeout.
- Returns max 10 normalized items.

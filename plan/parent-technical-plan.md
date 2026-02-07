---
name: parent-technical-plan
overview: Master plan ordering feature plans, agent workflow, and app flow diagram.
isProject: false
---

# Parent Technical Plan

## Agent Workflow (Opus)

- Agent: Opus.
- Work one plan file at a time in the order below.
- For each plan file:
  - Implement code described in that plan only.
  - Run any manual tests listed for that plan.
  - Ask for review.
  - After approval, move to the next plan file.
- Keep `plan/progress.md` updated after each feature is completed.
- Keep `plan/bugs.md` updated with any bugs discovered.

## Plan Order

1. `plan/feature-clinicaltrials-integration.md`
2. `plan/feature-ai-chat.md`
3. `plan/feature-backend-convex.md`
4. `plan/feature-frontend-experience.md`
5. `plan/feature-landing-and-routing.md`

## Manual Testing (Global)

- Chat flow: tool call and results render.
- Form flow: submit and results render.
- Timeout handling: simulate slow API, confirm friendly message.
- No-results handling: verify empty state and disclaimer.

## App Flow (Mermaid)

```mermaid
flowchart TD
  A[Landing /] -->|Chat CTA| B[/chat]
  A -->|Form CTA| C[/find]
  B --> D[ChatPanel useChat]
  D --> E[API Route /api/chat]
  E --> F[Tool: searchTrials]
  F --> G[ClinicalTrials.gov API]
  G --> H[Normalize + Summarize]
  H --> I[TrialResultsList]
  C --> J[TrialSearchForm]
  J --> K[Convex action searchTrials]
  K --> G
  K --> H
  I --> L[TrialCard]
  I --> M[NoResults / Disclaimer]
  B --> N[/results/:id (optional)]
  C --> N
  N --> O[Convex query getSearch]
  O --> I
```

# Hackathon Blueprint: Rare Disease Trial Finder

## What You're Building (One Sentence)

An app where rare disease patients or caregivers describe their situation — either through a friendly AI chat or a quick form — and get matched to clinical trials they might qualify for, with everything explained in plain English.

---

## The User Journey (Step by Step)

```
LANDING PAGE
    ↓
Two paths:
    ↓                              ↓
PATH A: "Chat with us"      PATH B: "I know my diagnosis"
(AI conversation)            (Quick form)
    ↓                              ↓
AI asks friendly questions    Patient fills in:
until it has enough info      condition, age, meds, location
    ↓                              ↓
    └──────────┬───────────────────┘
               ↓
    AI searches ClinicalTrials.gov
               ↓
    AI reads eligibility rules and scores each trial
               ↓
    RESULTS: Cards with plain-English explanations
               ↓
    Click a card → full trial detail
               ↓
    "Have questions?" → follow-up AI chat about results
```

### Why two paths?

- **Path A (Chat)** is for patients who DON'T know their exact diagnosis. They might say "my daughter bruises easily and needs blood transfusions." The AI can figure out what to search for. This is common with rare diseases — the average patient takes 4-6 years to get diagnosed.

- **Path B (Form)** is for patients who DO know their diagnosis and just want fast results. They type "Diamond-Blackfan anemia," enter their age and location, hit search. Done in 30 seconds.

Both paths end up at the same results page.

---

## The 4 Screens You Need

### Screen 1: Landing Page
- Warm headline: "Find Clinical Trials for Rare Diseases"
- 2-3 sentences explaining what this does
- A stat: "300 million people worldwide have rare diseases. 95% have no approved treatment."
- TWO buttons:
  - "Chat with us" → goes to the AI chat (Path A)
  - "I know my diagnosis" → goes to the quick form (Path B)
- Warm, hopeful, not clinical

### Screen 2a: The AI Chat (Path A)
- Chat interface (WhatsApp/iMessage style)
- AI introduces itself warmly and asks the first question
- Questions come ONE AT A TIME
- Small link at the top or bottom: "Prefer to fill in a form instead?" → goes to Path B
- When the AI has enough info, it calls the searchTrials tool automatically
- Results appear below the chat as cards (not on a separate page)
- After results show, the user can keep chatting to ask questions about the trials

**How the AI knows when it has enough info:**
The AI has a tool called `searchTrials`. That tool REQUIRES three fields: condition, age, and location. The AI literally cannot call the tool without providing these. If the patient hasn't mentioned their location yet, the AI can't search — so it asks. This is enforced by the tool's input rules, not by counting questions.

### Screen 2b: The Quick Form (Path B)
- Simple, clean form with 4-5 fields:
  - Condition/diagnosis (with AI-powered suggestions as you type)
  - Patient's age
  - Current medications or treatments (optional)
  - Location (city or country)
  - Anything else relevant (optional, free text)
- "Search for Trials" button
- Small link: "Not sure about your diagnosis? Chat with us instead" → goes to Path A

### Screen 3: Results (same for both paths)
- If coming from chat: results appear as cards below the conversation
- If coming from form: results appear on their own page
- Each card shows:
  - Trial name (rewritten in plain English)
  - Match label: "Strong Match" / "Possible Match" / "Worth Exploring"
  - One-line summary of what the trial is testing
  - Location
  - Recruiting status
- Click a card to expand and see full details
- If no results: compassionate message with suggestions (expand search area, check back later, contact advocacy groups)

### Screen 4: Trial Detail (expanded view or separate page)
- Full plain-English explanation of the trial
- What it's testing and why
- What participating involves (visits, duration, what to expect)
- Why the patient might qualify (based on what they shared)
- Why they might NOT qualify (honesty builds trust)
- Location and contact info
- "Share with your doctor" button
- Disclaimer: "This is not medical advice. A trial coordinator will confirm your eligibility."

---

## How the AI Works (4 Jobs)

### AI Job 1: Understand what the patient is saying
Patient says: "My daughter has a rare blood disorder, she's 8, the doctor calls it Diamond-Blackfan anemia"
AI extracts: condition = Diamond-Blackfan anemia, age = 8, patient type = pediatric

### AI Job 2: Turn their words into medical search terms
The patient said "rare blood disorder" — AI also searches for:
- Diamond-Blackfan anemia
- DBA
- Congenital pure red cell aplasia
(These are all names for the same thing)

### AI Job 3: Check if the patient matches a trial's rules
Trial says: "Patients aged 2-18 with confirmed DBA who have not received gene therapy"
AI checks: Age 8? ✅ Has DBA? ✅ No gene therapy mentioned? ✅
Result: "Strong Match"

### AI Job 4: Explain everything in plain English
Instead of: "Phase 2, open-label, multi-center study evaluating efficacy of [drug name] in subjects with transfusion-dependent DBA"
AI rewrites: "This trial is testing a new medicine that might help people with DBA need fewer blood transfusions. It's in the middle stages of testing, which means it's already been shown to be safe in earlier tests."

---

## How the Tech Fits Together

| Tool | What it does |
|------|-------------|
| **TanStack Router** | Moving between pages (landing → chat or form → results → detail) |
| **Convex** | Backend database. Saves chat sessions and results. Also calls ClinicalTrials.gov API (because the browser can't safely call external APIs) |
| **Tailwind + shadcn/ui** | Makes everything look good. Cards, buttons, chat bubbles, forms |
| **Vercel AI SDK** | Connects to Claude/OpenAI. Handles streaming chat AND tool calling (the AI triggering the trial search) |
| **ClinicalTrials.gov API** | Free government database of all clinical trials. You search it, it gives you trial data as JSON |

---

## Data Flow: Path A (Chat)

```
User types a message
    ↓
Vercel AI SDK sends it to your API route
(NOT through Convex — this keeps the chat fast and streaming)
    ↓
API route sends it to Claude/OpenAI with:
  - The system prompt (how to behave)
  - The searchTrials tool definition
  - The conversation history
    ↓
AI either:
  a) Replies with a follow-up question (streamed back to chat)
  b) Calls the searchTrials tool (when it has condition + age + location)
    ↓
If tool is called:
  - Tool function runs on your server
  - Calls ClinicalTrials.gov API
  - Returns trial data to the AI
  - AI reads eligibility criteria, scores each trial, writes summaries
  - AI responds with structured results
    ↓
Frontend receives results and renders them as cards below the chat
    ↓
Convex saves the session, patient info, and results in the background
(safety net — so nothing is lost if the page refreshes)
```

## Data Flow: Path B (Form)

```
User fills in the form and clicks "Search"
    ↓
Frontend sends form data to a Convex action (backend function)
    ↓
Convex function calls ClinicalTrials.gov API
    ↓
API returns trial data
    ↓
Convex sends trial data + patient info to AI
(via a separate Vercel AI SDK call — not a chat, just a one-off request)
    ↓
AI scores each trial, writes plain-English summaries
    ↓
Results come back to the frontend
    ↓
Frontend displays results as cards on the results page
    ↓
Convex saves everything to the database
```

### Where Convex fits (and where it doesn't):

| Convex DOES | Convex DOESN'T |
|-------------|----------------|
| Save chat sessions to the database | Sit in the middle of every chat message |
| Save search results so users can return to them | Handle the real-time streaming chat (that's Vercel AI SDK) |
| Call ClinicalTrials.gov API (for the form path) | Do the AI matching (that's Claude/OpenAI) |
| Call ClinicalTrials.gov API (for the chat path too, via the tool) | |

---

## Edge Cases to Handle

### 1. Patient is vague
User says: "My kid is sick"
→ AI keeps asking gentle follow-up questions. Never guesses a diagnosis.
→ System prompt says: "If the user hasn't named a specific condition, help them narrow it down by asking about symptoms, but be clear you cannot diagnose."

### 2. No trials found
→ Don't just say "no results." That's devastating.
→ Show: "I wasn't able to find recruiting trials for [condition] near you right now. Here are some things you can try..."
→ Suggest: expand location, check back later, contact advocacy groups, ask their doctor about specialist centres.
→ Maybe try a broader search automatically (disease category instead of exact condition).

### 3. ClinicalTrials.gov API is down or slow
→ Friendly error: "I'm having trouble reaching the trial database right now. Please try again in a moment."
→ Add a retry button.
→ Set a 15-second timeout.

### 4. Patient doesn't know the medical name
→ This is exactly why Path A (chat) exists.
→ AI can work with symptoms: "She bruises easily, needs blood transfusions every 3 weeks, diagnosed at age 1"
→ AI suggests possible conditions: "Based on what you've described, this sounds like it could be Diamond-Blackfan anemia or another congenital red cell disorder. Have your doctors used either of these terms?"

### 5. AI matches incorrectly
→ This WILL happen. AI isn't perfect.
→ Always show the reasoning: "I think you may match because X, but I'm not sure about Y."
→ Always add disclaimer: "A trial coordinator will confirm your eligibility."
→ Honesty builds more trust than pretending to be certain.

### 6. Too many results
→ Cap at 10 trials shown. Sort by match strength.
→ "Showing the 10 most relevant trials. Want to see more?"

### 7. User wants to search again
→ "Start New Search" button that resets everything.

### 8. Eligibility criteria are extremely long
→ Some trials have 30+ rules. Sending all of them to AI is slow and expensive.
→ Only send the top 15 most important criteria per trial.
→ Or: limit to 5 trials at a time, then offer "show more."

---

## Security

**For the hackathon:**
- Not collecting real patient data
- Using mock/example data for demos
- Nothing stored long-term
- No file uploads, no medical records

**If this became a real product:**
- All data encrypted
- Patient info deleted after session
- Names and identifying details stripped before sending to AI
- Proper certifications (HIPAA, GDPR)
- Patients control their own data

We designed this so even in the prototype, we're not storing sensitive information. The architecture supports adding security later without rebuilding

---

## Scaling

**Phase 1 (Now):** Prove it works. No real patient data.
**Phase 2 (Months 1-3):** Partner with a rare disease advocacy group. Test with their community.
**Phase 3 (Months 3-6):** Raise money. Build proper security. Add more data sources.
**Phase 4 (Months 6+):** Expand conditions. Partner with hospitals.

**Who pays:** Patient advocacy groups, pharmaceutical companies (sponsored trial listings), government/charity grants.

---

## Pitch Structure (5 minutes)

1. **The Problem (1 min):** "300 million people have rare diseases. 95% have no treatment. Trials are their only hope — but they can't find them."
2. **Quick Demo (2 min):** Show BOTH paths. Chat for someone who doesn't know their diagnosis. Form for someone who does.
3. **How AI is Used (1 min):** "AI does 4 things: understands plain language, finds medical terms, checks eligibility, explains everything simply."
4. **What's Next (30 sec):** "Partner with advocacy groups. Add document upload. Expand beyond ClinicalTrials.gov."
5. **Close (30 sec):** "Every day someone doesn't know about a trial that could help them is a day wasted."

---

# Prompt for AI Coding Agent (Cursor / GPT-Codex)

Copy everything below and paste it into your coding agent.

---

## Context

I'm building a hackathon project in 24 hours. The codebase already has TanStack Router, Convex, Tailwind CSS, and shadcn/ui set up and working. DON'T reinstall or reconfigure any of these — they're ready to go.

I need you to write a detailed technical plan for building the features described below. Don't write any code yet — just the plan. I want to understand what files to create, what order to build things in, and how the pieces connect.

## What the App Does

A clinical trial finder for rare disease patients. Two ways to use it:
- **Path A (Chat):** Patient chats with an AI that asks friendly questions, then searches for trials mid-conversation using tool calling.
- **Path B (Form):** Patient fills in a quick form (condition, age, meds, location) and gets results.

Both paths show the same results: trial cards with plain-English explanations and match scores.

## Architecture

### Path A (Chat) uses Vercel AI SDK with tool calling:
- The chat goes directly between frontend and an API route via Vercel AI SDK's useChat hook. NOT through Convex.
- The AI has a tool called `searchTrials` with required inputs validated by Zod:
  - condition (string, required)
  - synonyms (string array, optional — AI generates medical synonyms)
  - age (number, required)
  - location (string, required)
  - medications (string array, optional)
  - additionalInfo (string, optional)
- The AI CANNOT call this tool without condition, age, and location. This is how we guarantee enough info is collected.
- When the tool is called, it fetches from ClinicalTrials.gov API, returns trial data to the AI.
- The AI then scores each trial and responds with structured results.
- Results render as cards below the chat message.

### Path B (Form) uses Convex:
- Form submission sends data to a Convex action.
- Convex action calls ClinicalTrials.gov API.
- Convex then calls AI (via Vercel AI SDK server-side) to score and summarize trials.
- Results returned to frontend and displayed as cards.

### Convex is used for:
- Saving chat sessions (background, not in the real-time flow)
- Saving search results so users can come back to them
- Running the form-based search flow
- NOT sitting in the middle of every chat message

## Tech Stack (already set up)
- TanStack Router (routing)
- Convex (backend + database)
- Tailwind CSS + shadcn/ui (styling)

## Tech to Add
- Vercel AI SDK (chat + tool calling + AI scoring)
- Claude or OpenAI API (whichever is easier to wire up)
- ClinicalTrials.gov API v2 (free, no auth key)
  - Endpoint: `GET https://clinicaltrials.gov/api/v2/studies`
  - Params: `query.cond`, `filter.overallStatus=RECRUITING`, `pageSize=10`

## What I Need in the Technical Plan

1. **File structure** — what new files/folders to create. List them clearly.
2. **Convex schema** — what tables and fields. Keep it minimal.
3. **Convex functions** — what backend functions, what each does, inputs/outputs.
4. **Routes** — what pages to add to TanStack Router.
5. **Components** — what React components, what each does.
6. **API route for chat** — where the Vercel AI SDK lives, system prompt, tool definition.
7. **ClinicalTrials.gov integration** — how to call it, what data to extract.
8. **Build order** — step-by-step sequence so I can build and test incrementally.

## System Prompts

### Chat system prompt:
"You are a warm, friendly clinical trial assistant helping rare disease patients and their caregivers find relevant clinical trials. You speak in plain, simple language — never medical jargon. You are empathetic and understand the person might be scared. Ask questions one at a time. Be patient. When you have the patient's condition, age, and location, call the searchTrials tool. If the user is vague about their condition, help them by asking about symptoms, but be clear you cannot diagnose. If the user hasn't mentioned a specific condition, do NOT guess — ask. After receiving trial results from the tool, score each trial and explain in plain English why the patient may or may not qualify."

### Trial scoring prompt (for form path):
"You are analyzing clinical trial eligibility criteria against a patient profile. For each trial, determine if the patient is likely eligible, possibly eligible, or unlikely eligible. Explain your reasoning in plain, simple language. Rewrite each trial's title and description in plain English. Be honest about uncertainty."

## Design Direction
- Warm, hopeful, calming. Not clinical or corporate.
- Soft blues, warm neutrals, soft amber or sage green accents.
- Rounded corners, generous spacing, readable fonts.
- Mobile-responsive.
- Distinctive warm typography — not generic system fonts.
- The vibe: "a kind friend who knows about clinical trials."

## Constraints
- Hackathon prototype — use mock/fake patient data for demos
- No real patient data stored permanently
- Disclaimer on every results screen: "This does not provide medical advice. Always consult your healthcare provider."
- If no trials match, show a compassionate message with next-step suggestions
- Cap results at 10 trials, sorted by match strength
- 15-second timeout on ClinicalTrials.gov API calls with friendly error message

## Don't Do These Things
- Don't reinstall or reconfigure existing boilerplate
- Don't build auth or user accounts
- Don't over-engineer the database
- Don't build admin panels
- Don't use medical jargon in user-facing text
- Don't make the chat the ONLY way in — always offer the form as an alternative

Give me the technical plan first. After I review it, I'll ask you to build piece by piece.

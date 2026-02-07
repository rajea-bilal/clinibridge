# PRD: AI-Powered Pricing Calculator Estimator

## Introduction/Overview

Add an AI-powered estimation feature to the production cost calculator that allows users to describe their product idea in natural language. The system will use GPT-4o-mini to analyze the description and automatically estimate realistic values for all infrastructure settings and revenue packages, then auto-populate the calculator toggles. This eliminates manual guesswork and provides users with instant, realistic cost projections based on their specific use case.

**Problem Solved:** Users currently need to manually configure many technical parameters (storage settings, API usage, email volume, etc.) without domain knowledge, leading to inaccurate estimates or abandonment of the calculator.

**Goal:** Enable users to get accurate infrastructure cost estimates by simply describing their product idea, making the calculator more accessible and useful.

## Goals

1. Reduce friction in using the pricing calculator by eliminating manual parameter configuration
2. Provide realistic, AI-generated estimates based on product type and use case patterns
3. Maintain user control by allowing manual adjustments after AI estimation
4. Protect API costs through rate limiting (10 requests/hour per IP)
5. Deliver estimates within 3-5 seconds for good UX

## User Stories

1. **As a founder**, I want to describe my product idea and get instant infrastructure cost estimates, so I can quickly validate my business model without deep technical knowledge.

2. **As a developer**, I want the AI to estimate technical parameters based on my product description, so I can focus on refining the business model rather than guessing infrastructure needs.

3. **As a user**, I want to see how my idea's costs compare to different scenarios, so I can iterate and refine my product strategy.

4. **As a user**, I want to manually adjust AI-generated estimates, so I can account for specific requirements the AI might not know about.

## Functional Requirements

### FR1: AI Input Interface
1.1. Display a text input area at the top of the calculator, above the MAU slider
1.2. Include placeholder text: "Describe your product idea (e.g., 'A social media app for photographers with image uploads, comments, and direct messaging')"
1.3. Show a "Get AI Estimate" button next to the input
1.4. Display character count (optional, max 2000 characters)

### FR2: AI Estimation Processing
2.1. When user clicks "Get AI Estimate", send the idea description + current MAU value + any manually set values (as context hints) to a Convex action
2.2. The Convex action calls GPT-4o-mini API with a structured prompt that:
   - Describes the calculator's purpose
   - Lists all parameters that need estimation
   - Provides current MAU and any manually set values as context
   - Requests estimates in a structured JSON format
2.3. Parse the AI response and validate all returned values are within acceptable ranges
2.4. Return structured data with all estimated values

### FR3: Auto-Population of Calculator
3.1. Upon receiving AI estimates, automatically update all calculator toggles:
   - Developer seats (1-20)
   - Developer salary (0-20000)
   - Marketing spend (0-100000)
   - Churn rate (0-100%)
   - Emails per user/month (0+)
   - Blob content type (Images/Videos/Documents/Mixed)
   - Blob avg file size (MB, 0.1+)
   - Blob uploads per user/month (0+)
   - Cost per API call ($, 0+)
   - API calls per user/month (0+)
   - Revenue packages (minimum 2 packages: Free + Paid, with name, price, conversion rate)
   - Confidence score (0-100%, displayed to user)
3.2. Keep MAU unchanged (as specified by user)
3.3. Preserve any manually set values that user explicitly wants to keep (future enhancement)

### FR4: Loading States
4.1. Show loading spinner in the input area during AI processing
4.2. Disable the "Get AI Estimate" button during processing
4.3. Disable the text input/textarea during processing
4.4. Display "Generating estimates..." message near the spinner

### FR5: Error Handling
5.1. Display user-friendly error messages via toast notification if AI API call fails
5.2. Show generic, client-friendly error message: "AI estimation failed. Please try again or configure manually."
5.3. Keep current calculator default values if AI fails (do not modify existing state)
5.4. Allow user to retry after errors
5.5. Log detailed errors for debugging (server-side only)

### FR6: Rate Limiting
6.1. Implement rate limiting using `@convex-dev/rate-limiter` package (already installed)
6.2. Use the best available rate limiting method provided by the package (IP-based, session-based, or identifier-based)
6.3. Limit to 10 requests per hour per user/session
6.4. Return clear error message when rate limit exceeded: "You've reached the limit of 10 estimates per hour. Please try again later."
6.5. Track rate limit attempts in Convex database (using rate-limiter's built-in storage)

### FR7: Re-estimation
7.1. Allow users to run multiple estimates (up to rate limit)
7.2. Each new estimate overwrites previous values
7.3. Show "Re-estimate" button text after first estimate (instead of "Get AI Estimate")
7.4. Clear previous estimate before showing new one

### FR8: AI Prompt Engineering
8.1. Create a comprehensive, well-engineered system prompt that:
   - Explains the calculator context (serverless infrastructure, Convex, Cloudflare, etc.)
   - Lists all parameters with their valid ranges and units
   - Provides examples of realistic estimates for common product types
   - Requests structured JSON output matching the calculator's data model
   - Requires minimum 2 packages (Free + Paid) in revenue packages
   - Requests a confidence score (0-100%) indicating estimate accuracy
8.2. Include user's idea description in the user message
8.3. Include current MAU and any manually set values as context
8.4. Use temperature 0.3-0.5 for consistent, realistic estimates
8.5. Prompt should be designed to handle diverse product types and use cases

### FR9: Confidence Score Display
9.1. Display confidence score (0-100%) returned by AI after estimation
9.2. Show confidence score near the AI input area or in the cost summary section
9.3. Use visual indicator (e.g., color-coded badge: green 80%+, yellow 50-79%, red <50%)
9.4. Include tooltip explaining what confidence score means: "How confident the AI is in these estimates based on your description"

## Non-Goals (Out of Scope)

1. **User authentication for rate limiting** - Using IP-based rate limiting for public access
2. **Estimate history/saving** - Users can export/share manually if needed
3. **Multiple estimate comparison** - Single estimate at a time
4. **Custom AI models** - Using GPT-4o-mini only
5. **Estimate explanations** - AI doesn't explain why it chose specific values (future enhancement)
6. **Learning from user adjustments** - No feedback loop to improve estimates
7. **Multi-language support** - English only for now

## Design Considerations

### UI/UX
- Place AI input section prominently at the top, before MAU slider
- Use consistent styling with existing calculator (dark theme, monospace font)
- Input area should be a textarea (multi-line) for longer descriptions
- Loading spinner should be visible but not intrusive
- Error messages should appear inline near the input area
- Rate limit message should be clear and non-punishing in tone

### Component Structure
- Add new state: `isEstimating` (boolean), `estimateError` (string | null), `ideaDescription` (string), `confidenceScore` (number | null)
- Create new Convex action: `estimateInfrastructureCosts` in `packages/backend/convex/` (new file: `costEstimator.ts`)
- Use existing UI components where possible (Button, input styles)
- Use toast notifications for error messages (check if sonner or similar is available)

## Technical Considerations

### Backend (Convex)
1. **New Convex Action**: `packages/backend/convex/costEstimator.ts`
   - Use `action` (not `internalAction`) since called from frontend
   - Import `@convex-dev/rate-limiter` for rate limiting
   - Use OpenAI SDK to call GPT-4o-mini
   - Store OpenAI API key in Convex environment variables
   - Return structured data matching calculator's state shape

2. **Rate Limiting Implementation**:
   - Use `@convex-dev/rate-limiter` with the best available method (check package docs for recommended approach)
   - Configure: 10 requests per hour
   - Use identifier from Convex request context (IP, session, or user identifier - whatever the package provides)
   - Store rate limit data in Convex (rate-limiter handles this automatically)

3. **AI Prompt Structure**:
   ```typescript
   {
     system: "You are an infrastructure cost estimation expert...",
     user: `Product idea: ${ideaDescription}\nCurrent MAU: ${mau}\n...`,
     response_format: { type: "json_object" }
   }
   ```

4. **Response Validation**:
   - Validate all numeric values are within min/max ranges
   - Validate blob content type is one of the allowed values
   - Validate packages array structure (must have at least 2 packages)
   - Validate confidence score is between 0-100
   - If validation fails, throw error and return to frontend (do not use defaults - let user retry or configure manually)

### Frontend
1. **State Management**:
   - Add `ideaDescription` state
   - Add `isEstimating` state for loading
   - Add `estimateError` state for error handling

2. **API Integration**:
   - Use `useAction` hook from `convex/react` to call the estimation action
   - Handle loading, success, and error states
   - Update all calculator state setters with AI response
   - Display confidence score in UI
   - Show toast notification on errors (using existing toast system)

3. **User Experience**:
   - Disable inputs during estimation
   - Show loading spinner
   - Auto-scroll to top after estimation (optional, for visibility)

### Environment Variables
- `OPENAI_API_KEY` - Add to Convex dashboard environment variables

### Dependencies
- `@convex-dev/rate-limiter` - Already installed ✓
- `openai` - Need to add to `packages/backend/package.json`

## Success Metrics

1. **Adoption**: 30%+ of calculator users use AI estimation feature
2. **Completion Rate**: Users who use AI estimation complete calculator configuration 2x faster
3. **Accuracy**: AI estimates are within 20% of manually configured values (measured via user adjustments)
4. **API Costs**: Average cost per estimate < $0.01 (GPT-4o-mini pricing)
5. **Rate Limit Effectiveness**: < 5% of users hit rate limit (indicating 10/hour is sufficient)
6. **Error Rate**: < 2% of AI calls fail or return invalid data

## Decisions Made

1. **Rate Limiting**: Use `@convex-dev/rate-limiter` with whatever identifier method the package provides (IP, session, or user-based). Use the best function available from the package.
2. **Package Estimation**: AI must suggest minimum 2 packages (Free + Paid). Can suggest more if appropriate for the product type.
3. **Default Values**: If AI fails, keep current calculator default values unchanged. Show toast notification with generic error message: "AI estimation failed. Please try again or configure manually."
4. **Estimate Confidence**: Display confidence score (0-100%) returned by AI with visual indicator (color-coded badge).
5. **Prompt Engineering**: Create a comprehensive, well-engineered prompt designed to handle diverse product types. This is an estimate tool - focus on providing realistic rough estimates for infrastructure costs, revenue, and profit. No need for iterative optimization initially.

## Implementation Notes

### AI Response Format
The AI should return JSON in this structure:
```json
{
  "devs": 2,
  "devSalary": 8000,
  "marketingSpend": 5000,
  "churnRate": 13,
  "emailsPerUser": 5,
  "blobContentType": "Images",
  "blobAvgFileSize": 2,
  "blobUploadsPerUser": 10,
  "costPerAPICall": 0.01,
  "apiCallsPerUser": 10,
  "packages": [
    { "name": "Free", "price": 0, "conversionRate": 95 },
    { "name": "Pro", "price": 19, "conversionRate": 5 }
  ],
  "confidenceScore": 75
}
```

**Note**: `packages` array must have at least 2 packages (Free + Paid). `confidenceScore` must be between 0-100.

### Rate Limiting Configuration
```typescript
// Example using @convex-dev/rate-limiter
const rateLimiter = new RateLimiter(ctx, {
  name: "cost-estimator",
  maxRequests: 10,
  periodMs: 60 * 60 * 1000, // 1 hour
});
```

### Error Messages
- Rate limit: "You've reached the limit of 10 estimates per hour. Please try again later." (Toast notification)
- API failure: "AI estimation failed. Please try again or configure manually." (Toast notification)
- Invalid response: "AI estimation failed. Please try again or configure manually." (Toast notification)
- Validation error: "AI estimation failed. Please try again or configure manually." (Toast notification)

**Note**: All errors should use toast notifications. Keep error messages generic and user-friendly. Detailed errors logged server-side only.


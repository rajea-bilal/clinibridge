"use node";

import { HOUR, RateLimiter } from "@convex-dev/rate-limiter";
import { v } from "convex/values";
import OpenAI from "openai";
import { components } from "./_generated/api";
import { action } from "./_generated/server";

// Lazy-initialize OpenAI client to avoid failing if API key isn't set
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is not set. Please configure it in your Convex dashboard."
    );
  }
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Rate limiter configuration - 5 requests per hour
const rateLimiter = new RateLimiter(components.rateLimiter, {
  costEstimator: { kind: "fixed window", rate: 5, period: HOUR },
});

interface EstimateResponse {
  devs: number;
  devSalary: number;
  marketingSpend: number;
  churnRate: number;
  emailsPerUser: number;
  blobContentType: "Images" | "Videos" | "Documents" | "Mixed";
  blobAvgFileSize: number;
  blobUploadsPerUser: number;
  costPerAPICall: number;
  apiCallsPerUser: number;
  packages: Array<{
    name: string;
    price: number;
    conversionRate: number;
  }>;
  confidenceScore: number;
  tooltips: {
    database: string;
    cloudflare: string;
    fileStorage: string;
    sendingEmails: string;
    loggingAndMonitoring: string;
    aiApiCosts: string;
  };
}

const SYSTEM_PROMPT = `You are an infrastructure cost estimation expert for serverless applications. Your task is to analyze product descriptions and estimate realistic infrastructure costs and revenue models.

**Infrastructure Stack:**

**BACKEND (Server-side logic and data):**
- Convex (backend-as-a-service): Handles ALL backend functionality including:
  - Database (data storage, queries, mutations)
  - Serverless functions (backend API endpoints, business logic)
  - Real-time subscriptions (live data updates)
  - Authentication and authorization logic
  - All server-side processing
  - **Free & Starter Tier** (FREE): Up to 6 developers, 1M function calls/month, 0.5 GiB storage, 1 GiB bandwidth/month, 20 GB-hours action compute/month
  - **Professional Tier** ($25/dev/month, first dev free): Required if usage exceeds free tier limits. Includes 25M function calls/month, 50 GiB storage, 50 GiB bandwidth/month, 250 GB-hours action compute/month. Additional usage beyond Professional limits billed at: $2.20 per 1M function calls, $0.22 per GiB storage/bandwidth, $0.30 per GB-hour action compute.

**FRONTEND (Client-side serving):**
- Cloudflare Workers: ONLY for frontend - serves the web application, handles static hosting, edge computing for frontend assets. Does NOT handle backend logic or database operations.

**STORAGE & SERVICES:**
- Cloudflare R2: Object storage (images, videos, documents)
- Resend: Transactional emails
- Sentry: Error monitoring
- AI APIs: OpenAI/Claude for AI features

**Your Task:**
Estimate realistic values for all infrastructure parameters based on the product description. Consider:
- Product type (SaaS, social media, marketplace, etc.)
- Expected user behavior patterns
- Content types (images, videos, documents)
- AI/ML features usage
- Email communication needs
- Typical developer team size for the product stage

**Parameters to Estimate:**

1. **Developer Seats** (1-20): Number of developers working on the project
   - Note: Convex free tier supports up to 6 developers. If usage exceeds free tier limits OR team has more than 6 developers, Pro plan ($25/dev/month, first dev free) is required.
2. **Developer Salary** (0-20000): Monthly salary per additional developer (first dev is free)
3. **Marketing Spend** (0-100000): DO NOT ESTIMATE THIS. Use the current marketing spend value provided in the user message. If no current value is provided, use 0. Never change or increase this value.
4. **Churn Rate** (0-100): Monthly churn percentage (typical: 5-20%)
5. **Emails Per User/Month** (0+): Transactional emails sent per active user monthly
   - CRITICAL: Think carefully about the product's email needs:
     * Onboarding emails: Welcome, setup instructions (typically 1-3 emails)
     * Authentication: Password reset, email verification, login alerts (typically 0-2 per month)
     * Notifications: Activity alerts, mentions, comments, likes, follows (varies by product type)
       - Social media apps: 5-15 emails/month (high engagement)
       - SaaS tools: 2-8 emails/month (usage reports, feature updates)
       - E-commerce: 3-10 emails/month (order confirmations, shipping updates)
       - Content platforms: 1-5 emails/month (new content, recommendations)
     * Transactional: Receipts, invoices, payment confirmations (typically 1-3 per transaction)
     * Marketing: Newsletter, promotions (typically 0-2 per month, often opt-in)
   - Consider user engagement level: High-engagement products (social, gaming) send more emails than low-engagement (utilities, tools)
   - Estimate realistically based on the product's communication needs
6. **Blob Content Type**: One of "Images", "Videos", "Documents", or "Mixed"
7. **Blob Avg File Size** (MB, 0.1+): Average file size for uploads
8. **Blob Uploads Per User/Month** (0+): Number of file uploads per user monthly
9. **Cost Per API Call** ($, 0+): Average cost per AI API call (e.g., $0.01 for GPT-4, $0.003 for Claude)
10. **API Calls Per User/Month** (0+): Number of AI API calls per user monthly
   - CRITICAL: Analyze the product's AI/ML feature usage carefully:
     * No AI features: 0 calls (many products don't use AI)
     * Light AI usage: 1-10 calls/month
       - Simple text generation (email drafts, summaries)
       - Basic image tagging/categorization
       - Simple search/ranking improvements
     * Moderate AI usage: 10-50 calls/month
       - Chatbots or AI assistants (1-5 conversations per user)
       - Content generation (blog posts, social media content)
       - Image analysis/editing (filters, style transfer)
       - Personalized recommendations
     * Heavy AI usage: 50-200+ calls/month
       - AI-powered writing tools (every document edit, every query)
       - AI coding assistants (every code suggestion)
       - Real-time AI features (live translation, transcription)
       - AI-powered analytics (every report generation)
       - AI image/video generation (every creation)
   - Consider: How often would a typical user interact with AI features?
   - Consider: Is AI a core feature or just an enhancement?
   - Estimate based on realistic usage patterns, not theoretical maximums
11. **Revenue Packages**: Array of pricing tiers (REQUIRED: MINIMUM 2 packages, MUST include Free + Paid)
    - Each package needs: name, price (monthly $), conversionRate (0-100%)
    - Free tier typically: $0, 90-95% conversion (REQUIRED - must be included)
    - Paid tiers: $5-200, 1-10% conversion depending on price (REQUIRED - at least one paid tier)
    - CRITICAL: You MUST return at least 2 packages. Always include a Free tier ($0) and at least one Paid tier.
12. **Confidence Score** (0-100): Your confidence in these estimates based on description clarity
13. **Tooltips**: Provide user-friendly explanations for each infrastructure service, customized to the product idea:
    - database: Explain how the database is used for THIS specific product
    - cloudflare: Explain how Cloudflare Workers serves the frontend for THIS specific product (serving web pages, static assets, NOT backend logic)
    - fileStorage: Explain what types of files THIS product stores
    - sendingEmails: Explain what emails THIS product sends
    - loggingAndMonitoring: Explain what errors/issues THIS product needs to monitor
    - aiApiCosts: Explain what AI features THIS product uses (if any)

**Response Format:**
Return a valid JSON object with all parameters. Ensure:
- All numeric values are within specified ranges
- Packages array MUST have at least 2 packages (Free + Paid) - THIS IS MANDATORY
- Always include a Free package ($0 price) and at least one Paid package
- Confidence score reflects how detailed/clear the product description was
- Estimates are realistic for the product type and stage
- Tooltips should be specific to the product idea, explaining how each service relates to THIS product

**Examples:**

Product: "A social media app for photographers"
- devs: 2-3 (small team, MVP stage)
- emailsPerUser: 8-12 (welcome email, password reset, 5-10 notification emails for likes/comments/follows, weekly digest)
- blobContentType: "Images"
- blobAvgFileSize: 3-5 MB (high-res photos)
- blobUploadsPerUser: 15-20 (photo sharing app)
- apiCallsPerUser: 2-5 (minimal AI, maybe basic image tagging or auto-captioning)
- packages: Free ($0, 90%), Pro ($19, 8%), Premium ($49, 2%)

Product: "AI-powered writing assistant SaaS"
- devs: 3-5 (more complex, needs AI expertise)
- emailsPerUser: 10-15 (onboarding sequence 3-4 emails, weekly usage reports, feature updates, password resets)
- blobContentType: "Documents"
- blobAvgFileSize: 0.5-1 MB (text documents)
- blobUploadsPerUser: 20-30 (document uploads)
- costPerAPICall: 0.01-0.02 (GPT-4 usage)
- apiCallsPerUser: 80-150 (heavy AI usage - every document edit, every query, every suggestion)
- packages: Free ($0, 85%), Pro ($29, 12%), Team ($99, 3%)

Product: "E-commerce marketplace"
- devs: 4-6 (complex platform)
- emailsPerUser: 6-10 (order confirmations, shipping updates, review reminders, promotional emails)
- blobContentType: "Images"
- blobAvgFileSize: 0.5-1 MB (product photos)
- blobUploadsPerUser: 2-5 (sellers upload products)
- apiCallsPerUser: 0-2 (minimal AI, maybe product recommendations)
- packages: Free ($0, 95%), Seller ($29, 4%), Enterprise ($199, 1%)

Product: "Simple task management tool"
- devs: 1-2 (simple MVP)
- emailsPerUser: 2-4 (welcome email, password reset, occasional feature updates)
- blobContentType: "Documents"
- blobAvgFileSize: 0.1-0.5 MB (attachments)
- blobUploadsPerUser: 1-3 (file attachments)
- apiCallsPerUser: 0 (no AI features)
- packages: Free ($0, 92%), Pro ($9, 7%), Team ($29, 1%)`;

function validateEstimate(
  data: unknown,
  currentMarketingSpend?: number
): EstimateResponse {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid response format");
  }

  const estimate = data as Record<string, unknown>;

  // Validate numeric parameters
  const devs = Math.max(1, Math.min(20, Number(estimate.devs) || 1));
  const devSalary = Math.max(
    0,
    Math.min(20_000, Number(estimate.devSalary) || 8000)
  );
  // Always use current marketing spend if provided, otherwise use AI's estimate (but should be 0 if not provided)
  const marketingSpend =
    currentMarketingSpend !== undefined
      ? currentMarketingSpend
      : Math.max(0, Math.min(100_000, Number(estimate.marketingSpend) || 0));
  const churnRate = Math.max(
    0,
    Math.min(100, Number(estimate.churnRate) || 13)
  );
  const emailsPerUser = Math.max(0, Number(estimate.emailsPerUser) || 5);
  const blobAvgFileSize = Math.max(0.1, Number(estimate.blobAvgFileSize) || 2);
  const blobUploadsPerUser = Math.max(
    0,
    Number(estimate.blobUploadsPerUser) || 10
  );
  const costPerAPICall = Math.max(0, Number(estimate.costPerAPICall) || 0.01);
  const apiCallsPerUser = Math.max(0, Number(estimate.apiCallsPerUser) || 10);
  const confidenceScore = Math.max(
    0,
    Math.min(100, Number(estimate.confidenceScore) || 50)
  );

  // Validate blob content type
  const validContentTypes = ["Images", "Videos", "Documents", "Mixed"];
  const blobContentType = validContentTypes.includes(
    String(estimate.blobContentType)
  )
    ? (estimate.blobContentType as "Images" | "Videos" | "Documents" | "Mixed")
    : "Images";

  // Validate packages
  let packagesArray: unknown[] = [];
  if (Array.isArray(estimate.packages)) {
    packagesArray = estimate.packages;
  }

  if (packagesArray.length < 2) {
    // Fallback: ensure we always have at least 2 packages
    console.warn("AI returned fewer than 2 packages, adding default packages");
    packagesArray = [
      { name: "Free", price: 0, conversionRate: 95 },
      { name: "Pro", price: 19, conversionRate: 5 },
    ];
  }

  const packages = packagesArray.map((pkg: unknown) => {
    if (typeof pkg !== "object" || pkg === null) {
      throw new Error("Invalid package format");
    }
    const p = pkg as Record<string, unknown>;
    return {
      name: String(p.name || ""),
      price: Math.max(0, Number(p.price) || 0),
      conversionRate: Math.max(0, Math.min(100, Number(p.conversionRate) || 0)),
    };
  });

  // Ensure we have at least 2 packages after mapping (in case some were invalid)
  if (packages.length < 2) {
    console.warn(
      "After validation, fewer than 2 packages remain, adding defaults"
    );
    packages.push(
      { name: "Free", price: 0, conversionRate: 95 },
      { name: "Pro", price: 19, conversionRate: 5 }
    );
    // Remove duplicates and keep only first 2
    const uniquePackages = packages.slice(0, 2);
    const tooltips = estimate.tooltips || {
      database:
        "Stores your app's data, user accounts, and handles real-time updates",
      cloudflare:
        "Serves your web application frontend globally via Cloudflare Workers (static hosting, edge computing for frontend assets)",
      fileStorage:
        "Stores user-uploaded files like images, videos, and documents",
      sendingEmails:
        "Transactional emails like welcome messages, password resets, and notifications",
      loggingAndMonitoring:
        "Tracks errors and performance issues to help you debug and improve your app",
      aiApiCosts:
        "Costs for AI features like chat, content generation, or image analysis",
    };
    return {
      ...estimate,
      packages: uniquePackages,
      tooltips,
    } as EstimateResponse;
  }

  // Validate and provide defaults for tooltips
  const tooltipsRaw = estimate.tooltips;
  let tooltips: EstimateResponse["tooltips"];
  if (
    typeof tooltipsRaw === "object" &&
    tooltipsRaw !== null &&
    "database" in tooltipsRaw &&
    "cloudflare" in tooltipsRaw &&
    "fileStorage" in tooltipsRaw &&
    "sendingEmails" in tooltipsRaw &&
    "loggingAndMonitoring" in tooltipsRaw &&
    "aiApiCosts" in tooltipsRaw
  ) {
    tooltips = {
      database: String(tooltipsRaw.database || ""),
      cloudflare: String(tooltipsRaw.cloudflare || ""),
      fileStorage: String(tooltipsRaw.fileStorage || ""),
      sendingEmails: String(tooltipsRaw.sendingEmails || ""),
      loggingAndMonitoring: String(tooltipsRaw.loggingAndMonitoring || ""),
      aiApiCosts: String(tooltipsRaw.aiApiCosts || ""),
    };
  } else {
    tooltips = {
      database:
        "Stores your app's data, user accounts, and handles real-time updates",
      cloudflare:
        "Serves your web application frontend globally via Cloudflare Workers (static hosting, edge computing for frontend assets)",
      fileStorage:
        "Stores user-uploaded files like images, videos, and documents",
      sendingEmails:
        "Transactional emails like welcome messages, password resets, and notifications",
      loggingAndMonitoring:
        "Tracks errors and performance issues to help you debug and improve your app",
      aiApiCosts:
        "Costs for AI features like chat, content generation, or image analysis",
    };
  }

  return {
    devs,
    devSalary,
    marketingSpend,
    churnRate,
    emailsPerUser,
    blobContentType,
    blobAvgFileSize,
    blobUploadsPerUser,
    costPerAPICall,
    apiCallsPerUser,
    packages,
    confidenceScore,
    tooltips,
  };
}

const VALIDATION_PROMPT = `You are a product idea validator. Your task is to determine if a given text describes a valid, coherent product idea.

A valid product idea should:
- Describe a software product, service, or application
- Be coherent and meaningful (not gibberish, random characters, or keyboard mashing)
- Have at least some context about what the product does or who it's for
- Be at least 10 characters long

Invalid examples:
- "asdfghjkl" (keyboard mashing)
- "aaaa" (repeated characters)
- "123456" (just numbers)
- "hi" (too short, no context)
- Random character sequences
- Test inputs like "test" or "hello world" without product context

Valid examples:
- "A social media app for photographers"
- "Task management tool for remote teams"
- "AI-powered writing assistant"
- "E-commerce marketplace for handmade goods"
- "A simple todo app"

Return a JSON object with:
- "isValid": boolean - true if it's a valid product idea, false otherwise
- "reason": string - brief explanation of why it's valid or invalid (1-2 sentences)

Be strict but reasonable. If there's any doubt about whether it's a real product idea, return false.`;

export const validateProductIdea = action({
  args: {
    ideaDescription: v.string(),
  },
  returns: v.object({
    isValid: v.boolean(),
    reason: v.string(),
  }),
  handler: async (ctx, args) => {
    const trimmed = args.ideaDescription.trim();

    // Quick client-side checks first (to save API calls)
    if (trimmed.length < 10) {
      return {
        isValid: false,
        reason:
          "Product description is too short. Please provide at least 10 characters.",
      };
    }

    // Check for obvious gibberish patterns before calling AI
    // Only check alphanumeric characters for repetition (ignore punctuation/whitespace)
    const repeatedPattern = /([a-zA-Z0-9])\1{7,}/;
    if (repeatedPattern.test(trimmed)) {
      return {
        isValid: false,
        reason: "Input appears to be gibberish (repeated characters).",
      };
    }

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: VALIDATION_PROMPT },
          { role: "user", content: `Product idea: ${trimmed}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return {
          isValid: false,
          reason: "Unable to validate product idea. Please try again.",
        };
      }

      const parsed = JSON.parse(content);

      if (
        typeof parsed.isValid !== "boolean" ||
        typeof parsed.reason !== "string"
      ) {
        return {
          isValid: false,
          reason: "Invalid validation response format.",
        };
      }

      return {
        isValid: parsed.isValid,
        reason: parsed.reason,
      };
    } catch (error) {
      console.error("Product idea validation error:", error);
      // Fallback to basic validation on error
      const letters = trimmed.match(/[a-zA-Z]/g)?.length || 0;
      const letterRatio = letters / trimmed.length;
      const hasValidWord = /\b[a-zA-Z]{3,}\b/.test(trimmed);

      if (letterRatio < 0.3 || !hasValidWord) {
        return {
          isValid: false,
          reason: "Input doesn't appear to be a valid product description.",
        };
      }

      // If basic checks pass but AI failed, allow it (fail open)
      return {
        isValid: true,
        reason: "Validation check passed.",
      };
    }
  },
});

const BOILERPLATE_FIT_PROMPT = `You're helping someone figure out if this boilerplate makes sense for their product idea. Be real, casual, and helpful - like you're chatting with a friend about their startup.

**The Boilerplate:**
- Convex: Handles ALL backend functionality - backend-as-a-service with real-time database, serverless functions, automatic sync, file storage, scheduled functions (cron), and actions for external APIs. All backend logic, API endpoints, and database operations run on Convex.
- Cloudflare Workers: ONLY for frontend - serves the web application, handles static hosting, edge computing for frontend assets. Does NOT handle backend logic or database operations in this boilerplate.
- BetterAuth: Authentication with 2FA, Passkeys, SSO, and organization support
- Polar.sh: Subscription payments and billing
- Resend: Email API with React Email templates
- Cloudflare R2: Object storage with zero egress fees

**Stuff you can easily add:**
- AI SDKs (OpenAI, Anthropic, etc.) for AI features
- n8n, Zapier, or Make.com for complex automations
- Convex Components for third-party services
- Any REST API can be called from Convex actions

**This works great for:**
- SaaS / Subscription products
- Real-time collaborative apps (chat, docs, whiteboards)
- Dashboards / Analytics tools
- Apps needing real-time data sync
- Edge/serverless deployment (frontend via Cloudflare Workers, backend via Convex)
- Complex data processing (Convex actions handle all backend processing)
- Heavy relational needs (Convex database handles all data needs)
- Message queues and background jobs (Convex scheduled functions handle all background processing)
- API integrations and automations (Convex actions + n8n/Zapier)

**Say "no" if:**
- API-only backend without any frontend/web interface (this boilerplate includes full frontend)
- Must use traditional server deployment (not edge/serverless) - like if they specifically need long-running processes, WebSockets on traditional servers, or can't use edge/serverless
- Requires heavy GPU computing or specialized hardware that can't be accessed via API
- Mobile-only native app with zero web component (though web apps work great on mobile)
- The idea isn't actually a software product (physical products, services without software, etc.)
- Requires enterprise software integrations that can't be done via REST APIs or webhooks

**Say "maybe" if:**
- It could work but might need significant custom workarounds
- The idea is vague or unclear - hard to tell if it fits
- It's a very niche use case that might be better served by specialized tools

**Say "yes" if:**
- It's a web app, SaaS, or software product that can run on edge/serverless
- It needs real-time features, payments, auth, or any of the stack's strengths
- Even if complex, the stack can handle it with the right approach

**Your vibe:**
- Be generous - Convex handles all backend scalability and can handle complex backend stuff, Cloudflare Workers handles frontend scalability
- Talk like a human, not a robot. Use casual language, contractions, and be conversational
- Suggest specific features naturally (e.g., "Convex scheduled functions would handle the background stuff" or "Convex actions can call external APIs for that integration")
- Mention third-party tools if they help (e.g., "n8n would be perfect for those CRM automations")
- Focus on "can you build this?" not "is this the perfect fit"
- Be honest - if something genuinely doesn't fit, say "no" and explain why clearly
- If it's a legitimate software product idea, lean toward "yes" or "maybe" - but don't be afraid to say "no" when it really doesn't make sense

Analyze the product idea and figure out if this boilerplate can handle it.

Return a JSON object with:
- "recommendation": "yes" | "maybe" | "no" - can this boilerplate handle it?
- "reason": string - 2-3 sentences explaining your take, written casually like you're talking to them
- "keyPoints": array of strings - Only include if recommendation is "yes" or "maybe":
  * For "yes" or "maybe": 3-5 points with specific suggestions:
    - Mention relevant Convex backend features (scheduled functions, actions, file storage, real-time subscriptions, etc.)
    - Note: Cloudflare Workers is only used for frontend serving in this boilerplate, all backend logic uses Convex
    - Suggest third-party integrations if helpful (n8n, AI SDKs, etc.)
    - Write these like you're giving advice to a friend - casual, helpful, no corporate speak
  * For "no": Return an empty array [] - don't include suggestions since it's not a good fit

Write like a human developer giving honest, helpful advice. No marketing fluff, no overly formal language. Just real talk about whether this stack works for their idea.`;

async function searchRelevantLibraries(productIdea: string): Promise<string[]> {
  try {
    // Extract key terms from the product idea for search
    const searchTerms = extractSearchTerms(productIdea);

    // Use Tavily Search API for AI-powered search
    const tavilyApiKey = process.env.TAVILY_API_KEY;
    if (!tavilyApiKey) {
      console.warn("TAVILY_API_KEY not set, skipping library search");
      return [];
    }

    const searchQueries = [
      `${searchTerms} npm package TypeScript`,
      `${searchTerms} integration library Convex Cloudflare`,
      `${searchTerms} automation tool API`,
    ];

    const allResults: string[] = [];

    for (const query of searchQueries.slice(0, 2)) {
      // Limit to 2 queries to save API calls
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query,
            search_depth: "basic",
            include_answer: false,
            max_results: 5,
          }),
        });

        if (!response.ok) {
          console.warn(`Tavily search failed: ${response.statusText}`);
          continue;
        }

        const data = (await response.json()) as {
          results?: Array<{ title: string; url: string; content: string }>;
        };

        if (data.results) {
          // Extract library names from results
          const libraries = data.results
            .map((result) => {
              // Try to extract npm package names or library names
              const npmMatch = result.content.match(
                /(?:npm|package)[\s:]+([@\w/-]+)/i
              );
              const titleMatch = result.title.match(/([\w-]+(?:\.js|\.ts)?)/i);
              return npmMatch?.[1] || titleMatch?.[1];
            })
            .filter((lib): lib is string => !!lib && lib.length > 2)
            .slice(0, 3);

          allResults.push(...libraries);
        }
      } catch (error) {
        console.warn(`Error searching for libraries: ${error}`);
        // Continue with other queries
      }
    }

    // Deduplicate and return
    return Array.from(new Set(allResults)).slice(0, 5);
  } catch (error) {
    console.error("Library search error:", error);
    return [];
  }
}

function extractSearchTerms(productIdea: string): string {
  // Extract key technical terms and features
  const lower = productIdea.toLowerCase();
  const keywords: string[] = [];

  // Common technical terms
  if (lower.includes("crm") || lower.includes("customer relationship"))
    keywords.push("CRM");
  if (lower.includes("automation") || lower.includes("workflow"))
    keywords.push("automation");
  if (lower.includes("matching") || lower.includes("algorithm"))
    keywords.push("matching algorithm");
  if (lower.includes("email") || lower.includes("notification"))
    keywords.push("email automation");
  if (lower.includes("integration") || lower.includes("sync"))
    keywords.push("API integration");
  if (lower.includes("analytics") || lower.includes("reporting"))
    keywords.push("analytics");
  if (lower.includes("ai") || lower.includes("machine learning"))
    keywords.push("AI");
  if (lower.includes("queue") || lower.includes("background"))
    keywords.push("background jobs");

  // Extract main product type (first few words)
  const words = productIdea.split(/\s+/).slice(0, 3);
  keywords.push(...words.filter((w) => w.length > 3));

  return keywords.join(" ") || productIdea.substring(0, 50);
}

export const checkBoilerplateFit = action({
  args: {
    ideaDescription: v.string(),
  },
  returns: v.object({
    recommendation: v.union(
      v.literal("yes"),
      v.literal("maybe"),
      v.literal("no")
    ),
    reason: v.string(),
    keyPoints: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const trimmed = args.ideaDescription.trim();

    if (trimmed.length < 10) {
      return {
        recommendation: "no",
        reason: "Product description is too short to evaluate.",
        keyPoints: ["Please provide more details about your product idea"],
      };
    }

    // Search for relevant libraries
    const relevantLibraries = await searchRelevantLibraries(trimmed);

    // Build enhanced prompt with library suggestions
    let enhancedPrompt = BOILERPLATE_FIT_PROMPT;
    if (relevantLibraries.length > 0) {
      enhancedPrompt += `\n\n**Found relevant libraries/tools for this product idea (from web search):**\n${relevantLibraries.map((lib) => `- ${lib}`).join("\n")}\n\nInclude these specific libraries in your keyPoints if they're relevant to the product idea. Only mention libraries that actually make sense for the use case - don't force them if they don't fit.`;
    } else {
      // If web search didn't find anything, ask AI to suggest relevant libraries
      enhancedPrompt +=
        "\n\n**Important:** Based on the product idea, suggest specific npm packages, libraries, or tools that would be useful. For example: n8n for automations, @ai-sdk packages for AI features, specific CRM integration libraries, etc. Only suggest libraries that actually make sense for this specific product idea.";
    }

    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedPrompt },
          { role: "user", content: `Product idea: ${trimmed}` },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return {
          recommendation: "maybe",
          reason: "Unable to evaluate product idea. Please try again.",
          keyPoints: ["Evaluation service temporarily unavailable"],
        };
      }

      const parsed = JSON.parse(content);

      if (
        !["yes", "maybe", "no"].includes(parsed.recommendation) ||
        typeof parsed.reason !== "string" ||
        !Array.isArray(parsed.keyPoints)
      ) {
        return {
          recommendation: "maybe",
          reason: "Invalid evaluation response format.",
          keyPoints: ["Please try again"],
        };
      }

      return {
        recommendation: parsed.recommendation,
        reason: parsed.reason,
        keyPoints: parsed.keyPoints.slice(0, 5), // Limit to 5 points
      };
    } catch (error) {
      console.error("Boilerplate fit check error:", error);
      return {
        recommendation: "maybe",
        reason:
          "Unable to evaluate product idea at this time. Please try again.",
        keyPoints: ["Service temporarily unavailable"],
      };
    }
  },
});

export const estimateInfrastructureCosts = action({
  args: {
    ideaDescription: v.string(),
    mau: v.number(),
    currentValues: v.optional(
      v.object({
        devs: v.optional(v.number()),
        devSalary: v.optional(v.number()),
        marketingSpend: v.optional(v.number()),
        churnRate: v.optional(v.number()),
        emailsPerUser: v.optional(v.number()),
        blobContentType: v.optional(v.string()),
        blobAvgFileSize: v.optional(v.number()),
        blobUploadsPerUser: v.optional(v.number()),
        costPerAPICall: v.optional(v.number()),
        apiCallsPerUser: v.optional(v.number()),
      })
    ),
  },
  returns: v.object({
    devs: v.number(),
    devSalary: v.number(),
    marketingSpend: v.number(),
    churnRate: v.number(),
    emailsPerUser: v.number(),
    blobContentType: v.union(
      v.literal("Images"),
      v.literal("Videos"),
      v.literal("Documents"),
      v.literal("Mixed")
    ),
    blobAvgFileSize: v.number(),
    blobUploadsPerUser: v.number(),
    costPerAPICall: v.number(),
    apiCallsPerUser: v.number(),
    packages: v.array(
      v.object({
        name: v.string(),
        price: v.number(),
        conversionRate: v.number(),
      })
    ),
    confidenceScore: v.number(),
    tooltips: v.object({
      database: v.string(),
      cloudflare: v.string(),
      fileStorage: v.string(),
      sendingEmails: v.string(),
      loggingAndMonitoring: v.string(),
      aiApiCosts: v.string(),
    }),
  }),
  handler: async (ctx, args) => {
    // Rate limiting - create identifier from idea description hash for anonymous users
    // In production, consider using IP address or session ID
    // Create a simple identifier - in production you'd use IP or session
    // For now, use a hash of the description (first 100 chars) + hour timestamp
    const hourTimestamp = Math.floor(Date.now() / (60 * 60 * 1000));
    const identifier = `estimate-${args.ideaDescription.slice(0, 100).replace(/[^a-zA-Z0-9]/g, "-")}-${hourTimestamp}`;

    const { ok, retryAfter } = await rateLimiter.limit(ctx, "costEstimator", {
      key: identifier,
    });

    if (!ok) {
      const retryMinutes = retryAfter ? Math.ceil(retryAfter / 60) : 60;
      throw new Error(
        `You've reached the limit of 5 estimates per hour. Please try again in ${retryMinutes} minutes.`
      );
    }

    // Build user prompt
    let userPrompt = `Product idea: ${args.ideaDescription}\n\nCurrent MAU: ${args.mau.toLocaleString()}`;

    if (args.currentValues) {
      userPrompt += "\n\nCurrent settings:";
      if (args.currentValues.devs !== undefined) {
        userPrompt += `\n- Developer seats: ${args.currentValues.devs}`;
      }
      if (args.currentValues.marketingSpend !== undefined) {
        userPrompt += `\n- Marketing spend: $${args.currentValues.marketingSpend} (CRITICAL: Use this exact value, do not change it)`;
      }
      // Add other current values if needed
    }

    userPrompt +=
      "\n\nIMPORTANT: For marketing spend, use the current value provided above. Do not estimate or change it. For all other parameters, provide estimates based on the product description.";

    // Call OpenAI
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content);
      const validated = validateEstimate(
        parsed,
        args.currentValues?.marketingSpend
      );

      return validated;
    } catch (error) {
      console.error("AI estimation error:", error);
      if (error instanceof Error && error.message.includes("limit")) {
        throw error;
      }
      throw new Error(
        "AI estimation failed. Please try again or configure manually."
      );
    }
  },
});

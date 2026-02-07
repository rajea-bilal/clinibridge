import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Clinical trial searches
  searches: defineTable({
    createdAt: v.number(),
    mode: v.union(v.literal("chat"), v.literal("form")),
    condition: v.string(),
    age: v.number(),
    location: v.string(),
    medications: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
    results: v.array(
      v.object({
        nctId: v.string(),
        title: v.string(),
        summary: v.string(),
        status: v.string(),
        phase: v.string(),
        conditions: v.array(v.string()),
        eligibility: v.string(),
        eligibilityFull: v.optional(v.string()),
        ageRange: v.string(),
        locations: v.array(v.string()),
        interventions: v.array(v.string()),
        sponsor: v.string(),
        matchScore: v.number(),
        matchLabel: v.optional(v.string()),
        matchReason: v.optional(v.string()),
        url: v.string(),
      })
    ),
  }).index("by_createdAt", ["createdAt"]),

  // Chat sessions
  chatSessions: defineTable({
    createdAt: v.number(),
    title: v.optional(v.string()),
    messages: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
        createdAt: v.number(),
      })
    ),
  }).index("by_createdAt", ["createdAt"]),


  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.string(), // BetterAuth user._id
  }).index("by_userId", ["userId"]),

  // User profiles (linked to BetterAuth user._id)
  userProfiles: defineTable({
    userId: v.string(), // BetterAuth user._id
    hasOnboarded: v.boolean(),
    isAdmin: v.optional(v.boolean()), // Admin flag for access control
  }).index("by_userId", ["userId"]),

  // Waitlist entries (for waitlist feature)
  waitlist: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    approved: v.boolean(),
    invitedAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  }).index("by_email", ["email"]),

  // Pending admins (emails that should be admin when they sign up)
  pendingAdmins: defineTable({
    email: v.string(),
  }).index("by_email", ["email"]),

  // Active subscriptions (linked to BetterAuth user._id)
  subscriptions: defineTable({
    userId: v.optional(v.string()), // BetterAuth user._id
    polarId: v.optional(v.string()),
    polarPriceId: v.optional(v.string()),
    currency: v.optional(v.string()),
    interval: v.optional(v.string()),
    status: v.optional(v.string()),
    currentPeriodStart: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    amount: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    customerCancellationReason: v.optional(v.string()),
    customerCancellationComment: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customFieldData: v.optional(v.any()),
    customerId: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_polarId", ["polarId"]),

  // One-time payments (linked to BetterAuth user._id)
  payments: defineTable({
    polarId: v.string(),
    polarPriceId: v.string(),
    currency: v.string(),
    amount: v.number(),
    status: v.string(),
    productType: v.string(),
    paidAt: v.number(),
    metadata: v.optional(v.any()),
    customerId: v.optional(v.string()),
    userId: v.string(), // BetterAuth user._id
  })
    .index("by_userId", ["userId"])
    .index("by_polarId", ["polarId"]),

  // Webhook event log
  webhookEvents: defineTable({
    id: v.optional(v.string()),
    type: v.string(),
    polarEventId: v.string(),
    createdAt: v.string(),
    modifiedAt: v.string(),
    data: v.any(),
    processed: v.optional(v.boolean()),
    created_at: v.optional(v.number()),
    webhookId: v.optional(v.string()),
    processingStatus: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  })
    .index("by_type", ["type"])
    .index("by_polarEventId", ["polarEventId"])
    .index("by_webhook_id", ["webhookId"]),
});

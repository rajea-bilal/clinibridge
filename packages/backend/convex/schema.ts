import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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

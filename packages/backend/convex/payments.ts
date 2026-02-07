import { v } from "convex/values";
import { api } from "./_generated/api";
import { action, httpAction, mutation, query } from "./_generated/server";

// REST API helpers to avoid loading the full Polar SDK (reduces memory usage)
const getPolarBaseUrl = () => {
  const server =
    (process.env.POLAR_SERVER as "sandbox" | "production") || "sandbox";
  return server === "sandbox"
    ? "https://sandbox-api.polar.sh"
    : "https://api.polar.sh";
};

const getPolarHeaders = () => {
  if (!process.env.POLAR_ACCESS_TOKEN) {
    throw new Error("POLAR_ACCESS_TOKEN is not configured");
  }
  return {
    Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
};

// Helper to create checkout using REST API
const createCheckout = async ({
  customerEmail,
  productPriceId,
  successUrl,
  metadata,
}: {
  customerEmail: string;
  productPriceId: string;
  successUrl: string;
  metadata?: Record<string, string>;
}) => {
  if (!process.env.POLAR_ORGANIZATION_ID) {
    throw new Error("POLAR_ORGANIZATION_ID is not configured");
  }

  const baseUrl = getPolarBaseUrl();
  const headers = getPolarHeaders();

  // Get product ID from price ID using REST API
  const productsResponse = await fetch(
    `${baseUrl}/v1/products?organization_id=${process.env.POLAR_ORGANIZATION_ID}&is_archived=false`,
    { headers }
  );

  if (!productsResponse.ok) {
    throw new Error(`Failed to fetch products: ${productsResponse.statusText}`);
  }

  const productsData = await productsResponse.json();
  let productId: string | null = null;

  for (const product of productsData.items || []) {
    const hasPrice = product.prices?.some(
      (price: any) => price.id === productPriceId
    );
    if (hasPrice) {
      productId = product.id;
      break;
    }
  }

  if (!productId) {
    throw new Error(`Product not found for price ID: ${productPriceId}`);
  }

  // Create checkout using REST API
  const checkoutResponse = await fetch(`${baseUrl}/v1/checkouts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      product_id: productId,
      success_url: successUrl,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        priceId: productPriceId,
      },
    }),
  });

  if (!checkoutResponse.ok) {
    const error = await checkoutResponse.text();
    throw new Error(
      `Failed to create checkout: ${checkoutResponse.statusText} - ${error}`
    );
  }

  const checkout = await checkoutResponse.json();
  return checkout;
};

// Fetch available products/plans from Polar using REST API
export const getAvailablePlans = action({
  args: {},
  returns: v.any(),
  handler: async (_ctx) => {
    if (!process.env.POLAR_ORGANIZATION_ID) {
      throw new Error("POLAR_ORGANIZATION_ID is not configured");
    }

    const baseUrl = getPolarBaseUrl();
    const headers = getPolarHeaders();

    const response = await fetch(
      `${baseUrl}/v1/products?organization_id=${process.env.POLAR_ORGANIZATION_ID}&is_archived=false`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const result = await response.json();

    // Transform the data to remove Date objects and keep only needed fields
    const cleanedItems = (result.items || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      isRecurring: item.is_recurring,
      prices: (item.prices || []).map((price: any) => ({
        id: price.id,
        amount: price.price_amount,
        currency: price.price_currency,
        interval: price.recurring_interval,
      })),
    }));

    return {
      items: cleanedItems,
      pagination: result.pagination || {},
    };
  },
});

// Create checkout session
export const createCheckoutSession = action({
  args: {
    productId: v.string(), // Note: We accept productId but need to find priceId
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!process.env.POLAR_ORGANIZATION_ID) {
      throw new Error("Polar not configured");
    }

    const baseUrl = getPolarBaseUrl();
    const headers = getPolarHeaders();

    // Get product to find the first price ID using REST API
    const response = await fetch(
      `${baseUrl}/v1/products?organization_id=${process.env.POLAR_ORGANIZATION_ID}&is_archived=false`,
      { headers }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const result = await response.json();
    const product = result.items?.find((p: any) => p.id === args.productId);
    if (!(product && product.prices?.[0])) {
      throw new Error(`Product not found or has no prices: ${args.productId}`);
    }

    const priceId = product.prices[0].id;

    const checkout = await createCheckout({
      customerEmail: user.email!,
      productPriceId: priceId,
      successUrl: `${process.env.SITE_URL}/success`,
      metadata: {
        userId: user._id,
      },
    });

    return checkout.url;
  },
});

// Check user subscription status
export const checkUserSubscriptionStatus = query({
  args: {
    userId: v.optional(v.string()),
  },
  returns: v.object({
    hasActiveSubscription: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let userId: string;

    if (args.userId) {
      userId = args.userId;
    } else {
      const user: any = await ctx.runQuery(api.auth.getCurrentUser);
      if (!user) {
        return { hasActiveSubscription: false };
      }
      userId = user._id;
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const hasActiveSubscription = subscription?.status === "active";

    return { hasActiveSubscription };
  },
});

// Fetch user subscription
export const fetchUserSubscription = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);
    if (!user) {
      return null;
    }

    const subscription: any = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();

    return subscription || null;
  },
});

// Check if user has active subscription or one-time payment
export const hasActivePurchase = query({
  args: {},
  returns: v.object({
    hasPurchase: v.boolean(),
    type: v.union(v.literal("subscription"), v.literal("payment"), v.null()),
  }),
  handler: async (ctx) => {
    const user: any = await ctx.runQuery(api.auth.getCurrentUser);
    if (!user) {
      return { hasPurchase: false, type: null } as const;
    }

    // Check for active subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();

    if (subscription && subscription.status === "active") {
      return { hasPurchase: true, type: "subscription" as const };
    }

    // Check for one-time payment
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_userId", (q: any) => q.eq("userId", user._id))
      .first();

    if (payment && payment.status === "completed") {
      return { hasPurchase: true, type: "payment" as const };
    }

    return { hasPurchase: false, type: null } as const;
  },
});

// Create customer portal URL
export const createCustomerPortalUrl = action({
  args: {
    customerId: v.string(),
  },
  returns: v.object({
    url: v.string(),
  }),
  handler: async (_ctx, args) => {
    const baseUrl = getPolarBaseUrl();
    const headers = getPolarHeaders();

    try {
      const response = await fetch(`${baseUrl}/v1/customer-sessions`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          customer_id: args.customerId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Failed to create customer session: ${response.statusText} - ${error}`
        );
      }

      const result = await response.json();
      return { url: result.customer_portal_url };
    } catch (error) {
      console.error("Error creating customer session:", error);
      throw new Error("Failed to create customer session");
    }
  },
});

// Handle webhook events
export const handleWebhookEvent = mutation({
  args: {
    body: v.any(),
    webhookId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventType = args.body.type;
    const webhookId = args.webhookId || args.body.id;

    // Check if this webhook has already been processed (deduplication)
    const existingWebhook = webhookId
      ? await ctx.db
          .query("webhookEvents")
          .withIndex("by_webhook_id", (q) => q.eq("webhookId", webhookId))
          .first()
      : null;

    if (existingWebhook) {
      console.log(
        "⏭️ Webhook already processed, skipping:",
        webhookId || "unknown_id"
      );
      return {
        success: true,
        message: "Webhook already processed",
        alreadyProcessed: true,
      };
    }

    // Store webhook event with processing status
    const webhookEventId = await ctx.db.insert("webhookEvents", {
      id: args.body.id,
      type: eventType,
      polarEventId: args.body.data.id,
      createdAt: args.body.data.created_at,
      modifiedAt: args.body.data.modified_at || args.body.data.created_at,
      data: args.body.data,
      processed: false,
      created_at: Date.now(),
      webhookId,
      processingStatus: "processing",
      processedAt: undefined,
      errorMessage: undefined,
    });

    try {
      switch (eventType) {
        case "payment.created": {
          console.log(
            "💳 Creating new payment record for userId:",
            args.body.data.metadata.userId
          );

          // userId in metadata is the BetterAuth user._id (string)
          const userId = args.body.data.metadata.userId;
          if (!userId) {
            throw new Error("User ID not found in payment metadata");
          }

          // Determine product type from metadata or price ID
          const productType =
            args.body.data.metadata?.productType || "lifetime";

          // Insert new payment
          await ctx.db.insert("payments", {
            polarId: args.body.data.id,
            polarPriceId: args.body.data.price_id,
            currency: args.body.data.currency,
            amount: args.body.data.amount,
            status: args.body.data.status,
            productType,
            paidAt: args.body.data.created_at
              ? new Date(args.body.data.created_at).getTime()
              : Date.now(),
            metadata: args.body.data.metadata || {},
            customerId: args.body.data.customer_id,
            userId, // BetterAuth user._id
          });
          console.log("✅ Payment record created successfully");
          break;
        }

        case "subscription.created":
          console.log(
            "📝 Creating new subscription record for userId:",
            args.body.data.metadata.userId
          );
          await ctx.db.insert("subscriptions", {
            polarId: args.body.data.id,
            polarPriceId: args.body.data.price_id,
            currency: args.body.data.currency,
            interval: args.body.data.recurring_interval,
            userId: args.body.data.metadata.userId,
            status: args.body.data.status,
            currentPeriodStart: new Date(
              args.body.data.current_period_start
            ).getTime(),
            currentPeriodEnd: new Date(
              args.body.data.current_period_end
            ).getTime(),
            cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
            amount: args.body.data.amount,
            startedAt: new Date(args.body.data.started_at).getTime(),
            endedAt: args.body.data.ended_at
              ? new Date(args.body.data.ended_at).getTime()
              : undefined,
            canceledAt: args.body.data.canceled_at
              ? new Date(args.body.data.canceled_at).getTime()
              : undefined,
            customerCancellationReason:
              args.body.data.customer_cancellation_reason || undefined,
            customerCancellationComment:
              args.body.data.customer_cancellation_comment || undefined,
            metadata: args.body.data.metadata || {},
            customFieldData: args.body.data.custom_field_data || {},
            customerId: args.body.data.customer_id,
          });
          console.log("✅ Subscription record created successfully");
          break;

        case "subscription.updated": {
          const existingSubUpdated = await ctx.db
            .query("subscriptions")
            .withIndex("by_polarId", (q) => q.eq("polarId", args.body.data.id))
            .first();

          if (existingSubUpdated) {
            await ctx.db.patch(existingSubUpdated._id, {
              amount: args.body.data.amount,
              status: args.body.data.status,
              currentPeriodStart: new Date(
                args.body.data.current_period_start
              ).getTime(),
              currentPeriodEnd: new Date(
                args.body.data.current_period_end
              ).getTime(),
              cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
              metadata: args.body.data.metadata || {},
              customFieldData: args.body.data.custom_field_data || {},
            });
          }
          break;
        }

        case "subscription.active": {
          // Check if subscription already exists
          const existingSubActive = await ctx.db
            .query("subscriptions")
            .withIndex("by_polarId", (q) => q.eq("polarId", args.body.data.id))
            .first();

          if (existingSubActive) {
            // Update existing subscription
            await ctx.db.patch(existingSubActive._id, {
              amount: args.body.data.amount,
              status: args.body.data.status,
              currentPeriodStart: new Date(
                args.body.data.current_period_start
              ).getTime(),
              currentPeriodEnd: new Date(
                args.body.data.current_period_end
              ).getTime(),
              cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
              metadata: args.body.data.metadata || {},
            });
          } else {
            // Create new subscription if it doesn't exist (Polar sometimes sends active before created)
            await ctx.db.insert("subscriptions", {
              polarId: args.body.data.id,
              polarPriceId: args.body.data.price_id,
              currency: args.body.data.currency,
              interval: args.body.data.recurring_interval,
              userId: args.body.data.metadata?.userId,
              status: args.body.data.status,
              currentPeriodStart: new Date(
                args.body.data.current_period_start
              ).getTime(),
              currentPeriodEnd: new Date(
                args.body.data.current_period_end
              ).getTime(),
              cancelAtPeriodEnd: args.body.data.cancel_at_period_end,
              amount: args.body.data.amount,
              startedAt: args.body.data.started_at
                ? new Date(args.body.data.started_at).getTime()
                : Date.now(),
              metadata: args.body.data.metadata || {},
              customFieldData: args.body.data.custom_field_data || {},
              customerId: args.body.data.customer_id,
            });
          }
          break;
        }

        case "subscription.canceled": {
          const canceledSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_polarId", (q) => q.eq("polarId", args.body.data.id))
            .first();

          if (canceledSub) {
            await ctx.db.patch(canceledSub._id, {
              status: args.body.data.status,
              canceledAt: args.body.data.canceled_at
                ? new Date(args.body.data.canceled_at).getTime()
                : undefined,
              customerCancellationReason:
                args.body.data.customer_cancellation_reason || undefined,
              customerCancellationComment:
                args.body.data.customer_cancellation_comment || undefined,
            });
          }
          break;
        }

        case "subscription.uncanceled": {
          const uncanceledSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_polarId", (q) => q.eq("polarId", args.body.data.id))
            .first();

          if (uncanceledSub) {
            await ctx.db.patch(uncanceledSub._id, {
              status: args.body.data.status,
              cancelAtPeriodEnd: false,
              canceledAt: undefined,
              customerCancellationReason: undefined,
              customerCancellationComment: undefined,
            });
          }
          break;
        }

        case "subscription.revoked": {
          const revokedSub = await ctx.db
            .query("subscriptions")
            .withIndex("by_polarId", (q) => q.eq("polarId", args.body.data.id))
            .first();

          if (revokedSub) {
            await ctx.db.patch(revokedSub._id, {
              status: "revoked",
              endedAt: args.body.data.ended_at
                ? new Date(args.body.data.ended_at).getTime()
                : undefined,
            });
          }
          break;
        }

        case "order.created": {
          // For subscriptions, orders are created but we already track them in the subscriptions table
          // Only create a payment record if this is a one-time purchase (not recurring)
          console.log("📦 Order created event received");

          // Check if this order is for a subscription by looking for existing subscription
          const existingSubscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_userId", (q) =>
              q.eq("userId", args.body.data.metadata?.userId)
            )
            .first();

          // Only insert payment if it's NOT part of a subscription
          if (existingSubscription) {
            console.log(
              "ℹ️ Order is part of existing subscription, skipping payment record"
            );
          } else {
            await ctx.db.insert("payments", {
              polarId: args.body.data.id,
              polarPriceId: args.body.data.product_price_id,
              currency: args.body.data.amount_currency || "usd", // Default to USD if not provided
              amount: args.body.data.amount,
              status: "completed",
              productType: args.body.data.metadata?.productType || "lifetime",
              paidAt: args.body.data.created_at
                ? new Date(args.body.data.created_at).getTime()
                : Date.now(),
              metadata: args.body.data.metadata || {},
              customerId: args.body.data.customer_id,
              userId: args.body.data.metadata.userId,
            });
            console.log("✅ Payment record created for one-time purchase");
          }
          break;
        }

        default:
          console.log(`Unhandled event type: ${eventType}`);
          break;
      }

      // Mark webhook as successfully processed
      await ctx.db.patch(webhookEventId, {
        processingStatus: "completed",
        processedAt: Date.now(),
        processed: true,
      });

      console.log("✅ Webhook processed successfully:", webhookId);
      return { success: true, message: "Webhook processed successfully" };
    } catch (error) {
      // Mark webhook as failed
      await ctx.db.patch(webhookEventId, {
        processingStatus: "failed",
        processedAt: Date.now(),
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      console.error("❌ Webhook processing failed:", error);
      throw error; // Re-throw to trigger Convex retry logic
    }
  },
});

// Manual webhook validation using Web Crypto API (Convex V8 compatible)
// Polar uses Svix/Standard Webhooks format
const validateEvent = async (
  body: string,
  headers: Record<string, string>,
  secret: string
) => {
  const msgId = headers["webhook-id"] || headers["svix-id"];
  const msgTimestamp =
    headers["webhook-timestamp"] || headers["svix-timestamp"];
  const msgSignature =
    headers["webhook-signature"] || headers["svix-signature"];

  if (!(msgId && msgTimestamp && msgSignature)) {
    throw new Error("Missing webhook headers");
  }

  // Check timestamp is within 5 minutes
  const timestamp = Number.parseInt(msgTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    throw new Error("Webhook timestamp too old or too far in future");
  }

  // Create signed content: id + timestamp + body
  const signedContent = `${msgId}.${msgTimestamp}.${body}`;

  // Import secret key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(
    secret.startsWith("whsec_") ? secret.slice(6) : secret
  );
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Generate expected signature
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedContent)
  );
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  // Parse signatures from header (format: "v1,sig1 v1,sig2")
  const signatures = msgSignature.split(" ").map((s) => s.split(",")[1]);

  // Check if any signature matches
  if (!signatures.includes(expectedSignature)) {
    throw new Error("Webhook signature verification failed");
  }
};

export const paymentWebhook = httpAction(async (ctx, request) => {
  try {
    console.log("🔗 Webhook received at:", new Date().toISOString());

    // Check if required Polar environment variables are configured
    if (
      !(process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_ORGANIZATION_ID)
    ) {
      console.log("❌ Polar not configured - missing environment variables");
      return new Response(JSON.stringify({ message: "Polar not configured" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const rawBody = await request.text();
    console.log("📦 Webhook body length:", rawBody.length);

    // Convert headers to a dictionary
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Validate the webhook event
    if (!process.env.POLAR_WEBHOOK_SECRET) {
      throw new Error(
        "POLAR_WEBHOOK_SECRET environment variable is not configured"
      );
    }
    await validateEvent(rawBody, headers, process.env.POLAR_WEBHOOK_SECRET);

    const body = JSON.parse(rawBody);
    console.log("🎯 Webhook event type:", body.type);

    // Get webhook ID from headers for deduplication
    const webhookIdHeader =
      headers["webhook-id"] || headers["webhook_id"] || headers["x-webhook-id"];

    // Track events and based on events store data
    await ctx.runMutation(api.payments.handleWebhookEvent, {
      body,
      webhookId: webhookIdHeader,
    });

    console.log("✅ Webhook processed successfully");
    return new Response(JSON.stringify({ message: "Webhook received!" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Check if it's a webhook verification error by checking the error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isVerificationError =
      errorMessage.includes("verification") ||
      errorMessage.includes("signature");

    if (isVerificationError) {
      console.error("Webhook verification failed:", errorMessage);
      return new Response(
        JSON.stringify({ message: "Webhook verification failed" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.error("Webhook processing failed:", errorMessage);
    return new Response(JSON.stringify({ message: "Webhook failed" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
});

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { paymentWebhook } from "./payments";
import { resend } from "./sendEmails";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/payments/webhook",
  method: "POST",
  handler: paymentWebhook,
});

http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(
    async (ctx, req) => await resend.handleResendEventWebhook(ctx, req)
  ),
});

export default http;

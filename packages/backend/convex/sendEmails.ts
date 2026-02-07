import { Resend, vEmailEvent, vEmailId } from "@convex-dev/resend";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import { action, internalMutation } from "./_generated/server";

export const resend: Resend = new Resend(components.resend, {
  onEmailEvent: internal.sendEmails.handleEmailEvent,
  testMode: false, // Set to false to allow sending to real email addresses
});

export const handleEmailEvent = internalMutation({
  args: {
    id: vEmailId,
    event: vEmailEvent,
  },
  returns: v.null(),
  handler: async (_ctx, _args) => {
    // Handle email events here (deliveries, bounces, etc.)
    // You can update your database or trigger other actions based on the event
    return null;
  },
});

export const sendTestEmail = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await resend.sendEmail(
      ctx,
      "Test <test@mydomain.com>",
      "delivered@resend.dev",
      "Test Email from Yugen",
      "This is a test email from your Yugen app!"
    );
    return null;
  },
});

export const sendTestEmailToAddress = action({
  args: {
    toEmail: v.string(),
    subject: v.optional(v.string()),
    message: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, { toEmail, subject, message }) => {
    // Check if user is authenticated
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be authenticated to send test emails");
    }

    const fromEmail = process.env.SENDER_EMAIL || "test@resend.dev";
    const companyName = process.env.COMPANY_NAME || "Yugen";

    try {
      await resend.sendEmail(
        ctx,
        `${companyName} <${fromEmail}>`,
        toEmail,
        subject || `Test Email from ${companyName}`,
        message ||
          `<h1>Test Email</h1><p>This is a test email sent from your ${companyName} application!</p><p>If you received this, your email configuration is working correctly.</p>`
      );

      return { success: true, message: "Test email sent successfully!" };
    } catch (error) {
      throw new Error(
        "Failed to send test email. Check your email configuration."
      );
    }
  },
});

export const sendWelcomeEmail = internalMutation({
  args: { email: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { email, name }) => {
    const fromEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const companyName = process.env.COMPANY_NAME || "Yugen";

    await resend.sendEmail(
      ctx,
      `${companyName} <${fromEmail}>`,
      email,
      `Welcome to ${companyName}, ${name}!`,
      `<h1>Welcome aboard, ${name}!</h1><p>We're excited to have you with us at ${companyName}.</p>`
    );
    return null;
  },
});

export const sendWaitlistApprovalEmail = internalMutation({
  args: { email: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { email, name }) => {
    const fromEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const companyName = process.env.COMPANY_NAME || "Yugen";
    const siteUrl = process.env.SITE_URL || "http://localhost:3001";

    await resend.sendEmail(
      ctx,
      `${companyName} <${fromEmail}>`,
      email,
      `You're approved! Welcome to ${companyName}`,
      `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 20px;">Great news, ${name}!</h1>
					
					<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
						You've been approved from the waitlist! You can now create your account and start using ${companyName}.
					</p>
					
					<div style="margin: 30px 0;">
						<a href="${siteUrl}/dashboard?action=signup" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
							Create Your Account
						</a>
					</div>
					
					<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-top: 30px;">
						We're excited to have you on board!
					</p>
					
					<p style="color: #8a8a8a; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
						If you have any questions, feel free to reply to this email.
					</p>
				</div>
			`
    );
    return null;
  },
});

export const sendOrganizationInvitationEmail = internalMutation({
  args: {
    email: v.string(),
    organizationName: v.string(),
    inviterName: v.string(),
    inviterEmail: v.string(),
    url: v.string(),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { email, organizationName, inviterName, inviterEmail, url }
  ) => {
    const fromEmail = process.env.SENDER_EMAIL || "onboarding@resend.dev";
    const companyName = process.env.COMPANY_NAME || "Yugen";

    await resend.sendEmail(
      ctx,
      `${companyName} <${fromEmail}>`,
      email,
      `You've been invited to join ${organizationName}`,
      `
				<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<h1 style="color: #1a1a1a; font-size: 28px; margin-bottom: 20px;">You've been invited!</h1>
					
					<p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
						${inviterName || inviterEmail} invited you to join <strong>${organizationName}</strong> on ${companyName}.
					</p>
					
					<div style="margin: 30px 0;">
						<a href="${url}" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
							Accept Invitation
						</a>
					</div>
					
					<p style="color: #8a8a8a; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
						If you didn't expect this invitation, you can safely ignore this email.
					</p>
				</div>
			`
    );
    return null;
  },
});

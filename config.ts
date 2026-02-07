/**
 * Feature Flags Configuration
 *
 * Configure various features of the application here.
 */

export const config = {
  /**
   * Site metadata configuration
   *
   * Centralized configuration for all site metadata including:
   * - Site name, description, and branding
   * - Favicon and logo paths
   * - Open Graph and Twitter meta tags
   * - Social media links
   */
  metadata: {
    /**
     * Site name displayed in browser tabs, OG tags, and throughout the app
     */
    siteName: "Yugen",

    /**
     * Site name with subtitle or additional text (used in footer, etc.)
     * Leave empty if you don't want a subtitle
     */
    siteNameWithSubtitle: "Yugen 幽玄",

    /**
     * Default site description for SEO and OG tags
     */
    siteDescription: "Build Highly-Scalable Web Apps Without Breaking the Bank",

    /**
     * Favicon path (relative to public folder)
     * Example: "/assets/logos/favicon.png"
     */
    favicon: "/assets/logos/yugen.png",

    /**
     * Logo path used in navigation and branding (relative to public folder)
     * Example: "/assets/logos/logo.png"
     */
    logo: "/assets/logos/yugen.png",

    /**
     * Open Graph image path for social media sharing (relative to public folder)
     * Should be 1200x630px for best results
     * Example: "/assets/og-image.png"
     */
    ogImage: "/assets/yugen-banner.png",

    /**
     * OG image version for cache-busting
     * Increment this when you update the OG image to force social platforms to refresh
     * Example: "2", "3", etc.
     */
    ogImageVersion: "1",

    /**
     * Site URL (used for absolute URLs in OG tags)
     * Example: "https://yugen.dev"
     */
    siteUrl: "https://yugen.dev",

    /**
     * Twitter/X handle (without @)
     * Example: "yugen_dev"
     */
    twitterHandle: "",

    /**
     * Additional meta tags
     */
    meta: {
      /**
       * Keywords for SEO
       */
      keywords: ["web development", "boilerplate", "saas", "startup"],

      /**
       * Author name
       */
      author: "Yugen",

      /**
       * Language code (ISO 639-1)
       */
      lang: "en",
    },

    /**
     * Social media links
     */
    social: {
      /**
       * GitHub repository URL
       * Example: "https://github.com/your-org/your-repo"
       */
      github: "https://github.com/code-and-creed/yugen",

      /**
       * Twitter/X profile URL
       * Example: "https://x.com/your_handle"
       */
      twitter: "",

      /**
       * Discord invite URL
       * Example: "https://discord.com/invite/your-invite"
       */
      discord: "https://discord.com/invite/QuDhqwJbux",
    },
  },

  features: {
    /**
     * Enable/disable the onboarding flow for new users.
     * - true: New users will be redirected to onboarding after signup
     * - false: New users will be redirected directly to dashboard
     */
    onboarding: true,

    /**
     * Enable/disable waitlist functionality.
     * - true: Users must be approved before they can sign up
     * - false: Users can sign up directly
     */
    waitlist: false,

    /**
     * Require authentication before checkout.
     * - true: Users must sign up/login before purchasing (required if trackInConvex is true)
     * - false: Allow guest checkout without authentication (works with trackInConvex: false)
     *
     * Note: If trackInConvex is false, this should also be false for a smooth checkout experience
     */
    requireAuthForCheckout: false,

    /**
     * Enable/disable organizations feature (B2B multi-tenancy).
     * - true: Users can create organizations, invite members, manage roles (for B2B apps)
     * - false: Standard single-user app (DEFAULT)
     */
    organizations: false,
  },
  payments: {
    /**
     * Track payments and subscriptions in Convex database.
     * - true: Full integration - tracks purchases, shows status in UI, requires webhooks (for SaaS apps)
     * - false: Simple mode - direct Polar checkout links, no database tracking (DEFAULT)
     *
     * Use false (DEFAULT) when:
     * - Building a simple landing page with payment links
     * - You want minimal setup (no webhooks, no user accounts needed)
     *
     * Use true when:
     * - Building a SaaS with user accounts and subscription management
     * - You need to check user's payment status in your app logic
     * - You want to show subscription details in the dashboard
     * - Note: Requires requireAuthForCheckout: true
     */
    trackInConvex: false,
  },
} as const;

export type Config = typeof config;

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { config } from "@root/config";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouteContext,
} from "@tanstack/react-router";

import { createServerFn } from "@tanstack/react-start";
import type { ConvexReactClient } from "convex/react";
import { ConvexProvider } from "convex/react";
import { HumanBehaviorProvider } from "humanbehavior-js/react";
import { Toaster } from "@/components/ui/sonner";
import { authClient } from "@/lib/auth-client";
import { getToken } from "@/lib/auth-server";
import appCss from "../index.css?url";

const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const token = await getToken();
  return {
    token,
  };
});

export interface RouterAppContext {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
  convexQueryClient: ConvexQueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    title: config.metadata.siteName,
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "description",
        content: config.metadata.siteDescription,
      },
      {
        name: "keywords",
        content: config.metadata.meta.keywords.join(", "),
      },
      {
        name: "author",
        content: config.metadata.meta.author,
      },
      {
        property: "og:title",
        content: config.metadata.siteName,
      },
      {
        property: "og:description",
        content: config.metadata.siteDescription,
      },
      {
        property: "og:image",
        content: `${config.metadata.siteUrl}${config.metadata.ogImage}?v=${config.metadata.ogImageVersion || "1"}`,
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:type",
        content: "image/png",
      },
      {
        property: "og:url",
        content: config.metadata.siteUrl,
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: config.metadata.siteName,
      },
      {
        name: "twitter:description",
        content: config.metadata.siteDescription,
      },
      {
        name: "twitter:image",
        content: `${config.metadata.siteUrl}${config.metadata.ogImage}?v=${config.metadata.ogImageVersion || "1"}`,
      },
      ...(config.metadata.twitterHandle
        ? [
            {
              name: "twitter:creator",
              content: `@${config.metadata.twitterHandle}`,
            },
          ]
        : []),
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Bricolage+Grotesque:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: config.metadata.favicon,
      },
    ],
    scripts: [
      {
        defer: true,
        src: "https://cloud.umami.is/script.js",
        "data-website-id": "839f40e7-263c-4f95-9d45-89cb9a8d0852",
      },
    ],
  }),

  component: RootDocument,
  beforeLoad: async (ctx) => {
    const { token } = await fetchAuth();
    if (token) {
      ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
    }
    return { token };
  },
});

function RootDocument() {
  const context = useRouteContext({ from: Route.id });
  const token = useRouteContext({
    from: Route.id,
    select: (data) => data.token,
  });
  return (
    <html className="dark overflow-x-hidden" lang={config.metadata.meta.lang}>
      <head>
        {/* Critical CSS to prevent icon FOUC before the main stylesheet loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .feature-icon-stack { visibility: hidden; }
            `,
          }}
        />
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
  (function(){
    try {
      // Wrap fetch to handle Sonarly network errors gracefully
      // This is especially important for Twitter/X redirects via t.co URLs,
      // which can cause 400 Bad Request errors when Sonarly tries to track them
      var originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).catch(function(error) {
          // Silently handle Sonarly network errors (e.g., 400 Bad Request for t.co URLs from Twitter)
          var url = args[0];
          if (typeof url === 'string' && url.includes('sonarly.dev')) {
            // Suppress error to prevent app crashes from tracking failures
            // Common case: users coming from Twitter/X via t.co shortened URLs
            console.debug('Sonarly tracking error (suppressed):', error.message || 'Network error');
            // Return a rejected promise but don't throw to prevent unhandled errors
            return Promise.reject(error);
          }
          throw error;
        });
      };

      var initOpts = {
        projectKey: "f1NZvNdXzukhLMjWCEEL",
        ingestPoint: "https://sonarly.dev/ingest",
        __DISABLE_SECURE_MODE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      };
      var startOpts = {};
      
      (function(A,s,a,y,e,r){
        try {
          r=window.Sonarly=[e,r,y,[s-1, e]];
          s=document.createElement('script');
          s.src=A;
          s.async=!a;
          s.onerror=function(){console.debug('Sonarly script failed to load');};
          document.getElementsByTagName('head')[0].appendChild(s);
          r.start=function(v){try{r.push([0])}catch(e){console.debug('Sonarly start error:',e)}};
          r.stop=function(v){try{r.push([1])}catch(e){console.debug('Sonarly stop error:',e)}};
          r.setUserID=function(id){try{r.push([2,id])}catch(e){console.debug('Sonarly setUserID error:',e)}};
          r.setUserAnonymousID=function(id){try{r.push([3,id])}catch(e){console.debug('Sonarly setUserAnonymousID error:',e)}};
          r.setMetadata=function(k,v){try{r.push([4,k,v])}catch(e){console.debug('Sonarly setMetadata error:',e)}};
          r.event=function(k,p,i){try{r.push([5,k,p,i])}catch(e){console.debug('Sonarly event error:',e)}};
          r.issue=function(k,p){try{r.push([6,k,p])}catch(e){console.debug('Sonarly issue error:',e)}};
          r.isActive=function(){return false};
          r.getSessionToken=function(){};
        } catch(e) {
          console.debug('Sonarly initialization error:', e);
        }
      })("https://sonarly.dev/static/tracker.js?v=1764507424282",1,0,initOpts,startOpts);
    } catch(e) {
      console.debug('Sonarly setup error:', e);
    }
  })();
`,
          }}
        />
      </head>
      <body>
        <HumanBehaviorProvider
          apiKey={import.meta.env.VITE_HUMANBEHAVIOR_API_KEY}
        >
          <ConvexProvider client={context.convexClient}>
            <ConvexBetterAuthProvider
              authClient={authClient}
              client={context.convexClient}
            >
              <Outlet />
              <Toaster richColors />
              {/* <TanStackRouterDevtools position="bottom-left" /> */}
            </ConvexBetterAuthProvider>
          </ConvexProvider>
        </HumanBehaviorProvider>
        <Scripts />
      </body>
    </html>
  );
}

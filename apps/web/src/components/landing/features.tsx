import { DollarSign, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FumadocsIcon } from "@/components/icons/fumadocs-icon";
import { HyperText } from "@/components/ui/hyper-text";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

const features = [
  {
    name: "TanStack Start + Turborepo",
    logo: "/assets/logos/tanstack.svg",
    logos: ["/assets/logos/tanstack.svg", "/assets/logos/turborepo.svg"],
    description:
      "Full-stack React framework with type-safe routing and server functions, powered by Turborepo for high-performance monorepo builds.",
    url: "https://tanstack.com/start",
    pricing: "Free",
  },
  {
    name: "Convex",
    logo: "/assets/logos/convex.svg",
    description:
      "Backend-as-a-service with ACID database, real-time sync, serverless functions, automatic type safety, and pre-built components. Abstracts away most backend complexities so you can move fast!",
    url: "https://convex.dev",
    pricing: "Generous Free tier, then $25/dev/month",
  },
  {
    name: "BetterAuth",
    logo: "/assets/logos/better-auth.svg",
    description:
      "Free, open-source Authentication with 2FA, Passkeys, and SSO. Handle B2C users or B2B organizations effortlessly. Waitlist included.",
    url: "https://better-auth.com",
    pricing: "Free",
  },
  {
    name: "Polar",
    logo: "/assets/logos/polar.svg",
    description:
      "Merchant of Record for developers. Subscriptions, one-time payments, and global tax compliance. Accountants will love you.",
    url: "https://polar.sh",
    pricing: "4% + $0.40 per transaction",
  },
  {
    name: "Resend",
    logo: "/assets/logos/resend.svg",
    description:
      "Email API for developers. Send transactional and marketing emails with React components.",
    url: "https://resend.com",
    pricing: "Free for 3k emails/month, then $20/month for 50k",
  },
  {
    name: "Ruler",
    logo: "/assets/logos/ruler.svg",
    description:
      "Transform model rules and memories into LLM-ready markdown. Your agents will never hallucinate on your codebase's conventions.",
    url: "https://okigu.com/ruler",
    pricing: "Free",
  },
  {
    name: "Ultracite",
    logo: "/assets/logos/ultracite.svg",
    description:
      "AI-ready formatter and linter. Zero-config Biome preset designed for humans AND LLMs. 35x faster than ESLint and Prettier.",
    url: "https://www.ultracite.ai",
    pricing: "Free",
  },
  {
    name: "Cloudflare",
    logo: "/assets/logos/cloudflare.svg",
    description:
      "Workers for fast, global edge performance. R2 for S3-compatible storage with zero egress fees. Store and serve terrabytes of files cheaply.",
    url: "https://cloudflare.com",
    pricing:
      "10M requests/month free, then $5/month + $0.30 per million requests",
  },
  {
    name: "Alchemy",
    logo: "/assets/logos/alchemy.svg",
    description:
      "Deploy infrastructure using pure TypeScript. Works with Cloudflare, AWS, and more. Skip the YAML mess and ship faster.",
    url: "https://alchemy.run",
    pricing: "Free",
  },
  {
    name: "Fumadocs",
    logoComponent: <FumadocsIcon className="h-full w-full" />,
    description:
      "Beautiful in-codebase documentation. Markdown-based docs with search and navigation.",
    url: "https://fumadocs.dev",
    pricing: "Free",
  },
  {
    name: "Sentry + BetterStack",
    logo: "/assets/logos/sentry.svg",
    logos: ["/assets/logos/sentry.svg", "/assets/logos/betterstack.svg"],
    urls: ["https://sentry.io", "https://betterstack.com"],
    description:
      "Error tracking and monitoring, plus incident response. Know what's happening in production and get alerts when things go wrong!",
    url: "https://sentry.io",
    pricing:
      "5k errors/month free (Sentry). 10 monitors & 1 status page free (BetterStack)",
  },
  {
    name: "DataFast + HumanBehavior",
    logo: "/assets/logos/datafast.png",
    logos: ["/assets/logos/datafast.png", "/assets/logos/human-behaviour.svg"],
    urls: ["https://datafa.st", "https://www.humanbehavior.co/"],
    description:
      "Discover which marketing channels drive revenue and where it's lost, then understand why users churn and what frustrates them. Revenue insights meet behavioral truth.",
    url: "https://datafa.st",
    pricing:
      "14-day free trial (DataFast). Pay-as-you-go: $0.0050/recording, $0.0600/analysis (Human Behavior)",
  },
];

export function Features() {
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const tooltipRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Handle tooltip closing - close if clicking outside the tooltip container
      if (openTooltip) {
        const tooltipElement = tooltipRefs.current[openTooltip];
        if (tooltipElement && !tooltipElement.contains(target)) {
          setOpenTooltip(null);
        }
      }

      // Close active card on mobile when clicking outside the card
      if (activeCard && isMobile) {
        const cardElement = document.querySelector(
          `[data-feature-card="${activeCard}"]`
        );
        if (cardElement && !cardElement.contains(target)) {
          setActiveCard(null);
        }
      }
    };

    if (openTooltip || activeCard) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [openTooltip, activeCard, isMobile]);

  return (
    <section className="bg-black py-12 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <HyperText
            as="h2"
            className="px-4 font-bold font-mono text-2xl text-white sm:px-0 sm:text-3xl md:text-4xl"
            duration={1000}
            startOnView
          >
            Unmatched Developer Experience
          </HyperText>
          <p className="px-4 font-mono text-sm text-white/60 sm:px-0 sm:text-base">
            Focus on customers, not infrastructure. Libraries and Providers that
            do most of the heavy lifting (with <b>very</b> generous free tiers).
          </p>
        </div>
        <div className="mx-auto mt-8 grid max-w-6xl gap-4 sm:mt-16 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const isTooltipOpen = openTooltip === feature.name;
            const isCardActive = activeCard === feature.name;
            const isDualProvider = !!feature.urls;

            const CardWrapper = isDualProvider ? "div" : "a";
            const cardProps = isDualProvider
              ? {
                  className:
                    "group relative min-w-0 border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 sm:p-8",
                  "data-feature-card": feature.name,
                }
              : {
                  className:
                    "group relative min-w-0 cursor-pointer border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 sm:p-8",
                  "data-feature-card": feature.name,
                  href: feature.url,
                  onClick: (e: React.MouseEvent) => {
                    // On mobile, prevent default link behavior on first click
                    if (isMobile && !isCardActive) {
                      e.preventDefault();
                      setActiveCard(feature.name);
                    }
                  },
                  rel: "noopener noreferrer",
                  target: "_blank",
                };

            return (
              <CardWrapper {...cardProps} key={feature.name}>
                <div
                  className="feature-icon-stack visible absolute top-4 right-4 flex items-center gap-3"
                  style={{ top: "1rem", right: "1rem" }}
                >
                  <div
                    className="z-10 -m-2 p-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenTooltip(isTooltipOpen ? null : feature.name);
                    }}
                  >
                    <div className="group/tooltip relative">
                      <div className="relative">
                        <DollarSign size={20} className="h-5 w-5 cursor-help text-white/40 transition-colors hover:text-white/60 sm:h-4 sm:w-4" />
                        <span
                          className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-white/20 font-mono text-[9px] text-white/80 leading-none sm:h-2.5 sm:w-2.5 sm:text-[8px]"
                          style={{ top: "-0.25rem", right: "-0.25rem" }}
                        >
                          ?
                        </span>
                      </div>
                      <div
                        className={`absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded border border-white/20 bg-black px-3 py-2 font-mono text-white/80 text-xs transition-all duration-200 sm:w-56 ${
                          isTooltipOpen
                            ? "pointer-events-auto visible opacity-100"
                            : "pointer-events-none invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100"
                        }`}
                        ref={(el) => {
                          tooltipRefs.current[feature.name] = el;
                        }}
                      >
                        {feature.pricing}
                        <div className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-white/20 border-r border-b bg-black" />
                      </div>
                    </div>
                  </div>
                  {!feature.urls && (
                    <a
                      className={`flex h-8 w-8 shrink-0 items-center justify-center p-1.5 text-white/40 transition-all duration-300 sm:h-5 sm:w-5 sm:p-0 ${
                        isMobile
                          ? isCardActive
                            ? "text-white/80 opacity-100"
                            : "pointer-events-none opacity-0"
                          : "group-hover:text-white/80 group-hover:opacity-100"
                      }`}
                      href={feature.url}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Allow navigation on mobile when clicking ExternalLink
                        setActiveCard(null);
                      }}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <ExternalLink size={20} className="h-full w-full" />
                    </a>
                  )}
                </div>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white/10 p-3">
                  {feature.logoComponent ? (
                    feature.logoComponent
                  ) : feature.logos ? (
                    <div className="flex h-full w-full items-center justify-center gap-1">
                      {feature.logos.map((logo, idx) => (
                        <img
                          alt={feature.name}
                          className="h-3/5 w-3/5 object-contain"
                          key={idx}
                          src={logo}
                        />
                      ))}
                    </div>
                  ) : (
                    <img
                      alt={feature.name}
                      className="h-full w-full object-contain"
                      src={feature.logo}
                    />
                  )}
                </div>
                <h3
                  className={`mb-2 break-words font-mono font-semibold text-white ${feature.urls ? "pr-12 text-lg sm:text-xl" : "text-xl"}`}
                >
                  {feature.urls ? (
                    <div className="flex min-w-0 flex-nowrap items-center gap-1.5">
                      {feature.name.split(" + ").map((provider, idx) => (
                        <span
                          className="inline-flex shrink-0 items-center gap-1.5"
                          key={idx}
                        >
                          <span className="whitespace-nowrap">{provider}</span>
                          <a
                            className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-white/40 transition-colors hover:text-white/80"
                            href={feature.urls[idx]}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCard(null);
                            }}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            <ExternalLink size={16} className="h-full w-full" />
                          </a>
                          {idx < feature.name.split(" + ").length - 1 && (
                            <span className="shrink-0 text-white/40">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    feature.name
                  )}
                </h3>
                <p className="break-words font-mono text-sm text-white/60 leading-relaxed">
                  {feature.description}
                </p>
              </CardWrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}

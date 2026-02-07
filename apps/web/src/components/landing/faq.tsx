"use client";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HyperText } from "@/components/ui/hyper-text";

interface FAQItem {
  question: string;
  answer: React.ReactNode;
  answerText: string; // Plain text version for schema
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Is everything really Type-Safe End-to-End?",
      answerText:
        "Yes! Every function, query, and mutation is fully typed across the entire stack. Convex auto-generates TypeScript types, giving you full autocomplete and type safety from database to UI.",
      answer: (
        <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          Yes! Every function, query, and mutation is fully typed across the
          entire stack. Convex auto-generates TypeScript types, giving you full
          autocomplete and type safety from database to UI.
        </p>
      ),
    },
    {
      question: "Do I need separate services for my Backend?",
      answerText:
        "Mostly no! Convex provides your database, cron jobs, and backend functions in one platform. Their database is powered by PlanetScale; rock-solid, extremely fast, and cost-efficient servers. We use Cloudflare R2 for blob storage (cost savings), but you can easily swap providers using Convex Components plug-and-play integrations for any third-party service.",
      answer: (
        <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          Mostly no! Convex provides your database, cron jobs, and backend
          functions in one platform. Their database is powered by PlanetScale;
          rock-solid, extremely fast, and cost-efficient servers. We use
          Cloudflare R2 for blob storage (cost savings), but you can easily swap
          providers using{" "}
          <a
            className="text-white underline hover:text-white/80"
            href="https://www.convex.dev/components"
            rel="noopener noreferrer"
            target="_blank"
          >
            Convex Components
          </a>{" "}
          plug-and-play integrations for any third-party service.
        </p>
      ),
    },
    {
      question: "Do I need to be Technical to use this Stack?",
      answerText:
        'You should have a basic understanding of coding and systems but by no means do you need to be an expert. The stack is really strongly typed and it\'s been intentionally designed to abstract away a lot of the complexity, so you can effectively use AI to "vibe code" and build features.',
      answer: (
        <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          You should have a basic understanding of coding and systems but by no
          means do you need to be an expert. The stack is really strongly typed
          and it's been intentionally designed to abstract away a lot of the
          complexity, so you can effectively use AI to "vibe code" and build
          features.
        </p>
      ),
    },
    {
      question:
        "Why pay for a boilerplate when I can just build my own stack from scratch?",
      answerText:
        "Building from scratch (even with AI) will burn through a LOT of tokens—you'll need to explain every integration, debug authentication flows, wire up payments, configure storage, and handle edge cases. That's hundreds of dollars in API costs and weeks of debugging. Save the tokens, save your time. Chill out. Spend that time with family broski. Use something that just works and doesn't break :)",
      answer: (
        <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          Building from scratch (even with AI) will burn through a LOT of
          tokens—you'll need to explain every integration, debug authentication
          flows, wire up payments, configure storage, and handle edge cases.
          That's hundreds of dollars in API costs and weeks of debugging. Save
          the tokens, save your time. Chill out. Spend that time with family
          broski. Use something that just works and doesn't break :)
        </p>
      ),
    },
    {
      question:
        "What about compliance? Can I build apps that handle sensitive data?",
      answerText:
        "Absolutely. Convex is SOC 2 Type II, HIPAA, and GDPR compliant, with ISO 9001 and FedRamp certifications. You can build applications that require handling sensitive PII and protected health information (PHI). The platform has enterprise-grade security built-in and is hosted on AWS, so you can focus on building features rather than compliance infrastructure.",
      answer: (
        <p className="font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          Absolutely. Convex is SOC 2 Type II, HIPAA, and GDPR compliant, with
          ISO 9001 and FedRamp certifications. You can build applications that
          require handling sensitive PII and protected health information (PHI).
          The platform has enterprise-grade security built-in and is hosted on
          AWS, so you can focus on building features rather than compliance
          infrastructure.
        </p>
      ),
    },
    {
      question: "What if I get stuck during setup or need help?",
      answerText:
        "Join our Discord community! We're a passionate community of Tech Entrepreneurs building products for ourselves and for clients. It doesn't matter if you're struggling with setup or have questions about the stack, the community is there to help. Get quick responses from other builders.",
      answer: (
        <>
          <p className="mb-4 font-mono text-sm text-white/60 leading-relaxed sm:text-base">
            Join our Discord community! We're a passionate community of Tech
            Entrepreneurs building products for ourselves and for clients. It
            doesn't matter if you're struggling with setup or have questions
            about the stack, the community is there to help. Get quick responses
            from other builders.
          </p>
          <a
            className="group inline-flex"
            href="https://discord.com/invite/QuDhqwJbux"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button
              className="border-white/20 bg-white/5 font-mono hover:border-white/30 hover:bg-white/10"
              size="sm"
              variant="outline"
            >
              <svg
                aria-hidden="true"
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Join Discord
              <ExternalLink size={16} className="ml-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
            </Button>
          </a>
        </>
      ),
    },
    {
      question: "What if I want a refund after I purchase?",
      answerText:
        "Unfortunately, due to the nature of the product, I can't offer refunds. You'll have full access to the codebase and documentation after purchase. However, I'm very active on Discord and will do whatever I can to help make your experience using this stack as smooth as possible. I promise you will not be disappointed!",
      answer: (
        <p className="mb-4 font-mono text-sm text-white/60 leading-relaxed sm:text-base">
          Unfortunately, due to the nature of the product, I can't offer
          refunds. You'll have full access to the codebase and documentation
          after purchase. However, I'm very active on Discord and will do
          whatever I can to help make your experience using this stack as smooth
          as possible. I promise you will not be disappointed!
        </p>
      ),
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answerText,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(faqSchema);
    script.id = "faq-schema";
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("faq-schema");
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

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
            Frequently Asked Questions
          </HyperText>
        </div>
        <div className="mx-auto mt-8 max-w-3xl space-y-4 sm:mt-16 sm:space-y-6">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                className="border border-white/10 bg-white/5 transition-all hover:bg-white/10"
                key={index}
              >
                <button
                  className="flex w-full items-center justify-between p-4 text-left sm:p-6 md:p-8"
                  onClick={() => toggleAccordion(index)}
                  type="button"
                >
                  <h3 className="font-mono font-semibold text-lg text-white sm:text-xl">
                    {faq.question}
                  </h3>
                  <ChevronDown
                    size={20}
                    className={`h-5 w-5 shrink-0 text-white/60 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-6 sm:pb-6 md:px-8 md:pb-8">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

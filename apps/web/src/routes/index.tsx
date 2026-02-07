import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { DevToolsWidget } from "../components/dev/dev-tools-widget";
import { Documentation } from "../components/landing/documentation";
import { FAQ } from "../components/landing/faq";
import { Features } from "../components/landing/features";
import { Footer } from "../components/landing/footer";
import { Pricing } from "../components/landing/pricing";
import { ProductionCalculator } from "../components/landing/production-calculator";
import { SectionDivider } from "../components/landing/section-divider";
import { Testimonials } from "../components/landing/testimonials";
import Hero from "../components/ui/hero";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  useEffect(() => {
    // Check if there's a hash in the URL (e.g., #pricing)
    const hash = window.location.hash;
    if (hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return;
    }

    // Restore scroll position on mount (only if no hash)
    const savedPosition = sessionStorage.getItem("landingPageScrollPosition");
    if (savedPosition) {
      window.scrollTo(0, Number.parseInt(savedPosition, 10));
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      sessionStorage.setItem(
        "landingPageScrollPosition",
        window.scrollY.toString()
      );
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="dark min-h-screen">
      <Hero />
      <SectionDivider />
      <Features />
      <SectionDivider />
      <ClientOnly>
        <ProductionCalculator />
      </ClientOnly>
      <SectionDivider />
      <Documentation />
      <SectionDivider />
      <Testimonials />
      <SectionDivider />
      <Pricing />
      <SectionDivider />
      <FAQ />
      <Footer />
      <ClientOnly>
        <DevToolsWidget />
      </ClientOnly>
    </div>
  );
}

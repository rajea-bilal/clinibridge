import { createFileRoute } from "@tanstack/react-router";
import { useScrollAnimation } from "@/lib/useScrollAnimation";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { EmeraldDivider } from "@/components/landing/emerald-divider";
import { FeaturedTrials } from "@/components/landing/featured-trials";
import { NetworkSection } from "@/components/landing/network-section";
import { Footer } from "@/components/landing/footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  useScrollAnimation();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="bg-neutral-950 text-neutral-50 w-full overflow-x-hidden selection:bg-white/20 selection:text-white relative">
      {/* Grain Overlay */}
      <div className="bg-grain" />

      <Navbar />
      <HeroSection />
      <EmeraldDivider />
      <FeaturedTrials />
      <NetworkSection />
      <Footer />
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MessageSquare, ClipboardList, Heart, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="mx-auto max-w-2xl text-center">
          {/* Logo / Brand */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <Heart className="size-6 text-emerald-400" />
            <span className="font-semibold text-xl tracking-tight">
              CliniBridge
            </span>
          </div>

          <h1 className="font-bold text-3xl leading-tight tracking-tight sm:text-4xl">
            Find Clinical Trials
            <br />
            <span className="text-muted-foreground">That Match You</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-muted-foreground text-sm leading-relaxed">
            AI-powered search across ClinicalTrials.gov. Tell us about your
            condition and we'll find recruiting trials near you — via chat or a
            simple form.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href="/chat">
                <MessageSquare className="size-4" />
                Chat with AI
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <a href="/find">
                <ClipboardList className="size-4" />
                Search by Form
              </a>
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<MessageSquare className="size-5" />}
            title="Conversational Search"
            description="Describe your situation naturally and our AI will find matching trials."
          />
          <FeatureCard
            icon={<Zap className="size-5" />}
            title="Real-Time Results"
            description="Search ClinicalTrials.gov directly for the latest recruiting studies."
          />
          <FeatureCard
            icon={<Shield className="size-5" />}
            title="Privacy First"
            description="No personal health data is stored. Your searches stay between you and us."
          />
        </div>

        {/* Disclaimer */}
        <p className="mx-auto mt-16 max-w-md text-center text-muted-foreground/50 text-[11px] leading-relaxed">
          CliniBridge is an AI-powered search tool — not medical advice. Trial
          eligibility is determined by each study's research team. Always consult
          your healthcare provider.
        </p>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-5">
      <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}

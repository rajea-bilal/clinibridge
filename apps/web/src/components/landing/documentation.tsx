import {
  BookOpen,
  Brain,
  Check,
  Database,
  DollarSign,
  ExternalLink,
  Layers,
  Lightbulb,
  Megaphone,
  Palette,
  Settings,
} from "lucide-react";
import { HyperText } from "@/components/ui/hyper-text";
import { cn } from "@/lib/utils";

export function Documentation() {
  return (
    <section className="bg-black py-12 sm:py-24" id="documentation">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl space-y-4 text-center sm:mb-16">
          <HyperText
            as="h2"
            className="px-4 font-bold font-mono text-2xl text-white sm:px-0 sm:text-3xl md:text-4xl"
            duration={1000}
            startOnView
          >
            Crystal Clear Documentation
          </HyperText>
          <p className="px-4 font-mono text-sm text-white/60 leading-relaxed sm:px-0 sm:text-base">
            We leave no room for confusion. For you, your team, or your AI
            Coding Agent.
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Project Setup Card - Spans 5 columns */}
          <div className="flex flex-col gap-6 lg:col-span-5">
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 sm:p-6 lg:p-8">
              <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400 sm:p-3">
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-bold font-mono text-lg text-white sm:text-xl">
                    Project Setup
                  </h3>
                </div>
                <a
                  className="group/btn flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 transition-all hover:border-white/20 hover:bg-white/10 sm:w-auto sm:gap-2 sm:px-2.5 sm:py-1"
                  href="https://yugen-fumadocs.vercel.app/docs"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span className="font-medium font-mono text-white/70 text-xs group-hover/btn:text-white">
                    View Guide
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-white/50 transition-colors group-hover/btn:text-white" />
                </a>
              </div>
              <p className="mb-6 font-mono text-sm text-white/70 leading-relaxed sm:text-base">
                Complete step-by-step guide from{" "}
                <span className="font-bold text-white">Initial Setup</span> to{" "}
                <span className="font-bold text-white">Production</span>.
              </p>

              {/* Course Modules / Steps Visual */}
              <div className="flex-1 space-y-4">
                <h4 className="font-bold font-mono text-white/40 text-xs uppercase tracking-wider">
                  Includes Guide For:
                </h4>
                <div className="space-y-3">
                  {[
                    "Ramp Up on Core Technologies",
                    "Environment Configuration",
                    "Authentication & RLS",
                    "Database Schema Design",
                    "Payment Integration",
                    "Email & Storage Setup",
                    "Production Deployment",
                    "Observability & Monitoring",
                    "Working Solo vs Team",
                  ].map((step, i) => (
                    <div
                      className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-3 px-4 transition-colors hover:border-white/10 hover:bg-white/5"
                      key={i}
                    >
                      <span className="font-bold font-mono text-white/30 text-xs">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                      <span className="font-mono text-sm text-white/80">
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-white/10 border-t pt-8">
                <h4 className="mb-4 flex items-center gap-2 font-bold font-mono text-sm text-white">
                  <Brain className="h-4 w-4 text-purple-400" />
                  Why this matters:
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    <span className="font-mono text-sm text-white/70">
                      Prevent LLM hallucinations (context)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
                    <span className="font-mono text-sm text-white/70">
                      Easy handoff to non-tech founders
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Project Documentation Card - Spans 7 columns */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 sm:p-6 lg:col-span-7 lg:p-8">
            <div className="relative mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="rounded-lg bg-purple-500/20 p-2 text-purple-400 sm:p-3">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold font-mono text-lg text-white sm:text-xl">
                    MVP Documentation Framework
                  </h3>
                  <p className="font-mono text-white/50 text-xs sm:text-sm">
                    6 Detailed Prompts covering everything
                  </p>
                </div>
              </div>
              <a
                className="group/btn relative z-10 flex w-full items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 transition-all hover:border-white/20 hover:bg-white/10 sm:w-auto sm:gap-2 sm:px-2.5 sm:py-1"
                href="https://yugen-fumadocs.vercel.app/docs/product-docs"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="hidden font-medium font-mono text-white/70 text-xs group-hover/btn:text-white sm:inline">
                  View Prompts
                </span>
                <span className="font-medium font-mono text-white/70 text-xs group-hover/btn:text-white sm:hidden">
                  View
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-white/50 transition-colors group-hover/btn:text-white" />
              </a>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Lightbulb,
                  title: "Product Idea",
                  desc: "Vision & Strategy",
                  color: "text-yellow-400",
                  bgColor: "bg-yellow-400/10",
                  borderColor: "border-yellow-400/20",
                  shadowColor: "shadow-yellow-400/20",
                },
                {
                  icon: Megaphone,
                  title: "Marketing",
                  desc: "Trained on Alex Hormozi's Content",
                  color: "text-red-400",
                  bgColor: "bg-red-400/10",
                  borderColor: "border-red-400/20",
                  shadowColor: "shadow-red-400/20",
                },
                {
                  icon: Layers,
                  title: "Architecture",
                  desc: "High-Level System Design",
                  color: "text-blue-400",
                  bgColor: "bg-blue-400/10",
                  borderColor: "border-blue-400/20",
                  shadowColor: "shadow-blue-400/20",
                },
                {
                  icon: DollarSign,
                  title: "Cost Estimation",
                  desc: "Infrastructure & Usage",
                  color: "text-green-400",
                  bgColor: "bg-green-400/10",
                  borderColor: "border-green-400/20",
                  shadowColor: "shadow-green-400/20",
                },
                {
                  icon: Database,
                  title: "Database Design",
                  desc: "Schema & Relationships",
                  color: "text-orange-400",
                  bgColor: "bg-orange-400/10",
                  borderColor: "border-orange-400/20",
                  shadowColor: "shadow-orange-400/20",
                },
                {
                  icon: Palette,
                  title: "UI/UX",
                  desc: "User Flows & Wireframes",
                  color: "text-pink-400",
                  bgColor: "bg-pink-400/10",
                  borderColor: "border-pink-400/20",
                  shadowColor: "shadow-pink-400/20",
                },
              ].map((item, i) => (
                <div
                  className="group/item relative overflow-hidden rounded-xl border border-white/5 bg-black/40 p-3 transition-all hover:border-white/10 hover:bg-white/5 sm:p-4"
                  key={i}
                >
                  <div className="mb-3 flex items-start gap-2 sm:mb-4 sm:gap-3">
                    <div
                      className={cn(
                        "shrink-0 rounded-lg p-1.5 transition-colors sm:p-2",
                        item.bgColor
                      )}
                    >
                      <item.icon
                        className={cn("h-4 w-4 sm:h-5 sm:w-5", item.color)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold font-mono text-white text-xs sm:text-sm">
                        {item.title}
                      </h4>
                      <p className="mt-0.5 font-mono text-[10px] text-white/50 leading-tight sm:mt-1 sm:text-xs">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "relative aspect-video w-full overflow-hidden rounded-lg border bg-black/50 transition-all duration-500 group-hover/item:shadow-2xl",
                      item.borderColor,
                      item.shadowColor
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0" />
                    {/* Placeholder for when user provides images */}
                    <div className="flex h-full w-full items-center justify-center bg-white/5">
                      <item.icon
                        className={cn("h-8 w-8 opacity-20", item.color)}
                      />
                    </div>
                    <img
                      alt={`${item.title} prompt preview`}
                      className="absolute top-4 left-4 h-full w-full rounded-tl-xl border-white/10 border-t border-l bg-black/20 object-cover object-left-top shadow-2xl transition-all duration-500 group-hover/item:translate-x-1 group-hover/item:translate-y-1"
                      src={`/assets/docs/prompt-${i + 1}.png`}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/90" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

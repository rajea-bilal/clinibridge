import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrialSearchForm } from "@/components/Form/TrialSearchForm";
import { TrialResultsList } from "@/components/Trials/TrialResultsList";
import type { TrialSearchInput, TrialSummary } from "@/lib/types";
import { Icon } from "@iconify/react";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/find")({
  component: FindPage,
});

function FindPage() {
  const [trials, setTrials] = useState<TrialSummary[]>([]);
  const [totalFromApi, setTotalFromApi] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(input: TrialSearchInput) {
    setIsLoading(true);
    setError(undefined);
    setHasSearched(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: input.condition,
          age: input.age,
          location: input.location,
          medications: input.medications,
          additionalInfo: input.additionalInfo,
        }),
      });

      const result = (await response.json()) as {
        trials: TrialSummary[];
        error?: string;
        count?: number;
      };

      setTrials(result.trials);
      setTotalFromApi(result.count);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setTrials([]);
      setTotalFromApi(undefined);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-neutral-50 selection:bg-emerald-500/30 selection:text-white antialiased"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Grain texture overlay */}
      <div className="bg-grain" />

      {/* Ambient glows */}
      <div className="fixed top-[-25%] right-[-15%] w-[900px] h-[900px] bg-emerald-900/[0.04] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="fixed bottom-[-15%] left-[-10%] w-[500px] h-[500px] bg-neutral-800/[0.06] rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Atmospheric depth layers — matching chat UI */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-900/[0.03] via-transparent to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, transparent 0%, rgba(2,2,2,0.4) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.015]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      <div className="absolute top-0 right-[25%] w-[1px] h-[35%] bg-gradient-to-b from-emerald-500/[0.06] via-white/[0.02] to-transparent pointer-events-none z-0 rotate-[15deg] origin-top" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/[0.05] bg-neutral-950/80 backdrop-blur-2xl px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors duration-300"
            >
              <Icon icon="solar:arrow-left-linear" width={16} />
            </a>
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-neutral-950 shrink-0">
                <Icon icon="solar:health-bold-duotone" width={14} />
              </div>
              <span className="font-bricolage font-medium text-sm uppercase tracking-tight text-white/80">
                CliniBridge
              </span>
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="solar:clipboard-list-linear" width={16} className="text-white/20" />
            <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/30">
              Trial Search
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 mx-auto max-w-2xl px-6 py-12 md:py-16">
        <div className="space-y-10">
          {/* Page intro */}
          <div className="animate-fade-in opacity-0 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-[1px] w-6 bg-emerald-500/60" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-400/70">
                Direct Search
              </span>
            </div>
            <h2 className="font-bricolage text-2xl md:text-3xl font-medium tracking-tight text-white">
              Search Clinical Trials
            </h2>
            <p className="text-white/40 font-light text-[15px] leading-relaxed max-w-lg">
              Enter your details below to find recruiting clinical trials on
              ClinicalTrials.gov.
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center w-full max-w-xs mx-auto animate-fade-in opacity-0 [animation-delay:0.1s]">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-emerald-500/15" />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/25 ring-1 ring-emerald-500/10 mx-3" />
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-emerald-500/15" />
          </div>

          <div className="animate-fade-in opacity-0 [animation-delay:0.2s]">
            <TrialSearchForm onSubmit={handleSearch} isLoading={isLoading} />
          </div>

          {hasSearched && (
            <div className="animate-fade-in opacity-0 [animation-delay:0.1s]">
              <TrialResultsList
                trials={trials}
                error={error}
                isLoading={isLoading}
                totalFromApi={totalFromApi}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

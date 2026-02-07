import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TrialSearchForm } from "@/components/Form/TrialSearchForm";
import { TrialResultsList } from "@/components/Trials/TrialResultsList";
import type { TrialSearchInput, TrialSummary } from "@/lib/types";
import { fetchTrials } from "@/lib/clinicalTrials";
import { ArrowLeft, ClipboardList } from "lucide-react";

// @ts-expect-error — route path not in generated tree until `bun run dev` regenerates it
export const Route = createFileRoute("/find")({
  component: FindPage,
});

function FindPage() {
  const [trials, setTrials] = useState<TrialSummary[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleSearch(input: TrialSearchInput) {
    setIsLoading(true);
    setError(undefined);
    setHasSearched(true);

    try {
      const result = await fetchTrials({
        condition: input.condition,
        location: input.location,
      });

      setTrials(result.trials);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setTrials([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </a>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            <h1 className="font-medium text-sm">Find Clinical Trials</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-8">
          <div>
            <h2 className="font-semibold text-lg">Search Clinical Trials</h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Enter your details below to find recruiting clinical trials on
              ClinicalTrials.gov.
            </p>
          </div>

          <TrialSearchForm onSubmit={handleSearch} isLoading={isLoading} />

          {hasSearched && (
            <TrialResultsList
              trials={trials}
              error={error}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>
    </div>
  );
}

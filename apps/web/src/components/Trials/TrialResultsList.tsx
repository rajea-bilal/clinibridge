import type { TrialSummary } from "@/lib/types";
import { TrialCard } from "./TrialCard";
import { NoResults } from "./NoResults";
import { Disclaimer } from "@/components/Shared/Disclaimer";

interface TrialResultsListProps {
  trials: TrialSummary[];
  error?: string;
  isLoading?: boolean;
}

export function TrialResultsList({
  trials,
  error,
  isLoading,
}: TrialResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/30"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Please try again or adjust your search criteria.
        </p>
      </div>
    );
  }

  if (trials.length === 0) {
    return <NoResults />;
  }

  return (
    <div className="space-y-4">
      <Disclaimer />
      <p className="text-muted-foreground text-sm">
        Found {trials.length} recruiting trial{trials.length !== 1 ? "s" : ""}
      </p>
      <div className="space-y-3">
        {trials.map((trial) => (
          <TrialCard key={trial.nctId} trial={trial} />
        ))}
      </div>
    </div>
  );
}

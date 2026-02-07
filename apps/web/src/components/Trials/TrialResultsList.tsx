import { useState } from "react";
import type { TrialSummary } from "@/lib/types";
import { TrialCard } from "./TrialCard";
import { NoResults } from "./NoResults";
import { Disclaimer } from "@/components/Shared/Disclaimer";
import { Button } from "@/components/ui/button";

const INITIAL_SHOW = 4;

interface TrialResultsListProps {
  trials: TrialSummary[];
  error?: string;
  isLoading?: boolean;
  /** Total trials returned from API before filtering (optional) */
  totalFromApi?: number;
}

export function TrialResultsList({
  trials,
  error,
  isLoading,
  totalFromApi,
}: TrialResultsListProps) {
  const [showAll, setShowAll] = useState(false);

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

  // Filter out "Unlikely" trials and sort by matchScore descending
  const filtered = trials
    .filter((t) => t.matchLabel !== "Unlikely")
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  if (filtered.length === 0) {
    return <NoResults />;
  }

  const total = totalFromApi ?? trials.length;
  const display = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  return (
    <div className="space-y-4">
      <Disclaimer />
      <p className="text-muted-foreground text-sm">
        Showing {filtered.length} matching trial
        {filtered.length !== 1 ? "s" : ""}{" "}
        {filtered.length < total && (
          <span className="text-muted-foreground/60">
            (filtered from {total} total)
          </span>
        )}
      </p>
      <div className="space-y-3">
        {display.map((trial) => (
          <TrialCard key={trial.nctId} trial={trial} />
        ))}
      </div>
      {hasMore && !showAll && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setShowAll(true)}
        >
          Show {filtered.length - INITIAL_SHOW} more trial
          {filtered.length - INITIAL_SHOW !== 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}

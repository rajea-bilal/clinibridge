import { useState } from "react";
import type { TrialSummary } from "@/lib/types";
import { TrialCard } from "@/components/Trials/TrialCard";
import { NoResults } from "@/components/Trials/NoResults";
import { Disclaimer } from "@/components/Shared/Disclaimer";
import { Button } from "@/components/ui/button";

const INITIAL_SHOW = 4;

interface TrialCardsFromChatProps {
  data: {
    trials: TrialSummary[];
    error?: string;
    count?: number;
  };
}

export function TrialCardsFromChat({ data }: TrialCardsFromChatProps) {
  const [showAll, setShowAll] = useState(false);

  if (data.error) {
    return (
      <div className="my-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <p className="text-destructive">{data.error}</p>
      </div>
    );
  }

  if (!data.trials || data.trials.length === 0) {
    return (
      <div className="my-2">
        <NoResults />
      </div>
    );
  }

  // Filter out "Unlikely" trials and sort by matchScore descending
  const filtered = data.trials
    .filter((t) => t.matchLabel !== "Unlikely")
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));

  const totalFromApi = data.count ?? data.trials.length;
  const display = showAll ? filtered : filtered.slice(0, INITIAL_SHOW);
  const hasMore = filtered.length > INITIAL_SHOW;

  if (filtered.length === 0) {
    return (
      <div className="my-2">
        <NoResults />
      </div>
    );
  }

  return (
    <div className="my-3 space-y-3">
      <Disclaimer />
      <p className="text-muted-foreground text-xs">
        Showing {filtered.length} matching trial
        {filtered.length !== 1 ? "s" : ""}{" "}
        {filtered.length < totalFromApi && (
          <span className="text-muted-foreground/60">
            (filtered from {totalFromApi} total)
          </span>
        )}
      </p>
      <div className="space-y-2">
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

import { useState } from "react";
import type { TrialSummary } from "@/lib/types";
import { TrialCard } from "./TrialCard";
import type { PatientProfileForEligibility } from "./TrialCard";
import { NoResults } from "./NoResults";
import { Disclaimer } from "@/components/Shared/Disclaimer";
import { Icon } from "@iconify/react";

const INITIAL_SHOW = 4;

interface TrialResultsListProps {
  trials: TrialSummary[];
  error?: string;
  isLoading?: boolean;
  /** Total trials returned from API before filtering (optional) */
  totalFromApi?: number;
  patientProfile?: PatientProfileForEligibility;
}

export function TrialResultsList({
  trials,
  error,
  isLoading,
  totalFromApi,
  patientProfile,
}: TrialResultsListProps) {
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-48 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] backdrop-blur-sm p-6 text-center">
        <p className="text-red-400/80 text-[14px] font-medium">{error}</p>
        <p className="mt-1.5 text-white/30 text-[12px] font-light">
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
    <div className="space-y-5">
      <Disclaimer />

      {/* Results header with mono label */}
      <div className="flex items-center gap-3">
        <span className="h-[1px] w-4 bg-emerald-500/30" />
        <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/25">
          {filtered.length} match{filtered.length !== 1 ? "es" : ""}{" "}
          {filtered.length < total && (
            <span className="text-white/15">
              of {total}
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3">
        {display.map((trial, i) => (
          <div
            key={trial.nctId}
            className="trial-card-enter"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <TrialCard trial={trial} patientProfile={patientProfile} />
          </div>
        ))}
      </div>
      {hasMore && !showAll && (
        <button
          type="button"
          className="w-full bg-transparent hover:bg-white/[0.02] border-none transition-all duration-500 py-3 text-[11px] text-white/25 hover:text-white/45 font-light tracking-wide flex items-center justify-center gap-2"
          onClick={() => setShowAll(true)}
        >
          <Icon icon="solar:alt-arrow-down-linear" width={13} className="text-white/15" />
          Show {filtered.length - INITIAL_SHOW} more
        </button>
      )}
    </div>
  );
}

import { useState } from "react";
import type { TrialSummary } from "@/lib/types";
import { TrialCard } from "@/components/Trials/TrialCard";
import type { PatientProfileForEligibility } from "@/components/Trials/TrialCard";
import { NoResults } from "@/components/Trials/NoResults";
import { Disclaimer } from "@/components/Shared/Disclaimer";
import { Icon } from "@iconify/react";

const INITIAL_SHOW = 4;

interface TrialCardsFromChatProps {
  data: {
    trials: TrialSummary[];
    error?: string;
    count?: number;
    patientProfile?: PatientProfileForEligibility;
  };
}

export function TrialCardsFromChat({ data }: TrialCardsFromChatProps) {
  const [showAll, setShowAll] = useState(false);

  if (data.error) {
    return (
      <div className="my-2 rounded-2xl border border-red-500/15 bg-red-500/[0.04] backdrop-blur-sm p-4 text-[13px]">
        <p className="text-red-400/80 font-light">{data.error}</p>
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
    <div className="my-4 space-y-4">
      <Disclaimer />

      {/* Results header */}
      <div className="flex items-center gap-3">
        <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/15 to-transparent" />
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/25">
          {filtered.length} trial{filtered.length !== 1 ? "s" : ""} found
          {filtered.length < totalFromApi && (
            <span className="text-white/15"> / {totalFromApi} total</span>
          )}
        </span>
        <div className="h-[1px] flex-1 bg-gradient-to-l from-emerald-500/15 to-transparent" />
      </div>

      {/* Cards with staggered entrance */}
      <div className="space-y-3">
        {display.map((trial, idx) => (
          <div
            key={trial.nctId}
            className="trial-card-enter"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <TrialCard trial={trial} patientProfile={data.patientProfile} />
          </div>
        ))}
      </div>

      {/* Show more */}
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.07] transition-all duration-500 cursor-pointer"
        >
          <Icon
            icon="solar:alt-arrow-down-linear"
            width={14}
            className="text-white/20 group-hover:text-emerald-400/50 transition-colors duration-300"
          />
          <span className="text-[12px] font-light text-white/30 group-hover:text-white/60 tracking-wide transition-colors duration-300">
            Show {filtered.length - INITIAL_SHOW} more trial
            {filtered.length - INITIAL_SHOW !== 1 ? "s" : ""}
          </span>
        </button>
      )}
    </div>
  );
}

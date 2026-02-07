import type { TrialSummary } from "@/lib/types";
import { Icon } from "@iconify/react";

interface TrialCardProps {
  trial: TrialSummary;
}

export function TrialCard({ trial }: TrialCardProps) {
  return (
    <div className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm overflow-hidden transition-all duration-500 hover:bg-white/[0.05] hover:border-white/[0.08] hover:shadow-[0_0_30px_rgba(16,185,129,0.03)]">
      {/* Top accent line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent group-hover:via-emerald-500/20 transition-all duration-700" />

      <div className="p-5 space-y-4">
        {/* Header: Title + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-[15px] font-medium text-white/90 leading-snug tracking-tight line-clamp-2 group-hover:text-white transition-colors duration-300">
              {trial.title}
            </h3>
            <span className="block font-mono text-[10px] text-white/20 tracking-[0.1em] uppercase">
              {trial.nctId}
            </span>
          </div>
          <StatusBadge status={trial.status} />
        </div>

        {/* Match label + reason */}
        {trial.matchLabel && (
          <div className="flex items-start gap-2.5">
            <MatchBadge label={trial.matchLabel} />
            {trial.matchReason && (
              <p className="text-[12px] text-white/40 leading-relaxed font-light">
                {trial.matchReason}
              </p>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="line-clamp-3 text-[13px] text-white/50 leading-relaxed font-light">
          {trial.summary}
        </p>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-white/35">
          {trial.phase !== "Not specified" && (
            <div className="flex items-center gap-2">
              <Icon icon="solar:test-tube-linear" width={13} className="text-white/20 shrink-0" />
              <span className="truncate">{trial.phase}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-linear" width={13} className="text-white/20 shrink-0" />
            <span className="truncate">{trial.ageRange}</span>
          </div>
          {trial.locations.length > 0 && (
            <div className="flex items-center gap-2">
              <Icon icon="solar:map-point-linear" width={13} className="text-white/20 shrink-0" />
              <span className="truncate">{trial.locations[0]}</span>
              {trial.locations.length > 1 && (
                <span className="text-white/15">+{trial.locations.length - 1}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Icon icon="solar:buildings-2-linear" width={13} className="text-white/20 shrink-0" />
            <span className="truncate">{trial.sponsor}</span>
          </div>
        </div>

        {/* Intervention pills */}
        {trial.interventions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trial.interventions.slice(0, 3).map((intervention) => (
              <span
                key={intervention}
                className="rounded-full bg-white/[0.04] border border-white/[0.05] px-2.5 py-1 text-[11px] text-white/40 font-light tracking-wide"
              >
                {intervention}
              </span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* Footer: CTA */}
        <div className="flex items-center justify-end">
          <a
            href={trial.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] hover:border-emerald-500/15 transition-all duration-300 text-[12px] text-white/50 hover:text-white/80 font-light tracking-wide"
          >
            View on ClinicalTrials.gov
            <Icon
              icon="solar:arrow-right-up-linear"
              width={13}
              className="text-white/25 group-hover/link:text-emerald-400/60 transition-colors duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transform"
            />
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isRecruiting = status.toUpperCase() === "RECRUITING";
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide uppercase ${
        isRecruiting
          ? "bg-emerald-500/[0.08] text-emerald-400/80 border border-emerald-500/15 shadow-[0_0_8px_rgba(16,185,129,0.06)]"
          : "bg-white/[0.04] text-white/35 border border-white/[0.06]"
      }`}
    >
      {status}
    </span>
  );
}

const matchBadgeStyles: Record<string, string> = {
  "Strong Match":
    "bg-emerald-500/[0.08] text-emerald-400/80 border-emerald-500/15",
  "Possible Match":
    "bg-amber-500/[0.08] text-amber-400/80 border-amber-500/15",
  "Worth Exploring":
    "bg-blue-500/[0.08] text-blue-400/80 border-blue-500/15",
  Unlikely: "bg-red-500/[0.08] text-red-400/80 border-red-500/15",
};

function MatchBadge({ label }: { label: string }) {
  const style =
    matchBadgeStyles[label] ?? matchBadgeStyles["Worth Exploring"];
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-wide ${style}`}
    >
      {label}
    </span>
  );
}

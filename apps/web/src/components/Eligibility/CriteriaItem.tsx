import { Icon } from "@iconify/react";
import type { EligibilityCriterion } from "./types";

const statusConfig = {
  met: {
    icon: "solar:check-circle-bold",
    label: "You meet this",
    pillClass: "bg-emerald-500/[0.08] text-emerald-400/80 border-emerald-500/15",
    iconClass: "text-emerald-400/70",
  },
  unknown: {
    icon: "solar:question-circle-bold",
    label: "To discuss",
    pillClass: "bg-amber-500/[0.08] text-amber-400/80 border-amber-500/15",
    iconClass: "text-amber-400/70",
  },
  not_met: {
    icon: "solar:close-circle-bold",
    label: "May not apply",
    pillClass: "bg-red-500/[0.08] text-red-400/80 border-red-500/15",
    iconClass: "text-red-400/70",
  },
} as const;

interface CriteriaItemProps {
  criterion: EligibilityCriterion;
}

export function CriteriaItem({ criterion }: CriteriaItemProps) {
  const config = statusConfig[criterion.status];

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5 space-y-2 transition-all duration-300 hover:bg-white/[0.04]">
      {/* Status pill + plain English */}
      <div className="flex items-start gap-2.5">
        <Icon
          icon={config.icon}
          width={16}
          className={`mt-0.5 shrink-0 ${config.iconClass}`}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide ${config.pillClass}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-[13px] text-white/70 leading-relaxed font-light">
            {criterion.plainEnglish}
          </p>
        </div>
      </div>

      {/* Reason */}
      {criterion.reason && (
        <p className="text-[11px] text-white/35 leading-relaxed font-light pl-[26px]">
          {criterion.reason}
        </p>
      )}
    </div>
  );
}

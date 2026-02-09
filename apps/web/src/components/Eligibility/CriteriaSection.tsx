import { useState } from "react";
import { Icon } from "@iconify/react";
import { CriteriaItem } from "./CriteriaItem";
import type { EligibilityCriterion } from "./types";

interface CriteriaSectionProps {
  title: string;
  criteria: EligibilityCriterion[];
  defaultOpen?: boolean;
}

export function CriteriaSection({
  title,
  criteria,
  defaultOpen = false,
}: CriteriaSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (criteria.length === 0) return null;

  const metCount = criteria.filter((c) => c.status === "met").length;
  const unknownCount = criteria.filter((c) => c.status === "unknown").length;
  const notMetCount = criteria.filter((c) => c.status === "not_met").length;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 py-2 px-1 group cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <h4 className="text-[13px] font-medium text-white/70 tracking-wide">
            {title}
          </h4>
          <span className="text-[10px] text-white/25 font-mono">
            {criteria.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Mini status summary */}
          <div className="flex items-center gap-1.5 text-[10px]">
            {metCount > 0 && (
              <span className="text-emerald-400/60">{metCount} met</span>
            )}
            {unknownCount > 0 && (
              <span className="text-amber-400/60">{unknownCount} to discuss</span>
            )}
            {notMetCount > 0 && (
              <span className="text-red-400/60">{notMetCount} may not apply</span>
            )}
          </div>

          <Icon
            icon="solar:alt-arrow-down-linear"
            width={14}
            className={`text-white/20 group-hover:text-white/40 transition-all duration-300 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
          {criteria.map((criterion, idx) => (
            <CriteriaItem key={`${criterion.original}-${idx}`} criterion={criterion} />
          ))}
        </div>
      )}
    </div>
  );
}

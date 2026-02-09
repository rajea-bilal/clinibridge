import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

const LOADING_MESSAGES = [
  "Fetching eligibility criteria from ClinicalTrials.gov...",
  "Translating medical language into plain English...",
  "Comparing criteria against your profile...",
  "Almost there — building your personalised breakdown...",
];

export function EligibilitySkeleton() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Progress message */}
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.03] backdrop-blur-sm px-4 py-3.5">
        <div className="shrink-0">
          <Icon
            icon="svg-spinners:pulse-3"
            width={18}
            className="text-emerald-400/60"
          />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-[13px] text-emerald-300/80 font-light transition-all duration-500">
            {LOADING_MESSAGES[msgIndex]}
          </p>
          <p className="text-[11px] text-white/25 font-light">
            This usually takes 5–10 seconds
          </p>
        </div>
      </div>

      {/* Disclaimer skeleton */}
      <div className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />

      {/* Checklist skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-48 rounded bg-white/[0.04] animate-pulse" />
        <div className="space-y-2 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`checklist-skel-${i}`}
              className="h-10 rounded-xl bg-white/[0.03] animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Criteria sections skeleton */}
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={`section-skel-${s}`} className="space-y-2">
          <div className="h-5 w-40 rounded bg-white/[0.04] animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`item-skel-${s}-${i}`}
              className="h-16 rounded-xl bg-white/[0.03] animate-pulse"
              style={{ animationDelay: `${(s * 3 + i) * 80}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

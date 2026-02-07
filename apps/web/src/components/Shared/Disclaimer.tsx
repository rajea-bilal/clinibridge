import { Icon } from "@iconify/react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] backdrop-blur-sm px-4 py-3.5">
      <Icon
        icon="solar:info-circle-linear"
        width={16}
        className="mt-0.5 shrink-0 text-amber-400/60"
      />
      <p className="text-[12px] text-white/40 leading-relaxed font-light">
        <span className="font-medium text-amber-400/70">Disclaimer:</span>{" "}
        CliniBridge is an AI-powered search tool — not medical advice. Trial
        eligibility is determined by each study&apos;s research team. Always consult
        your healthcare provider before enrolling in any clinical trial.
      </p>
    </div>
  );
}

import { Info } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-400" />
      <p className="text-muted-foreground text-xs leading-relaxed">
        <span className="font-medium text-amber-400">Disclaimer:</span>{" "}
        CliniBridge is an AI-powered search tool — not medical advice. Trial
        eligibility is determined by each study's research team. Always consult
        your healthcare provider before enrolling in any clinical trial.
      </p>
    </div>
  );
}

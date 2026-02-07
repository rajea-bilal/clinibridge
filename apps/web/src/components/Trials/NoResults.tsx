import { Icon } from "@iconify/react";

export function NoResults() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.02] backdrop-blur-sm py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
        <Icon
          icon="solar:minimalistic-magnifer-linear"
          width={22}
          className="text-white/20"
        />
      </div>
      <div className="space-y-1.5">
        <p className="text-[14px] font-medium text-white/70">
          No matching trials found
        </p>
        <p className="mx-auto max-w-xs text-[12px] text-white/30 font-light leading-relaxed">
          Try broadening your search criteria, using different terms, or
          checking back later as new trials are posted regularly.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer } from "vaul";
import { Icon } from "@iconify/react";
import { CriteriaSection } from "./CriteriaSection";
import { EligibilitySkeleton } from "./EligibilitySkeleton";
import type { EligibilityBreakdown } from "./types";

interface EligibilityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trialTitle: string;
  nctId: string;
  data: EligibilityBreakdown | null;
  isLoading: boolean;
  error: string | null;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

function EligibilityContent({
  trialTitle,
  nctId,
  data,
  isLoading,
  error,
}: Omit<EligibilityDrawerProps, "open" | "onOpenChange">) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-1.5">
        <h2 className="text-[16px] font-semibold text-white/90 leading-snug">
          Understand this trial
        </h2>
        <p className="text-[12px] text-white/35 font-light">
          {trialTitle}
        </p>
        <span className="block font-mono text-[10px] text-white/20 tracking-[0.1em] uppercase">
          {nctId}
        </span>
      </div>

      {/* Loading state */}
      {isLoading && <EligibilitySkeleton />}

      {/* Error state */}
      {error && !isLoading && (
        <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.04] backdrop-blur-sm p-4">
          <div className="flex items-start gap-2.5">
            <Icon
              icon="solar:danger-triangle-linear"
              width={16}
              className="mt-0.5 shrink-0 text-red-400/60"
            />
            <div>
              <p className="text-[13px] text-red-400/80 font-medium">
                Something went wrong
              </p>
              <p className="text-[12px] text-white/35 font-light mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data */}
      {data && !isLoading && (
        <div className="space-y-5">
          {/* Disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.03] backdrop-blur-sm px-4 py-3.5">
            <Icon
              icon="solar:info-circle-linear"
              width={16}
              className="mt-0.5 shrink-0 text-amber-400/60"
            />
            <p className="text-[12px] text-white/45 leading-relaxed font-light">
              {data.disclaimer}
            </p>
          </div>

          {/* Preparation checklist */}
          {data.preparationChecklist.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:clipboard-list-linear"
                  width={15}
                  className="text-emerald-400/50"
                />
                <h3 className="text-[13px] font-medium text-white/65 tracking-wide">
                  Things to discuss with the coordinator
                </h3>
              </div>
              <div className="space-y-1.5">
                {data.preparationChecklist.map((item, idx) => (
                  <div
                    key={`checklist-${idx}`}
                    className="flex items-start gap-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2.5"
                  >
                    <Icon
                      icon="solar:check-square-linear"
                      width={14}
                      className="mt-0.5 shrink-0 text-emerald-400/40"
                    />
                    <p className="text-[12px] text-white/50 leading-relaxed font-light">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scroll hint */}
          {(data.inclusionCriteria.length > 0 || data.exclusionCriteria.length > 0) && (
            <div className="flex items-center gap-2.5 py-1">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.04]" />
              <div className="flex items-center gap-1.5 text-[10px] text-white/25 font-light tracking-wide">
                <Icon icon="solar:alt-arrow-down-linear" width={12} className="text-emerald-400/40 animate-bounce" />
                <span>Scroll for full eligibility criteria</span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/[0.04]" />
            </div>
          )}

          {/* Criteria sections */}
          <div className="space-y-1">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

            <CriteriaSection
              title="Inclusion Criteria"
              criteria={data.inclusionCriteria}
              defaultOpen={typeof window !== "undefined" && window.innerWidth >= 768}
            />

            {data.exclusionCriteria.length > 0 && (
              <>
                <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                <CriteriaSection
                  title="Exclusion Criteria"
                  criteria={data.exclusionCriteria}
                />
              </>
            )}
          </div>

          {/* Meta info */}
          {data.meta.notes && (
            <p className="text-[10px] text-white/20 font-light italic">
              {data.meta.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function EligibilityDrawer({
  open,
  onOpenChange,
  ...contentProps
}: EligibilityDrawerProps) {
  const isMobile = useIsMobile();

  // Mobile: Vaul drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mt-24 flex h-[85vh] flex-col rounded-t-2xl border-t border-white/[0.06] bg-[#0a0a0f]">
            {/* Drag handle */}
            <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-white/[0.08]" />
            <div className="flex-1 overflow-y-auto px-5 pb-8">
              <EligibilityContent {...contentProps} />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Radix Dialog (modal)
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] rounded-2xl border border-white/[0.06] bg-[#0a0a0f] shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[85vh] flex flex-col">
          <DialogPrimitive.Title className="sr-only">
            Eligibility breakdown for {contentProps.nctId}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Detailed eligibility criteria breakdown
          </DialogPrimitive.Description>

          {/* Close button */}
          <DialogPrimitive.Close className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all duration-200 cursor-pointer">
            <Icon icon="solar:close-circle-linear" width={20} />
          </DialogPrimitive.Close>

          <div className="flex-1 overflow-y-auto p-6">
            <EligibilityContent {...contentProps} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

import { useState } from "react";
import { Icon } from "@iconify/react";
import type { TrialSearchInput } from "@/lib/types";

interface TrialSearchFormProps {
  onSubmit: (input: TrialSearchInput) => void;
  isLoading?: boolean;
}

export function TrialSearchForm({ onSubmit, isLoading }: TrialSearchFormProps) {
  const [condition, setCondition] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [medications, setMedications] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!condition.trim()) {
      newErrors.condition = "Condition is required";
    }
    const ageNum = Number(age);
    if (!age.trim() || Number.isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      newErrors.age = "Valid age (0-120) is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      condition: condition.trim(),
      age: ageNum,
      location: location.trim(),
      medications: medications.trim() || undefined,
      additionalInfo: additionalInfo.trim() || undefined,
    });
  }

  const inputBase =
    "w-full bg-transparent border-b border-white/[0.06] px-1 py-3 text-[15px] text-white/90 placeholder:text-neutral-600 font-light outline-none transition-all duration-500 focus:border-white/[0.12] rounded-none";
  const inputError = "border-red-500/20 focus:border-red-500/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form fields — no box container, just floating fields */}
      <div className="space-y-6">
        {/* Condition */}
        <div className="space-y-2">
          <label htmlFor="condition" className="block text-[11px] font-mono uppercase tracking-[0.15em] text-white/70">
            Medical Condition <span className="text-emerald-400/50">*</span>
          </label>
          <input
            id="condition"
            className={`${inputBase} ${errors.condition ? inputError : ""}`}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            placeholder="e.g. Breast cancer, Type 2 diabetes, Alzheimer's"
            aria-invalid={!!errors.condition}
          />
          {errors.condition && (
            <p className="text-red-400/60 text-[11px] font-light mt-1.5">{errors.condition}</p>
          )}
        </div>

        {/* Age + Location row */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="age" className="block text-[11px] font-mono uppercase tracking-[0.15em] text-white/70">
              Age <span className="text-emerald-400/50">*</span>
            </label>
            <input
              id="age"
              type="number"
              className={`${inputBase} ${errors.age ? inputError : ""}`}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 55"
              min={0}
              max={120}
              aria-invalid={!!errors.age}
            />
            {errors.age && (
              <p className="text-red-400/60 text-[11px] font-light mt-1.5">{errors.age}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="location" className="block text-[11px] font-mono uppercase tracking-[0.15em] text-white/70">
              Location
            </label>
            <input
              id="location"
              className={inputBase}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Boston, MA or California"
            />
          </div>
        </div>

        {/* Thin separator */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* Medications */}
        <div className="space-y-2">
          <label htmlFor="medications" className="block text-[11px] font-mono uppercase tracking-[0.15em] text-white/70">
            Current Medications
          </label>
          <input
            id="medications"
            className={inputBase}
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder="e.g. Metformin, Insulin (comma-separated)"
          />
        </div>

        {/* Additional info */}
        <div className="space-y-2">
          <label htmlFor="additionalInfo" className="block text-[11px] font-mono uppercase tracking-[0.15em] text-white/70">
            Additional Information
          </label>
          <input
            id="additionalInfo"
            className={inputBase}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="e.g. Stage 3, prior chemotherapy, non-smoker"
          />
        </div>
      </div>

      {/* Submit button — understated, chat-style */}
      <div className="relative group pt-2">
        {/* Glow on hover — barely visible, like chat input focus */}
        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/[0.04] via-transparent to-teal-500/[0.04] rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full bg-white/[0.04] backdrop-blur-sm border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/[0.08] rounded-xl transition-all duration-500 px-5 py-3.5 flex items-center justify-center gap-3 disabled:opacity-40 disabled:hover:bg-white/[0.04]"
        >
          {isLoading ? (
            <>
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-emerald-400/50" />
              <span className="text-[13px] font-light tracking-wide text-white/50">
                Searching...
              </span>
            </>
          ) : (
            <>
              <Icon icon="solar:minimalistic-magnifer-linear" width={16} className="text-white/30 group-hover:text-emerald-400/60 transition-colors duration-500" />
              <span className="text-[13px] font-light tracking-wide text-white/50 group-hover:text-white/70 transition-colors duration-500">
                Search Trials
              </span>
            </>
          )}
        </button>
      </div>

      {/* Footer note — like chat disclaimer */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="h-[1px] w-4 bg-gradient-to-r from-transparent to-emerald-500/15" />
        <p className="text-neutral-600 text-[10px] tracking-wide">
          Results sourced from ClinicalTrials.gov
        </p>
        <span className="h-[1px] w-4 bg-gradient-to-l from-transparent to-emerald-500/15" />
      </div>
    </form>
  );
}

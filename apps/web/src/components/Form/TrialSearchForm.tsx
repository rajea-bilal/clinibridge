import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Condition */}
      <div className="space-y-1.5">
        <Label htmlFor="condition">
          Medical Condition <span className="text-destructive">*</span>
        </Label>
        <Input
          id="condition"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder="e.g. Breast cancer, Type 2 diabetes, Alzheimer's"
          aria-invalid={!!errors.condition}
        />
        {errors.condition && (
          <p className="text-destructive text-xs">{errors.condition}</p>
        )}
      </div>

      {/* Age + Location row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="age">
            Age <span className="text-destructive">*</span>
          </Label>
          <Input
            id="age"
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. 55"
            min={0}
            max={120}
            aria-invalid={!!errors.age}
          />
          {errors.age && (
            <p className="text-destructive text-xs">{errors.age}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Boston, MA or California"
          />
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-1.5">
        <Label htmlFor="medications">Current Medications</Label>
        <Input
          id="medications"
          value={medications}
          onChange={(e) => setMedications(e.target.value)}
          placeholder="e.g. Metformin, Insulin (comma-separated)"
        />
      </div>

      {/* Additional info */}
      <div className="space-y-1.5">
        <Label htmlFor="additionalInfo">Additional Information</Label>
        <Input
          id="additionalInfo"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="e.g. Stage 3, prior chemotherapy, non-smoker"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="size-4" />
            Search Trials
          </>
        )}
      </Button>
    </form>
  );
}

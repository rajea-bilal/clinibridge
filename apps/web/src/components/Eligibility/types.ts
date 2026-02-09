/** Mirrors the Convex action return type */
export interface EligibilityCriterion {
  original: string;
  plainEnglish: string;
  status: "met" | "not_met" | "unknown";
  reason: string;
}

export interface EligibilityBreakdown {
  trialId: string;
  disclaimer: string;
  inclusionCriteria: EligibilityCriterion[];
  exclusionCriteria: EligibilityCriterion[];
  preparationChecklist: string[];
  meta: {
    source: string;
    criteriaPresent: boolean;
    notes: string;
  };
}

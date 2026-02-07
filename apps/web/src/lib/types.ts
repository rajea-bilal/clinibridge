/** Raw record shape close to the ClinicalTrials.gov v2 API response */
export interface TrialRaw {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  briefSummary?: string;
  overallStatus: string;
  phase?: string;
  conditions: string[];
  eligibilityCriteria?: string;
  minimumAge?: string;
  maximumAge?: string;
  sex?: string;
  locations: TrialLocation[];
  startDate?: string;
  primaryCompletionDate?: string;
  studyType?: string;
  enrollmentCount?: number;
  interventions: string[];
  sponsor?: string;
  url: string;
}

export interface TrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

/** Simplified summary for UI rendering and AI scoring */
export interface TrialSummary {
  nctId: string;
  title: string;
  summary: string;
  status: string;
  phase: string;
  conditions: string[];
  eligibility: string;
  eligibilityFull?: string; // longer version for AI scoring (up to 1500 chars)
  ageRange: string;
  locations: string[];
  interventions: string[];
  sponsor: string;
  matchScore: number; // 0-100
  matchLabel?: "Strong Match" | "Possible Match" | "Worth Exploring" | "Unlikely";
  matchReason?: string; // plain English explanation of match
  url: string;
}

/** Input shape for form-based trial search */
export interface TrialSearchInput {
  condition: string;
  age: number;
  location: string;
  medications?: string;
  additionalInfo?: string;
}

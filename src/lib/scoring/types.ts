export type ScoreTier = "HIGH" | "MEDIUM" | "LOW";

export type SignalStrength = "positive" | "neutral" | "negative";

export type ScoringFactorName =
  | "Industry fit"
  | "Company size fit"
  | "Revenue fit"
  | "Growth signals"
  | "Technology fit"
  | "Location fit"
  | "Contact completeness"
  | "Data quality";

export type ScoringFactor = {
  factor: ScoringFactorName;
  points: number;
  maxPoints: number;
  reason: string;
  signal: SignalStrength;
};

export type LeadScoringInput = {
  industry?: string | null;
  subIndustry?: string | null;
  employeeCount?: number | null;
  revenue?: number | string | { toNumber(): number } | null;
  revenueCurrency?: string | null;
  technologies?: readonly string[] | null;
  hiringSignal?: string | null;
  growthSignal?: string | null;
  fundingSignal?: string | null;
  country?: string | null;
  contactName?: string | null;
  contactTitle?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  linkedinUrl?: string | null;
  emailVerified?: boolean | null;
  phoneVerified?: boolean | null;
  dataSource?: string | null;
  lastUpdated?: Date | string | null;
  website?: string | null;
  domain?: string | null;
};

export type LeadOpportunityScore = {
  totalScore: number;
  tier: ScoreTier;
  tierLabel: "High Priority" | "Medium Priority" | "Low Priority";
  factors: ScoringFactor[];
  reasons: string[];
};

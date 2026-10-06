import { MAX_OPPORTUNITY_SCORE } from "./config";
import { scoreLead } from "./index";
import type {
  LeadOpportunityScore,
  LeadScoringInput,
  ScoringFactorName,
  SignalStrength,
  ScoreTier,
} from "./types";

const factorNames = [
  "Industry fit",
  "Company size fit",
  "Revenue fit",
  "Growth signals",
  "Technology fit",
  "Location fit",
  "Contact completeness",
  "Data quality",
] satisfies ScoringFactorName[];

const tierLabels: Record<ScoreTier, LeadOpportunityScore["tierLabel"]> = {
  HIGH: "High Priority",
  MEDIUM: "Medium Priority",
  LOW: "Low Priority",
};

type StoredFactor = {
  factor: string;
  points: number;
  maxPoints: number;
  reason: string;
  signal: string;
};

type StoredLeadScore = LeadScoringInput & {
  opportunityScore: number | null;
  scoreTier: ScoreTier | null;
  scoreReasons: string[];
  scoreFactors: StoredFactor[];
};

const isFactorName = (value: string): value is ScoringFactorName =>
  factorNames.some((name) => name === value);

const isSignalStrength = (value: string): value is SignalStrength =>
  value === "positive" || value === "neutral" || value === "negative";

export function scoreFromStoredLead(lead: StoredLeadScore): LeadOpportunityScore {
  const score = lead.opportunityScore;
  const tier = lead.scoreTier;
  const factors = lead.scoreFactors;

  if (
    score == null ||
    tier == null ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_OPPORTUNITY_SCORE ||
    factors.length !== factorNames.length ||
    new Set(factors.map(({ factor }) => factor)).size !== factorNames.length ||
    !factorNames.every((name) => factors.some(({ factor }) => factor === name)) ||
    factors.reduce((sum, factor) => sum + factor.maxPoints, 0) !==
      MAX_OPPORTUNITY_SCORE ||
    factors.some(
      (factor) =>
        !isFactorName(factor.factor) ||
        !isSignalStrength(factor.signal) ||
        !Number.isInteger(factor.points) ||
        !Number.isInteger(factor.maxPoints) ||
        factor.maxPoints <= 0 ||
        factor.points < 0 ||
        factor.points > factor.maxPoints ||
        !factor.reason.trim(),
    ) ||
    factors.reduce((sum, factor) => sum + factor.points, 0) !== score
  ) {
    return scoreLead(lead);
  }

  return {
    totalScore: score,
    tier,
    tierLabel: tierLabels[tier],
    factors: factors.map((factor) => ({
      factor: factor.factor as ScoringFactorName,
      points: factor.points,
      maxPoints: factor.maxPoints,
      reason: factor.reason,
      signal: factor.signal as SignalStrength,
    })),
    reasons: lead.scoreReasons,
  };
}

export type LeadBrief = {
  summary: string;
  whyThisLead: string;
  strongestSignals: string[];
  potentialRisks: string[];
  recommendedOutreachAngle: string;
  recommendedNextAction: string;
};

export const leadBriefJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    whyThisLead: { type: "string" },
    strongestSignals: {
      type: "array",
      items: { type: "string" },
    },
    potentialRisks: {
      type: "array",
      items: { type: "string" },
    },
    recommendedOutreachAngle: { type: "string" },
    recommendedNextAction: { type: "string" },
  },
  required: [
    "summary",
    "whyThisLead",
    "strongestSignals",
    "potentialRisks",
    "recommendedOutreachAngle",
    "recommendedNextAction",
  ],
} as const;

export function isLeadBrief(value: unknown): value is LeadBrief {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const brief = value as Record<string, unknown>;
  const isNonEmptyText = (item: unknown): item is string =>
    typeof item === "string" && item.trim().length > 0;
  const isNonEmptyTextList = (item: unknown): item is string[] =>
    Array.isArray(item) &&
    item.length >= 1 &&
    item.length <= 5 &&
    item.every(isNonEmptyText);

  return (
    isNonEmptyText(brief.summary) &&
    brief.summary.length <= 700 &&
    isNonEmptyText(brief.whyThisLead) &&
    brief.whyThisLead.length <= 700 &&
    isNonEmptyTextList(brief.strongestSignals) &&
    brief.strongestSignals.every((signal) => signal.length <= 240) &&
    isNonEmptyTextList(brief.potentialRisks) &&
    brief.potentialRisks.every((risk) => risk.length <= 240) &&
    isNonEmptyText(brief.recommendedOutreachAngle) &&
    brief.recommendedOutreachAngle.length <= 700 &&
    isNonEmptyText(brief.recommendedNextAction) &&
    brief.recommendedNextAction.length <= 500
  );
}

export function cachedLeadBrief(lead: {
  aiSummary: string | null;
  aiWhyAttractive: string | null;
  aiStrongestSignals: string[];
  aiRisks: string[];
  aiOutreachAngle: string | null;
  aiNextAction: string | null;
}): LeadBrief | null {
  const candidate = {
    summary: lead.aiSummary,
    whyThisLead: lead.aiWhyAttractive,
    strongestSignals: lead.aiStrongestSignals,
    potentialRisks: lead.aiRisks,
    recommendedOutreachAngle: lead.aiOutreachAngle,
    recommendedNextAction: lead.aiNextAction,
  };
  return isLeadBrief(candidate) ? candidate : null;
}

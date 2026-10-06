import {
  MAX_OPPORTUNITY_SCORE,
  scoringConfig,
  scoringFactorMaximums,
} from "./config";
import type {
  LeadOpportunityScore,
  LeadScoringInput,
  ScoringFactor,
  ScoringFactorName,
  ScoreTier,
  SignalStrength,
} from "./types";

const nonEmpty = (value: string | null | undefined): string =>
  value?.trim() ?? "";

const pointsFromFraction = (maximum: number, fraction: number): number =>
  Math.round(maximum * Math.min(1, Math.max(0, fraction)));

const neutralPoints = (maximum: number): number =>
  pointsFromFraction(maximum, scoringConfig.neutralPointsFraction);

function factor(
  name: ScoringFactorName,
  points: number,
  maxPoints: number,
  reason: string,
  signal: SignalStrength,
): ScoringFactor {
  return { factor: name, points, maxPoints, reason, signal };
}

function scoreIndustry(lead: LeadScoringInput): ScoringFactor {
  const industry = nonEmpty(lead.industry).toLowerCase();
  const subIndustry = nonEmpty(lead.subIndustry).toLowerCase();
  const maximum = scoringFactorMaximums.industryFit;

  if (!industry && !subIndustry) {
    return factor(
      "Industry fit",
      neutralPoints(maximum),
      maximum,
      "Industry information is unavailable; no industry-fit penalty was applied.",
      "neutral",
    );
  }

  const preferredIndustries = scoringConfig.industry.preferredIndustries;
  const preferredSubIndustries = scoringConfig.industry.preferredSubIndustries;
  if (
    preferredIndustries.some((value) => value === industry) ||
    preferredSubIndustries.some((value) => value === subIndustry)
  ) {
    return factor(
      "Industry fit",
      maximum,
      maximum,
      `The ${industry || subIndustry} industry matches a configured target market.`,
      "positive",
    );
  }

  return factor(
    "Industry fit",
    pointsFromFraction(
      maximum,
      scoringConfig.industry.unmatchedIndustryPointsFraction,
    ),
    maximum,
    `The ${industry || subIndustry} industry is outside the configured target markets.`,
    "negative",
  );
}

function scoreCompanySize(lead: LeadScoringInput): ScoringFactor {
  const maximum = scoringFactorMaximums.companySizeFit;
  const count = lead.employeeCount;
  if (count == null || !Number.isFinite(count)) {
    return factor(
      "Company size fit",
      neutralPoints(maximum),
      maximum,
      "Employee count is unavailable; company-size fit remains unassessed.",
      "neutral",
    );
  }
  if (count < 0) {
    return factor(
      "Company size fit",
      0,
      maximum,
      "Employee count is invalid and cannot support a size-fit assessment.",
      "negative",
    );
  }
  const formattedCount = count.toLocaleString("en-US");

  const { preferredMaximum, preferredMinimum, adjacentMinimum } =
    scoringConfig.companySize;
  if (count >= preferredMinimum && count <= preferredMaximum) {
    return factor(
      "Company size fit",
      maximum,
      maximum,
      `${formattedCount} employees falls within the configured target range.`,
      "positive",
    );
  }
  if (count >= adjacentMinimum && count < preferredMinimum) {
    return factor(
      "Company size fit",
      pointsFromFraction(
        maximum,
        scoringConfig.companySize.adjacentPointsFraction,
      ),
      maximum,
      `${formattedCount} employees is below the target range but remains a plausible fit.`,
      "neutral",
    );
  }
  if (count > preferredMaximum) {
    return factor(
      "Company size fit",
      pointsFromFraction(
        maximum,
        scoringConfig.companySize.adjacentPointsFraction,
      ),
      maximum,
      `${formattedCount} employees is above the target range but may still be a viable fit.`,
      "neutral",
    );
  }

  return factor(
    "Company size fit",
    pointsFromFraction(
      maximum,
      scoringConfig.companySize.distantPointsFraction,
    ),
    maximum,
    `${formattedCount} employees is substantially below the configured target range.`,
    "negative",
  );
}

function numericRevenue(value: LeadScoringInput["revenue"]): number | null {
  if (value == null) return null;

  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : value.toNumber();
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreRevenue(lead: LeadScoringInput): ScoringFactor {
  const maximum = scoringFactorMaximums.revenueFit;
  const revenue = numericRevenue(lead.revenue);
  const currency = nonEmpty(lead.revenueCurrency);
  if (lead.revenue != null && revenue == null) {
    return factor(
      "Revenue fit",
      0,
      maximum,
      "Reported revenue is invalid and cannot support a fit assessment.",
      "negative",
    );
  }
  if (revenue == null || !currency) {
    return factor(
      "Revenue fit",
      neutralPoints(maximum),
      maximum,
      "Revenue or its currency is unavailable; revenue fit remains unassessed.",
      "neutral",
    );
  }

  if (currency.toUpperCase() !== scoringConfig.revenue.targetCurrency) {
    return factor(
      "Revenue fit",
      neutralPoints(maximum),
      maximum,
      `Revenue is reported in ${currency.toUpperCase()}; it was not compared to the ${scoringConfig.revenue.targetCurrency} target range.`,
      "neutral",
    );
  }

  if (revenue < 0) {
    return factor(
      "Revenue fit",
      0,
      maximum,
      "Reported revenue is invalid and cannot support a fit assessment.",
      "negative",
    );
  }

  const { adjacentMinimum, preferredMaximum, preferredMinimum } =
    scoringConfig.revenue;
  if (revenue >= preferredMinimum && revenue <= preferredMaximum) {
    return factor(
      "Revenue fit",
      maximum,
      maximum,
      `Annual revenue of ${formatCurrency(revenue)} is within the configured target range.`,
      "positive",
    );
  }
  if (revenue >= adjacentMinimum) {
    return factor(
      "Revenue fit",
      pointsFromFraction(
        maximum,
        scoringConfig.revenue.adjacentPointsFraction,
      ),
      maximum,
      `Annual revenue of ${formatCurrency(revenue)} is outside but near the configured target range.`,
      "neutral",
    );
  }

  return factor(
    "Revenue fit",
    pointsFromFraction(
      maximum,
      scoringConfig.revenue.distantPointsFraction,
    ),
    maximum,
    `Annual revenue of ${formatCurrency(revenue)} is below the configured target range.`,
    "negative",
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    currency: scoringConfig.revenue.targetCurrency,
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function includesAny(text: string, terms: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

type SignalPoints = {
  points: number;
  strength: SignalStrength;
  reason: string;
};

function scoreTextSignal(
  value: string | null | undefined,
  maximum: number,
  positiveTerms: readonly string[],
  label: string,
): SignalPoints {
  const text = nonEmpty(value);
  if (!text) {
    return {
      points: neutralPoints(maximum),
      strength: "neutral",
      reason: `${label} information is unavailable.`,
    };
  }

  if (includesAny(text, scoringConfig.growth.negativeSignalTerms)) {
    return {
      points: 0,
      strength: "negative",
      reason: `${label} contains a contraction or hiring-risk signal.`,
    };
  }

  if (includesAny(text, scoringConfig.growth.neutralSignalTerms)) {
    return {
      points: neutralPoints(maximum),
      strength: "neutral",
      reason: `${label} is explicitly unavailable or unreported.`,
    };
  }

  if (includesAny(text, positiveTerms)) {
    return {
      points: maximum,
      strength: "positive",
      reason: `${label} indicates a positive expansion or investment signal.`,
    };
  }

  return {
    points: neutralPoints(maximum),
    strength: "neutral",
    reason: `${label} is present but does not clearly indicate expansion or contraction.`,
  };
}

function scoreHiringSignal(value: string | null | undefined): SignalPoints {
  const maximum = scoringConfig.growth.weights.hiring;
  const text = nonEmpty(value);
  if (!text) {
    return {
      points: neutralPoints(maximum),
      strength: "neutral",
      reason: "Hiring information is unavailable.",
    };
  }

  if (includesAny(text, scoringConfig.growth.negativeSignalTerms)) {
    return {
      points: 0,
      strength: "negative",
      reason: "Hiring data contains a layoff, hiring-freeze, or contraction signal.",
    };
  }

  const roleCount = text.match(
    /\b(\d+)\s+(?:open|new)\s+(?:roles?|positions?|jobs?)\b/i,
  )?.[1];
  if (roleCount != null) {
    const count = Number(roleCount);
    if (count === 0) {
      return {
        points: neutralPoints(maximum),
        strength: "neutral",
        reason: "No open roles are currently reported.",
      };
    }
    if (count >= scoringConfig.growth.strongHiringRoles) {
      return {
        points: maximum,
        strength: "positive",
        reason: `Strong hiring activity reports ${count} open roles.`,
      };
    }
    if (count >= scoringConfig.growth.moderateHiringRoles) {
      return {
        points: pointsFromFraction(
          maximum,
          scoringConfig.growth.moderateHiringPointsFraction,
        ),
        strength: "positive",
        reason: `Moderate hiring activity reports ${count} open roles.`,
      };
    }
    return {
      points: pointsFromFraction(
        maximum,
        scoringConfig.growth.lowHiringPointsFraction,
      ),
      strength: "positive",
      reason: `Some hiring activity reports ${count} open role${count === 1 ? "" : "s"}.`,
    };
  }

  if (/\b(hiring|recruiting|open roles?|open positions?)\b/i.test(text)) {
    return {
      points: pointsFromFraction(
        maximum,
        scoringConfig.growth.uncountedHiringPointsFraction,
      ),
      strength: "positive",
      reason: "Hiring activity is reported.",
    };
  }

  return {
    points: neutralPoints(maximum),
    strength: "neutral",
    reason: "Hiring data is present but does not confirm open roles.",
  };
}

function scoreGrowthSignals(lead: LeadScoringInput): ScoringFactor {
  const { funding, growth } = scoringConfig.growth.weights;
  const parts = [
    scoreHiringSignal(lead.hiringSignal),
    scoreTextSignal(
      lead.growthSignal,
      growth,
      scoringConfig.growth.positiveGrowthTerms,
      "Growth signal",
    ),
    scoreTextSignal(
      lead.fundingSignal,
      funding,
      scoringConfig.growth.positiveFundingTerms,
      "Funding signal",
    ),
  ];
  const hasPositive = parts.some((part) => part.strength === "positive");
  const hasNegative = parts.some((part) => part.strength === "negative");
  const signal: SignalStrength = hasPositive && !hasNegative
    ? "positive"
    : hasNegative && !hasPositive
      ? "negative"
      : "neutral";

  return factor(
    "Growth signals",
    Math.round(parts.reduce((sum, part) => sum + part.points, 0)),
    scoringFactorMaximums.growthSignals,
    parts.map((part) => part.reason).join(" "),
    signal,
  );
}

function scoreTechnology(lead: LeadScoringInput): ScoringFactor {
  const maximum = scoringFactorMaximums.technologyFit;
  const technologies = (lead.technologies ?? [])
    .map((technology) => technology.trim().toLowerCase())
    .filter(Boolean);

  if (technologies.length === 0) {
    return factor(
      "Technology fit",
      neutralPoints(maximum),
      maximum,
      "Technology information is unavailable; technology fit remains unassessed.",
      "neutral",
    );
  }

  const matches = technologies.filter((technology) =>
    scoringConfig.technology.preferredTechnologies.some(
      (preferred) =>
        technology === preferred ||
        technology.includes(preferred) ||
        preferred.includes(technology),
    ),
  );
  if (matches.length >= scoringConfig.technology.strongMatchCount) {
    return factor(
      "Technology fit",
      maximum,
      maximum,
      `Relevant technology signals match: ${matches.join(", ")}.`,
      "positive",
    );
  }
  if (matches.length > 0) {
    return factor(
      "Technology fit",
      pointsFromFraction(
        maximum,
        scoringConfig.technology.partialMatchPointsFraction,
      ),
      maximum,
      `Some relevant technology fit is present: ${matches.join(", ")}.`,
      "positive",
    );
  }

  return factor(
    "Technology fit",
    pointsFromFraction(
      maximum,
      scoringConfig.technology.unmatchedTechnologyPointsFraction,
    ),
    maximum,
    "Provided technologies do not match the configured technology profile.",
    "negative",
  );
}

function scoreLocation(lead: LeadScoringInput): ScoringFactor {
  const maximum = scoringFactorMaximums.locationFit;
  const country = nonEmpty(lead.country).toUpperCase();
  if (!country) {
    return factor(
      "Location fit",
      neutralPoints(maximum),
      maximum,
      "Country information is unavailable; location fit remains unassessed.",
      "neutral",
    );
  }
  if (scoringConfig.location.preferredCountries.some((item) => item === country)) {
    return factor(
      "Location fit",
      maximum,
      maximum,
      `${country} is included in the configured target markets.`,
      "positive",
    );
  }
  return factor(
    "Location fit",
    pointsFromFraction(
      maximum,
      scoringConfig.location.otherCountryPointsFraction,
    ),
    maximum,
    `${country} is outside the preferred markets but is not treated as a disqualifier.`,
    "neutral",
  );
}

function scoreContactCompleteness(lead: LeadScoringInput): ScoringFactor {
  const fields = scoringConfig.contact.fields;
  const present = fields.filter(({ field }) => {
    const value = lead[field];
    return typeof value === "string" && value.trim().length > 0;
  });
  const missing = fields
    .filter(({ field }) => {
      const value = lead[field];
      return typeof value !== "string" || value.trim().length === 0;
    })
    .map(({ label, points: fieldPoints }) => ({ label, points: fieldPoints }));
  const points = Math.min(
    scoringFactorMaximums.contactCompleteness,
    Math.round(
      present.reduce((sum, { points: fieldPoints }) => sum + fieldPoints, 0) +
        missing.reduce(
          (sum, field) =>
            sum +
            field.points * scoringConfig.contact.missingFieldPointsFraction,
          0,
        ),
    ),
  );

  return factor(
    "Contact completeness",
    points,
    scoringFactorMaximums.contactCompleteness,
    missing.length === 0
      ? "All configured contact fields are present."
      : `Contact details include ${present.length} of ${fields.length} fields; missing ${missing.map(({ label }) => label).join(", ")}.`,
    missing.length === 0 ? "positive" : "neutral",
  );
}

function scoreDataQuality(lead: LeadScoringInput): ScoringFactor {
  const { dataQuality } = scoringConfig;
  let points = 0;
  const concerns: string[] = [];
  const negativeSignals: string[] = [];
  const positives: string[] = [];

  const domain = nonEmpty(lead.domain);
  if (!domain) {
    points += dataQuality.signals.domain * dataQuality.missingEvidencePointsFraction;
    concerns.push("domain is unavailable");
  } else if (/^(?=.{1,253}$)(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,}$/i.test(domain)) {
    points += dataQuality.signals.domain;
    positives.push("domain is present");
  } else {
    const concern = "domain format needs review";
    concerns.push(concern);
    negativeSignals.push(concern);
  }

  const website = nonEmpty(lead.website);
  if (!website) {
    points += dataQuality.signals.website * dataQuality.missingEvidencePointsFraction;
    concerns.push("website is unavailable");
  } else {
    try {
      const parsed = new URL(website);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        points += dataQuality.signals.website;
        positives.push("website is valid");
      } else {
        const concern = "website URL needs review";
        concerns.push(concern);
        negativeSignals.push(concern);
      }
    } catch {
      const concern = "website URL needs review";
      concerns.push(concern);
      negativeSignals.push(concern);
    }
  }

  if (nonEmpty(lead.dataSource)) {
    points += dataQuality.signals.dataSource;
    positives.push("data source is recorded");
  } else {
    points += dataQuality.signals.dataSource * dataQuality.missingEvidencePointsFraction;
    concerns.push("data source is unavailable");
  }

  if (lead.lastUpdated instanceof Date && Number.isFinite(lead.lastUpdated.getTime())) {
    points += dataQuality.signals.lastUpdated;
    positives.push("last-updated timestamp is recorded");
  } else if (
    typeof lead.lastUpdated === "string" &&
    Number.isFinite(Date.parse(lead.lastUpdated))
  ) {
    points += dataQuality.signals.lastUpdated;
    positives.push("last-updated timestamp is recorded");
  } else {
    points += dataQuality.signals.lastUpdated * dataQuality.missingEvidencePointsFraction;
    concerns.push("last-updated timestamp is unavailable");
  }

  points += scoreVerification(
    lead.contactEmail,
    lead.emailVerified,
    dataQuality.signals.verifiedEmail,
    "email verification",
    positives,
    concerns,
    negativeSignals,
  );
  points += scoreVerification(
    lead.contactPhone,
    lead.phoneVerified,
    dataQuality.signals.verifiedPhone,
    "phone verification",
    positives,
    concerns,
    negativeSignals,
  );

  const maximum = scoringFactorMaximums.dataQuality;
  const roundedPoints = Math.min(maximum, Math.round(points));
  const signal: SignalStrength =
    negativeSignals.length > 0
      ? positives.length === 0 ? "negative" : "neutral"
      : positives.length > 0 ? "positive" : "neutral";

  return factor(
    "Data quality",
    roundedPoints,
    maximum,
    concerns.length === 0
      ? `Data quality checks passed: ${positives.join(", ")}.`
      : `Data quality: ${positives.join(", ") || "no positive checks passed"}; ${concerns.join(", ")}.`,
    signal,
  );
}

function scoreVerification(
  contactValue: string | null | undefined,
  verified: boolean | null | undefined,
  maximum: number,
  label: string,
  positives: string[],
  concerns: string[],
  negativeSignals: string[],
): number {
  if (!nonEmpty(contactValue)) {
    concerns.push(`${label} cannot be assessed without contact data`);
    return maximum * scoringConfig.dataQuality.missingEvidencePointsFraction;
  }
  if (verified === true) {
    positives.push(`${label} passed`);
    return maximum;
  }
  concerns.push(`${label} is unverified`);
  negativeSignals.push(`${label} is unverified`);
  return 0;
}

export function getScoreTier(score: number): ScoreTier {
  if (!Number.isFinite(score)) {
    throw new RangeError("Opportunity score must be a finite number.");
  }
  if (score < 0 || score > MAX_OPPORTUNITY_SCORE) {
    throw new RangeError(`Opportunity score must be between 0 and ${MAX_OPPORTUNITY_SCORE}.`);
  }
  if (score >= scoringConfig.tiers.highPriorityMinimum) return "HIGH";
  if (score >= scoringConfig.tiers.mediumPriorityMinimum) return "MEDIUM";
  return "LOW";
}

const tierLabels: Record<ScoreTier, LeadOpportunityScore["tierLabel"]> = {
  HIGH: "High Priority",
  MEDIUM: "Medium Priority",
  LOW: "Low Priority",
};

export function scoreLead(lead: LeadScoringInput): LeadOpportunityScore {
  const factors = [
    scoreIndustry(lead),
    scoreCompanySize(lead),
    scoreRevenue(lead),
    scoreGrowthSignals(lead),
    scoreTechnology(lead),
    scoreLocation(lead),
    scoreContactCompleteness(lead),
    scoreDataQuality(lead),
  ];
  const totalScore = Math.max(
    0,
    Math.min(
      MAX_OPPORTUNITY_SCORE,
      factors.reduce((sum, item) => sum + item.points, 0),
    ),
  );
  const tier = getScoreTier(totalScore);

  return {
    totalScore,
    tier,
    tierLabel: tierLabels[tier],
    factors,
    reasons: factors.map(
      ({ factor: factorName, points, maxPoints, reason }) =>
        `${factorName} (${points}/${maxPoints}): ${reason}`,
    ),
  };
}

export type {
  LeadOpportunityScore,
  LeadScoringInput,
  ScoringFactor,
  ScoringFactorName,
  ScoreTier,
  SignalStrength,
} from "./types";

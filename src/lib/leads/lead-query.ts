import { Prisma, ScoreTier } from "@/generated/prisma/client";

export const orderByOptions = {
  score: [
    { opportunityScore: { sort: "desc", nulls: "last" } },
    { companyName: "asc" },
    { id: "asc" },
  ],
  company: [{ companyName: "asc" }, { id: "asc" }],
  revenue: [
    { revenue: { sort: "desc", nulls: "last" } },
    { companyName: "asc" },
    { id: "asc" },
  ],
  employees: [
    { employeeCount: { sort: "desc", nulls: "last" } },
    { companyName: "asc" },
    { id: "asc" },
  ],
} satisfies Record<string, Prisma.LeadOrderByWithRelationInput[]>;

export type SortOption = keyof typeof orderByOptions;

function parseInteger(
  value: string | null,
  fallback: number,
  name: string,
): number {
  if (value == null || value === "") return fallback;
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} must be a non-negative whole number.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`${name} is outside the supported range.`);
  }
  return parsed;
}

function parseScoreFilter(
  value: string | null,
  name: string,
): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = parseInteger(value, 0, name);
  if (parsed > 100) {
    throw new Error(`${name} must be between 0 and 100.`);
  }
  return parsed;
}

function parseEmployeeFilter(
  value: string | null,
  name: string,
): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = parseInteger(value, 0, name);
  if (parsed > 100_000_000) {
    throw new Error(`${name} must not exceed 100,000,000.`);
  }
  return parsed;
}

function parseRevenueFilter(
  value: string | null,
  name: string,
): Prisma.Decimal | undefined {
  if (value == null || value === "") return undefined;
  if (!/^\d{1,14}(?:\.\d{1,2})?$/.test(value)) {
    throw new Error(
      `${name} must be a non-negative amount with up to two decimal places.`,
    );
  }
  return new Prisma.Decimal(value);
}

function getOptionalFilter(
  params: URLSearchParams,
  name: string,
  maxLength: number,
): string | undefined {
  const value = params.get(name)?.trim();
  if (!value) return undefined;
  if (value.length > maxLength) {
    throw new Error(`${name} is too long.`);
  }
  return value;
}

export function buildLeadWhere(params: URLSearchParams): Prisma.LeadWhereInput {
  const search = getOptionalFilter(params, "q", 120);
  const industry = getOptionalFilter(params, "industry", 120);
  const location = getOptionalFilter(params, "location", 160);
  const priority = getOptionalFilter(params, "priority", 10);
  const minScore = parseScoreFilter(params.get("minScore"), "minScore");
  const maxScore = parseScoreFilter(params.get("maxScore"), "maxScore");
  const minEmployees = parseEmployeeFilter(params.get("minEmployees"), "minEmployees");
  const maxEmployees = parseEmployeeFilter(params.get("maxEmployees"), "maxEmployees");
  const minRevenue = parseRevenueFilter(params.get("minRevenue"), "minRevenue");
  const maxRevenue = parseRevenueFilter(params.get("maxRevenue"), "maxRevenue");
  const dataQuality = getOptionalFilter(params, "dataQuality", 20);

  if (minScore != null && maxScore != null && minScore > maxScore) {
    throw new Error("minScore cannot be greater than maxScore.");
  }
  if (minEmployees != null && maxEmployees != null && minEmployees > maxEmployees) {
    throw new Error("minEmployees cannot be greater than maxEmployees.");
  }
  if (minRevenue && maxRevenue && minRevenue.greaterThan(maxRevenue)) {
    throw new Error("minRevenue cannot be greater than maxRevenue.");
  }
  if (dataQuality && dataQuality !== "COMPLETE" && dataQuality !== "NEEDS_REVIEW") {
    throw new Error("dataQuality must be COMPLETE or NEEDS_REVIEW.");
  }

  const where: Prisma.LeadWhereInput = {};
  const andConditions: Prisma.LeadWhereInput[] = [];
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { domain: { contains: search, mode: "insensitive" } },
      { industry: { contains: search, mode: "insensitive" } },
      { contactName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (industry) where.industry = industry;
  if (location) where.location = location;

  if (priority && priority !== "ALL") {
    if (!Object.values(ScoreTier).includes(priority as ScoreTier)) {
      throw new Error("priority must be HIGH, MEDIUM, or LOW.");
    }
    where.scoreTier = priority as ScoreTier;
  }
  if (minScore != null || maxScore != null) {
    where.opportunityScore = {
      ...(minScore != null ? { gte: minScore } : {}),
      ...(maxScore != null ? { lte: maxScore } : {}),
    };
  }
  if (minEmployees != null || maxEmployees != null) {
    where.employeeCount = {
      ...(minEmployees != null ? { gte: minEmployees } : {}),
      ...(maxEmployees != null ? { lte: maxEmployees } : {}),
    };
  }
  if (minRevenue || maxRevenue) {
    andConditions.push(
      { revenueCurrency: "USD" },
      {
        revenue: {
          ...(minRevenue ? { gte: minRevenue } : {}),
          ...(maxRevenue ? { lte: maxRevenue } : {}),
        },
      },
    );
  }
  if (dataQuality === "COMPLETE") {
    andConditions.push(
      { domain: { not: null } },
      { industry: { not: null } },
      { employeeCount: { not: null } },
      { revenue: { not: null } },
      { contactName: { not: null } },
      { contactTitle: { not: null } },
      { contactEmail: { not: null } },
      { revenueCurrency: { not: null } },
      { emailVerified: true },
    );
  } else if (dataQuality === "NEEDS_REVIEW") {
    andConditions.push({
      OR: [
        { domain: null },
        { industry: null },
        { employeeCount: null },
        { revenue: null },
        { contactName: null },
        { contactTitle: null },
        { contactEmail: null },
        { revenueCurrency: null },
        { emailVerified: false },
      ],
    });
  }
  if (andConditions.length > 0) where.AND = andConditions;

  return where;
}

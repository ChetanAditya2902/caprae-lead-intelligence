import { Prisma, ScoreTier } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { leadRecordSelect, toLeadRecord } from "@/lib/leads/serialize";
import type { LeadListResponse, LeadRecord } from "@/types/lead-record";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;
const MAX_EXPORT_ROWS = 10_000;
const MAX_SEARCH_LENGTH = 120;

const orderByOptions = {
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

type SortOption = keyof typeof orderByOptions;

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

function buildWhere(params: URLSearchParams): Prisma.LeadWhereInput {
  const search = getOptionalFilter(params, "q", MAX_SEARCH_LENGTH);
  const industry = getOptionalFilter(params, "industry", 120);
  const location = getOptionalFilter(params, "location", 160);
  const priority = getOptionalFilter(params, "priority", 10);
  const minScore = parseScoreFilter(params.get("minScore"), "minScore");
  const maxScore = parseScoreFilter(params.get("maxScore"), "maxScore");

  if (minScore != null && maxScore != null && minScore > maxScore) {
    throw new Error("minScore cannot be greater than maxScore.");
  }

  const where: Prisma.LeadWhereInput = {};
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

  return where;
}

function csvCell(value: string | number | null): string {
  let normalized = value == null ? "" : String(value);
  if (/^[\s]*[=+\-@\t\r]/.test(normalized)) {
    normalized = `'${normalized}`;
  }
  return `"${normalized.replaceAll('"', '""')}"`;
}

function toCsv(records: LeadRecord[]): string {
  const columns: Array<[string, (lead: LeadRecord) => string | number | null]> = [
    ["Company", (lead) => lead.companyName],
    ["Domain", (lead) => lead.domain],
    ["Industry", (lead) => lead.industry],
    ["Location", (lead) => lead.location],
    ["Employee count", (lead) => lead.employeeCount],
    ["Revenue", (lead) => lead.revenue],
    ["Revenue currency", (lead) => lead.revenueCurrency],
    ["Opportunity score", (lead) => lead.opportunityScore],
    ["Priority", (lead) => lead.scoreTier],
    ["Top signal", (lead) => lead.topSignal],
    ["Contact name", (lead) => lead.contactName],
    ["Contact title", (lead) => lead.contactTitle],
    ["Contact email", (lead) => lead.contactEmail],
    ["Contact status", (lead) => lead.contactStatus],
  ];
  return [
    columns.map(([label]) => csvCell(label)).join(","),
    ...records.map((lead) =>
      columns.map(([, value]) => csvCell(value(lead))).join(","),
    ),
  ].join("\r\n");
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  let where: Prisma.LeadWhereInput;
  let page: number;
  let pageSize: number;
  let sort: SortOption;

  try {
    where = buildWhere(params);
    page = parseInteger(params.get("page"), 1, "page");
    pageSize = parseInteger(params.get("pageSize"), DEFAULT_PAGE_SIZE, "pageSize");
    if (page < 1) throw new Error("page must be at least 1.");
    if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw new Error(`pageSize must be between 1 and ${MAX_PAGE_SIZE}.`);
    }

    const requestedSort = params.get("sort") ?? "score";
    if (!Object.hasOwn(orderByOptions, requestedSort)) {
      throw new Error("sort must be score, company, revenue, or employees.");
    }
    sort = requestedSort as SortOption;
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Invalid lead query parameters.",
      400,
    );
  }

  try {
    const exportCsv = params.get("format") === "csv";
    const [
      total,
      rows,
      scoreStats,
      industryRows,
      locationRows,
      highPriority,
      mediumPriority,
      lowPriority,
      totalLeads,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: orderByOptions[sort],
        select: leadRecordSelect,
        skip: exportCsv ? undefined : (page - 1) * pageSize,
        take: exportCsv ? MAX_EXPORT_ROWS : pageSize,
      }),
      prisma.lead.aggregate({
        _avg: { opportunityScore: true },
        _count: { _all: true },
        where: { opportunityScore: { not: null } },
      }),
      prisma.lead.groupBy({
        by: ["industry"],
        where: { industry: { not: null } },
        orderBy: { industry: "asc" },
      }),
      prisma.lead.groupBy({
        by: ["location"],
        where: { location: { not: null } },
        orderBy: { location: "asc" },
      }),
      prisma.lead.count({ where: { scoreTier: ScoreTier.HIGH } }),
      prisma.lead.count({ where: { scoreTier: ScoreTier.MEDIUM } }),
      prisma.lead.count({ where: { scoreTier: ScoreTier.LOW } }),
      prisma.lead.count(),
    ]);

    if (exportCsv) {
      const headers = new Headers({
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="lead-intelligence.csv"',
        "Cache-Control": "no-store",
        "X-Exported-Rows": String(rows.length),
        "X-Total-Matching-Rows": String(total),
      });
      if (total > MAX_EXPORT_ROWS) {
        headers.set("X-Export-Truncated", "true");
      }
      return new Response(toCsv(rows.map(toLeadRecord)), { headers });
    }

    const body: LeadListResponse = {
      data: rows.map(toLeadRecord),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      summary: {
        total: totalLeads,
        highPriority,
        mediumPriority,
        lowPriority,
        averageScore: Math.round(scoreStats._avg.opportunityScore ?? 0),
      },
      filters: {
        industries: industryRows.flatMap(({ industry }) =>
          industry ? [industry] : [],
        ),
        locations: locationRows.flatMap(({ location }) =>
          location ? [location] : [],
        ),
      },
    };

    return Response.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Failed to query lead dashboard:", error);
    return jsonError("Unable to load leads. Check the database connection and try again.", 503);
  }
}

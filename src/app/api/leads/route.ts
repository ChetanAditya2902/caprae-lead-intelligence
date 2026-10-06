import { Prisma, ScoreTier } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { leadRecordSelect, toLeadRecord } from "@/lib/leads/serialize";
import { toCsv } from "@/lib/leads/csv";
import {
  buildLeadWhere,
  orderByOptions,
  type SortOption,
} from "@/lib/leads/lead-query";
import { buildScoringAnalytics } from "@/lib/leads/scoring-analytics";
import type { LeadListResponse } from "@/types/lead-record";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;
const MAX_EXPORT_ROWS = 10_000;

function parseInteger(value: string | null, fallback: number, name: string): number {
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
    where = buildLeadWhere(params);
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
      factorAggregates,
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
      exportCsv
        ? Promise.resolve([])
        : prisma.leadScoreFactor.groupBy({
            by: ["factor"],
            _avg: { points: true, maxPoints: true },
            _count: { _all: true },
          }),
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

    const scoringAnalytics = buildScoringAnalytics(factorAggregates);
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
        ...scoringAnalytics,
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

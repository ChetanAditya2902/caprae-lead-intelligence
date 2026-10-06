import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Prisma } from "@/generated/prisma/client";
import { buildLeadWhere, orderByOptions } from "./lead-query";

describe("buildLeadWhere", () => {
  it("combines search, qualification, range, and data-quality filters", () => {
    const where = buildLeadWhere(new URLSearchParams(
      "q=Northstar&priority=MEDIUM&industry=Robotics&location=Toronto" +
      "&minEmployees=50&maxEmployees=200&minRevenue=1000000&maxRevenue=5000000" +
      "&minScore=60&maxScore=79&dataQuality=NEEDS_REVIEW",
    ));

    assert.equal(where.scoreTier, "MEDIUM");
    assert.equal(where.industry, "Robotics");
    assert.equal(where.location, "Toronto");
    assert.deepEqual(where.employeeCount, { gte: 50, lte: 200 });
    assert.deepEqual(where.opportunityScore, { gte: 60, lte: 79 });
    assert.equal(where.OR?.length, 4);
    assert.ok(Array.isArray(where.AND));
    assert.equal(where.AND.length, 3);
  });

  it("limits revenue comparisons to USD", () => {
    const where = buildLeadWhere(
      new URLSearchParams("minRevenue=1000000&maxRevenue=5000000"),
    );

    assert.deepEqual(where.AND, [
      { revenueCurrency: "USD" },
      {
        revenue: {
          gte: new Prisma.Decimal("1000000"),
          lte: new Prisma.Decimal("5000000"),
        },
      },
    ]);
  });

  it("rejects inverted, out-of-range, and unsupported filters", () => {
    assert.throws(
      () => buildLeadWhere(new URLSearchParams("minScore=80&maxScore=60")),
      /minScore cannot be greater than maxScore/,
    );
    assert.throws(
      () => buildLeadWhere(new URLSearchParams("minEmployees=200&maxEmployees=100")),
      /minEmployees cannot be greater than maxEmployees/,
    );
    assert.throws(
      () => buildLeadWhere(new URLSearchParams("minRevenue=5&maxRevenue=1")),
      /minRevenue cannot be greater than maxRevenue/,
    );
    assert.throws(
      () => buildLeadWhere(new URLSearchParams("dataQuality=UNKNOWN")),
      /dataQuality must be COMPLETE or NEEDS_REVIEW/,
    );
    assert.throws(
      () => buildLeadWhere(new URLSearchParams("priority=URGENT")),
      /priority must be HIGH, MEDIUM, or LOW/,
    );
  });

  it("keeps all supported sort keys deterministic", () => {
    assert.deepEqual(Object.keys(orderByOptions), [
      "score",
      "company",
      "revenue",
      "employees",
    ]);
    assert.deepEqual(orderByOptions.score[0], {
      opportunityScore: { sort: "desc", nulls: "last" },
    });
  });
});

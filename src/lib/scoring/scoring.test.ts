import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_OPPORTUNITY_SCORE, scoringConfig } from "./config";
import { getScoreTier, scoreLead } from "./index";
import type { LeadScoringInput } from "./types";

const completeHighFitLead: LeadScoringInput = {
  industry: "Industrial automation",
  subIndustry: "Robotics",
  employeeCount: 850,
  revenue: "125000000",
  revenueCurrency: "USD",
  technologies: ["AWS", "Snowflake", "Salesforce"],
  hiringSignal: "18 open roles across engineering and sales",
  growthSignal: "Expanding into a new market with increasing adoption",
  fundingSignal: "Series B growth round",
  country: "US",
  contactName: "Synthetic Contact 001",
  contactTitle: "VP of Operations",
  contactEmail: "contact001@northstar-robotics.example",
  contactPhone: "+1-202-555-0101",
  linkedinUrl: "https://www.linkedin.example/company/northstar-robotics",
  emailVerified: true,
  phoneVerified: true,
  dataSource: "synthetic-test",
  lastUpdated: new Date("2026-01-15T00:00:00.000Z"),
  website: "https://northstar-robotics.example",
  domain: "northstar-robotics.example",
};

function findFactor(
  lead: LeadScoringInput,
  name: string,
) {
  return scoreLead(lead).factors.find((factor) => factor.factor === name);
}

describe("scoreLead", () => {
  it("scores a complete, strong-fit lead as high priority", () => {
    const result = scoreLead(completeHighFitLead);

    assert.equal(result.totalScore, 100);
    assert.equal(result.tier, "HIGH");
    assert.equal(result.tierLabel, "High Priority");
    assert.equal(result.factors.length, Object.keys(scoringConfig.weights).length);
    assert.equal(result.factors.reduce((sum, item) => sum + item.maxPoints, 0), 100);
    assert.ok(result.factors.every((item) => item.points <= item.maxPoints));
  });

  it("scores a plausible but incomplete lead as medium priority", () => {
    const result = scoreLead({
      industry: "Healthcare technology",
      employeeCount: 180,
      revenue: 25_000_000,
      revenueCurrency: "USD",
      technologies: ["Legacy desktop system"],
      hiringSignal: "4 open roles",
      contactName: "Synthetic Contact 002",
      contactTitle: "Director of Partnerships",
      contactEmail: "contact002@brightpath.example",
      emailVerified: false,
      dataSource: "synthetic-test",
      lastUpdated: "2026-01-15T00:00:00.000Z",
      country: "AU",
    });

    assert.ok(result.totalScore >= 60 && result.totalScore <= 79);
    assert.equal(result.tier, "MEDIUM");
  });

  it("scores explicit poor-fit signals as low priority", () => {
    const result = scoreLead({
      industry: "Tobacco retail",
      employeeCount: 12,
      revenue: 25_000,
      revenueCurrency: "USD",
      hiringSignal: "Hiring freeze after layoffs",
      growthSignal: "Revenue declining and business contraction",
      fundingSignal: "No funding reported",
      technologies: ["Legacy desktop system"],
      country: "AQ",
      contactName: "Synthetic Contact 003",
      contactTitle: "Owner",
      contactEmail: "contact003@low-fit.example",
      emailVerified: false,
      dataSource: "synthetic-test",
      lastUpdated: new Date("2026-01-15T00:00:00.000Z"),
      website: "https://low-fit.example",
      domain: "low-fit.example",
    });

    assert.ok(result.totalScore < 60);
    assert.equal(result.tier, "LOW");
    assert.equal(findFactor(
      {
        industry: "Tobacco retail",
        hiringSignal: "Hiring freeze after layoffs",
      },
      "Growth signals",
    )?.signal, "negative");
  });

  it("uses neutral partial credit for missing data rather than treating it as negative", () => {
    const result = scoreLead({});

    const neutralBaseline =
      Object.entries(scoringConfig.weights)
        .filter(([name]) =>
          name !== "growthSignals" &&
          name !== "contactCompleteness" &&
          name !== "dataQuality",
        )
        .reduce(
          (sum, [, maximum]) =>
            sum + Math.round(maximum * scoringConfig.neutralPointsFraction),
          0,
        ) +
      Object.values(scoringConfig.growth.weights).reduce(
        (sum, maximum) =>
          sum + Math.round(maximum * scoringConfig.neutralPointsFraction),
        0,
      ) +
      Math.round(
        scoringConfig.weights.contactCompleteness *
          scoringConfig.contact.missingFieldPointsFraction,
      ) +
      Math.round(
        Object.values(scoringConfig.dataQuality.signals).reduce(
          (sum, maximum) =>
            sum +
            maximum * scoringConfig.dataQuality.missingEvidencePointsFraction,
          0,
        ),
      );
    assert.equal(result.totalScore, neutralBaseline);
    assert.ok(result.factors.every((item) => item.signal === "neutral"));
    assert.ok(result.factors.every((item) => item.signal === "neutral"));
    assert.ok(result.reasons.some((reason) => reason.includes("Industry information is unavailable")));
  });

  it("classifies tier boundary scores exactly", () => {
    assert.equal(getScoreTier(100), "HIGH");
    assert.equal(getScoreTier(80), "HIGH");
    assert.equal(getScoreTier(79), "MEDIUM");
    assert.equal(getScoreTier(60), "MEDIUM");
    assert.equal(getScoreTier(59), "LOW");
    assert.equal(getScoreTier(0), "LOW");
  });

  it("rejects scores outside the supported range", () => {
    assert.throws(() => getScoreTier(-1), RangeError);
    assert.throws(() => getScoreTier(MAX_OPPORTUNITY_SCORE + 1), RangeError);
    assert.throws(() => getScoreTier(Number.NaN), RangeError);
  });

  it("returns a reason for every weighted factor and an explanation list", () => {
    const result = scoreLead(completeHighFitLead);

    assert.equal(result.reasons.length, result.factors.length);
    for (const item of result.factors) {
      assert.ok(item.factor.length > 0);
      assert.ok(item.reason.length > 0);
      assert.ok(Number.isInteger(item.points));
      assert.ok(Number.isInteger(item.maxPoints));
      assert.ok(result.reasons.some((reason) => reason.startsWith(`${item.factor} (`)));
    }
  });

  it("returns the same score for identical lead data", () => {
    const first = scoreLead(completeHighFitLead);
    const second = scoreLead(completeHighFitLead);

    assert.deepEqual(second, first);
  });

  it("treats non-target currency as neutral instead of comparing unlike amounts", () => {
    const factor = findFactor(
      { revenue: 100_000_000, revenueCurrency: "EUR" },
      "Revenue fit",
    );

    assert.equal(factor?.signal, "neutral");
    assert.equal(factor?.points, Math.round(scoringConfig.weights.revenueFit * 0.4));
  });

  it("does not interpret explicitly absent funding or zero open roles as positive signals", () => {
    const result = scoreLead({
      hiringSignal: "0 open roles reported",
      fundingSignal: "No funding reported",
    });
    const growth = result.factors.find((item) => item.factor === "Growth signals");

    assert.equal(growth?.signal, "neutral");
    assert.ok(growth?.reason.includes("No open roles are currently reported."));
    assert.ok(growth?.reason.includes("explicitly unavailable or unreported."));
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scoreLead } from "./index";
import { scoreFromStoredLead } from "./stored";
import type { LeadScoringInput } from "./types";

const input: LeadScoringInput = {
  industry: "Manufacturing",
  employeeCount: 400,
  revenue: 100_000_000,
  revenueCurrency: "USD",
  country: "US",
};

describe("scoreFromStoredLead", () => {
  it("uses one persisted score and factor breakdown as the display source", () => {
    const score = scoreFromStoredLead({
      ...input,
      opportunityScore: 83,
      scoreTier: "HIGH",
      scoreReasons: ["Stored explanation"],
      scoreFactors: [
        { factor: "Industry fit", points: 20, maxPoints: 20, reason: "Stored factor", signal: "positive" },
        { factor: "Company size fit", points: 15, maxPoints: 15, reason: "Stored factor", signal: "positive" },
        { factor: "Revenue fit", points: 15, maxPoints: 15, reason: "Stored factor", signal: "positive" },
        { factor: "Growth signals", points: 6, maxPoints: 15, reason: "Stored factor", signal: "neutral" },
        { factor: "Technology fit", points: 4, maxPoints: 10, reason: "Stored factor", signal: "neutral" },
        { factor: "Location fit", points: 10, maxPoints: 10, reason: "Stored factor", signal: "positive" },
        { factor: "Contact completeness", points: 8, maxPoints: 10, reason: "Stored factor", signal: "neutral" },
        { factor: "Data quality", points: 5, maxPoints: 5, reason: "Stored factor", signal: "positive" },
      ],
    });

    assert.equal(score.totalScore, 83);
    assert.equal(score.tier, "HIGH");
    assert.equal(score.factors[0]?.reason, "Stored factor");
    assert.deepEqual(score.reasons, ["Stored explanation"]);
  });

  it("recomputes a score if the persisted breakdown is incomplete or inconsistent", () => {
    const score = scoreFromStoredLead({
      ...input,
      opportunityScore: 5,
      scoreTier: "LOW",
      scoreReasons: [],
      scoreFactors: [],
    });

    assert.deepEqual(score, scoreLead(input));
  });
});

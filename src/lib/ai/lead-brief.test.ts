import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cachedLeadBrief, isLeadBrief, type LeadBrief } from "./lead-brief";

const validBrief: LeadBrief = {
  summary: "An established mid-market company with several relevant expansion signals.",
  whyThisLead: "Its recorded company profile aligns with the configured target market.",
  strongestSignals: ["Relevant industry", "Active hiring signal"],
  potentialRisks: ["Revenue is unavailable."],
  recommendedOutreachAngle: "Validate current expansion priorities before proposing a solution.",
  recommendedNextAction: "Confirm the hiring and growth signals with the contact.",
};

describe("lead brief validation", () => {
  it("accepts a complete structured lead brief", () => {
    assert.equal(isLeadBrief(validBrief), true);
  });

  it("rejects missing fields and empty analysis text", () => {
    const incomplete = Object.fromEntries(
      Object.entries(validBrief).filter(([key]) => key !== "recommendedNextAction"),
    );
    assert.equal(isLeadBrief(incomplete), false);
    assert.equal(
      isLeadBrief({ ...validBrief, whyThisLead: " " }),
      false,
    );
  });

  it("rejects lists containing non-text items or too many entries", () => {
    assert.equal(
      isLeadBrief({ ...validBrief, strongestSignals: ["Hiring", null] }),
      false,
    );
    assert.equal(
      isLeadBrief({
        ...validBrief,
        potentialRisks: ["1", "2", "3", "4", "5", "6"],
      }),
      false,
    );
  });

  it("returns complete cached brief content only when all stored fields exist", () => {
    assert.deepEqual(
      cachedLeadBrief({
        aiSummary: validBrief.summary,
        aiWhyAttractive: validBrief.whyThisLead,
        aiStrongestSignals: validBrief.strongestSignals,
        aiRisks: validBrief.potentialRisks,
        aiOutreachAngle: validBrief.recommendedOutreachAngle,
        aiNextAction: validBrief.recommendedNextAction,
      }),
      validBrief,
    );
    assert.equal(
      cachedLeadBrief({
        aiSummary: validBrief.summary,
        aiWhyAttractive: null,
        aiStrongestSignals: validBrief.strongestSignals,
        aiRisks: validBrief.potentialRisks,
        aiOutreachAngle: validBrief.recommendedOutreachAngle,
        aiNextAction: validBrief.recommendedNextAction,
      }),
      null,
    );
  });
});

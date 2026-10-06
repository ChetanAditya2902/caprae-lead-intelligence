import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildScoringAnalytics } from "./scoring-analytics";

describe("buildScoringAnalytics", () => {
  it("calculates normalized averages and ranks scoring factors", () => {
    const result = buildScoringAnalytics([
      {
        factor: "Industry fit",
        _avg: { points: 16, maxPoints: 20 },
        _count: { _all: 10 },
      },
      {
        factor: "Growth signals",
        _avg: { points: 12, maxPoints: 15 },
        _count: { _all: 10 },
      },
      {
        factor: "Data quality",
        _avg: { points: 3, maxPoints: 5 },
        _count: { _all: 10 },
      },
    ]);

    assert.equal(result.averageDataQualityScore, 60);
    assert.deepEqual(result.topScoringFactors, [
      { factor: "Growth signals", averageScore: 80, leadCount: 10 },
      { factor: "Industry fit", averageScore: 80, leadCount: 10 },
    ]);
  });

  it("ignores factors that cannot be normalized", () => {
    assert.deepEqual(buildScoringAnalytics([
      {
        factor: "Industry fit",
        _avg: { points: 5, maxPoints: 0 },
        _count: { _all: 1 },
      },
      {
        factor: "Data quality",
        _avg: { points: null, maxPoints: 5 },
        _count: { _all: 1 },
      },
    ]), {
      averageDataQualityScore: null,
      topScoringFactors: [],
    });
  });
});

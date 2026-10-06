export type ScoringFactorAggregate = {
  factor: string;
  _avg: {
    points: number | null;
    maxPoints: number | null;
  };
  _count: {
    _all: number;
  };
};

export type ScoringAnalytics = {
  averageDataQualityScore: number | null;
  topScoringFactors: Array<{
    factor: string;
    averageScore: number;
    leadCount: number;
  }>;
};

export function buildScoringAnalytics(
  aggregates: ScoringFactorAggregate[],
): ScoringAnalytics {
  const factors = aggregates.flatMap((aggregate) => {
    const { factor, _avg, _count } = aggregate;
    if (
      _avg.points == null ||
      _avg.maxPoints == null ||
      _avg.maxPoints <= 0 ||
      _count._all === 0
    ) {
      return [];
    }

    return [{
      factor,
      averageScore: Math.round((_avg.points / _avg.maxPoints) * 1000) / 10,
      leadCount: _count._all,
    }];
  });

  return {
    averageDataQualityScore:
      factors.find(({ factor }) => factor === "Data quality")?.averageScore ?? null,
    topScoringFactors: factors
      .filter(({ factor }) => factor !== "Data quality")
      .sort(
        (left, right) =>
          right.averageScore - left.averageScore ||
          left.factor.localeCompare(right.factor),
      )
      .slice(0, 4),
  };
}

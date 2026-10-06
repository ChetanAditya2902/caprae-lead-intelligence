CREATE TABLE "lead_score_factors" (
    "id" VARCHAR(30) NOT NULL,
    "lead_id" VARCHAR(30) NOT NULL,
    "factor" VARCHAR(40) NOT NULL,
    "points" SMALLINT NOT NULL,
    "max_points" SMALLINT NOT NULL,
    "reason" TEXT NOT NULL,
    "signal" VARCHAR(12) NOT NULL,

    CONSTRAINT "lead_score_factors_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "lead_score_factors_points_range" CHECK (
        "points" >= 0 AND "max_points" > 0 AND "points" <= "max_points"
    ),
    CONSTRAINT "lead_score_factors_signal_valid" CHECK (
        "signal" IN ('positive', 'neutral', 'negative')
    ),
    CONSTRAINT "lead_score_factors_lead_id_fkey" FOREIGN KEY ("lead_id")
        REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "lead_score_factors_lead_id_factor_key"
    ON "lead_score_factors"("lead_id", "factor");

CREATE INDEX "lead_score_factors_factor_points_idx"
    ON "lead_score_factors"("factor", "points");

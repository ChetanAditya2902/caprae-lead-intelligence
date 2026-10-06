-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "score_tier" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateTable
CREATE TABLE "leads" (
    "id" VARCHAR(30) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "website" VARCHAR(255),
    "domain" VARCHAR(255),
    "industry" VARCHAR(120),
    "sub_industry" VARCHAR(120),
    "employee_count" INTEGER,
    "revenue" DECIMAL(16,2),
    "revenue_currency" CHAR(3),
    "location" VARCHAR(160),
    "country" CHAR(2),
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiring_signal" TEXT,
    "growth_signal" TEXT,
    "funding_signal" TEXT,
    "contact_name" VARCHAR(160),
    "contact_title" VARCHAR(160),
    "contact_email" VARCHAR(254),
    "contact_phone" VARCHAR(40),
    "linkedin_url" VARCHAR(255),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "data_source" VARCHAR(120),
    "last_updated" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opportunity_score" SMALLINT,
    "score_tier" "score_tier",
    "score_reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_summary" TEXT,
    "ai_outreach_angle" TEXT,
    "ai_risks" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_next_action" TEXT,
    "ai_generated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leads_employee_count_nonnegative" CHECK ("employee_count" IS NULL OR "employee_count" >= 0),
    CONSTRAINT "leads_revenue_nonnegative" CHECK ("revenue" IS NULL OR "revenue" >= 0),
    CONSTRAINT "leads_opportunity_score_range" CHECK ("opportunity_score" IS NULL OR "opportunity_score" BETWEEN 0 AND 100),
    CONSTRAINT "leads_score_tier_matches_score" CHECK (
        ("opportunity_score" IS NULL AND "score_tier" IS NULL) OR
        ("opportunity_score" >= 80 AND "score_tier" = 'HIGH') OR
        ("opportunity_score" BETWEEN 60 AND 79 AND "score_tier" = 'MEDIUM') OR
        ("opportunity_score" BETWEEN 0 AND 59 AND "score_tier" = 'LOW')
    ),
    CONSTRAINT "leads_verified_contact_has_value" CHECK (
        (NOT "email_verified" OR "contact_email" IS NOT NULL) AND
        (NOT "phone_verified" OR "contact_phone" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "leads_company_name_idx" ON "leads"("company_name");

-- CreateIndex
CREATE INDEX "leads_domain_idx" ON "leads"("domain");

-- CreateIndex
CREATE INDEX "leads_industry_sub_industry_idx" ON "leads"("industry", "sub_industry");

-- CreateIndex
CREATE INDEX "leads_employee_count_idx" ON "leads"("employee_count");

-- CreateIndex
CREATE INDEX "leads_revenue_idx" ON "leads"("revenue");

-- CreateIndex
CREATE INDEX "leads_revenue_currency_idx" ON "leads"("revenue_currency");

-- CreateIndex
CREATE INDEX "leads_country_location_idx" ON "leads"("country", "location");

-- CreateIndex
CREATE INDEX "leads_technologies_idx" ON "leads" USING GIN ("technologies");

-- CreateIndex
CREATE INDEX "leads_hiring_signal_idx" ON "leads"("hiring_signal");

-- CreateIndex
CREATE INDEX "leads_growth_signal_idx" ON "leads"("growth_signal");

-- CreateIndex
CREATE INDEX "leads_funding_signal_idx" ON "leads"("funding_signal");

-- CreateIndex
CREATE INDEX "leads_contact_email_idx" ON "leads"("contact_email");

-- CreateIndex
CREATE INDEX "leads_data_source_idx" ON "leads"("data_source");

-- CreateIndex
CREATE INDEX "leads_opportunity_score_idx" ON "leads"("opportunity_score" DESC);

-- CreateIndex
CREATE INDEX "leads_score_tier_opportunity_score_idx" ON "leads"("score_tier", "opportunity_score" DESC);

-- CreateIndex
CREATE INDEX "leads_last_updated_idx" ON "leads"("last_updated" DESC);

-- CreateIndex
CREATE INDEX "leads_email_verified_phone_verified_idx" ON "leads"("email_verified", "phone_verified");

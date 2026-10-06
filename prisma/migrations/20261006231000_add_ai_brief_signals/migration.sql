ALTER TABLE "leads"
ADD COLUMN "ai_why_attractive" TEXT,
ADD COLUMN "ai_strongest_signals" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

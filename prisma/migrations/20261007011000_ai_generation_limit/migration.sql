CREATE TABLE "ai_generation_usage" (
    "day" DATE NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ai_generation_usage_pkey" PRIMARY KEY ("day"),
    CONSTRAINT "ai_generation_usage_count_nonnegative" CHECK ("request_count" >= 0)
);

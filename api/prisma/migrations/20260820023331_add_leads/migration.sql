-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "monthly_card_spend" VARCHAR(50) NOT NULL,
    "trips_per_year" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blocked_dates" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "blocked_dates_date_key" ON "blocked_dates"("date");

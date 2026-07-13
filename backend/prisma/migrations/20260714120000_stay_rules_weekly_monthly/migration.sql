-- Villa varsayılan minimum konaklama
ALTER TABLE "villa" ADD COLUMN "default_min_nights" INTEGER NOT NULL DEFAULT 2;

-- Promotion: haftalık/aylık indirim için minimum gece
ALTER TABLE "promotions" ADD COLUMN "min_nights" INTEGER;

-- Minimum konaklama kuralları
CREATE TABLE "stay_rules" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "min_nights" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stay_rules_pkey" PRIMARY KEY ("id")
);

-- Yerleşik haftalık/aylık indirimler
INSERT INTO "promotions" ("id","type","label","percentage","is_active","min_nights") VALUES
  ('00000000-0000-0000-0000-000000000004','WEEKLY','Haftalık indirim',10,true,7),
  ('00000000-0000-0000-0000-000000000005','MONTHLY','Aylık indirim',20,true,30);

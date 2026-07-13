CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_redemptions" INTEGER,
    "days_before" INTEGER,
    "start_date" DATE,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "reservations" ADD COLUMN "discount_total" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "discounts" JSONB;

-- Yerleşik indirimler
INSERT INTO "promotions" ("id","type","label","percentage","is_active","max_redemptions","days_before") VALUES
  ('00000000-0000-0000-0000-000000000001','MOBILE','Mobil indirimi',10,true,NULL,NULL),
  ('00000000-0000-0000-0000-000000000002','WELCOME','Hoşgeldin indirimi',20,true,3,NULL),
  ('00000000-0000-0000-0000-000000000003','LAST_MINUTE','Son dakika indirimi',15,true,NULL,10);

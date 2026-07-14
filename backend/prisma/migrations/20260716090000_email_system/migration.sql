ALTER TABLE "reservations" ADD COLUMN "display_currency" TEXT NOT NULL DEFAULT 'TRY';

CREATE TABLE "email_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "sender_name" TEXT NOT NULL DEFAULT 'Yalıkavak Villa',
    "from_email" TEXT NOT NULL DEFAULT 'yalikavakvillacom@gmail.com',
    "admin_emails" TEXT NOT NULL DEFAULT 'yalikavakvillacom@gmail.com',
    "notify_new_reservation" BOOLEAN NOT NULL DEFAULT true,
    "notify_approved" BOOLEAN NOT NULL DEFAULT true,
    "notify_rejected" BOOLEAN NOT NULL DEFAULT true,
    "notify_payment_success" BOOLEAN NOT NULL DEFAULT true,
    "notify_payment_failed" BOOLEAN NOT NULL DEFAULT true,
    "notify_cancelled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "email_settings" ("id","updated_at") VALUES (1, CURRENT_TIMESTAMP);

CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "email_logs_created_at_idx" ON "email_logs"("created_at");

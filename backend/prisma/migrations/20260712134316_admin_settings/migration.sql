CREATE TABLE "admin_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "password_hash" TEXT,
    "reset_code_hash" TEXT,
    "reset_code_expires_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

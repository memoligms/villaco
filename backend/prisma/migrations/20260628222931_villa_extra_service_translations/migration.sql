-- AlterTable
ALTER TABLE "extra_services" ADD COLUMN     "translations" JSONB;

-- AlterTable
ALTER TABLE "villa" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "translations" JSONB;

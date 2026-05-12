CREATE TYPE "public"."import_status" AS ENUM('preview', 'imported', 'failed');--> statement-breakpoint
CREATE TYPE "public"."template_type" AS ENUM('cohort_hourly', 'host_gmv', 'order_detail', 'master_product', 'host_okr', 'unknown');--> statement-breakpoint
ALTER TABLE "spreadsheet_imports" ALTER COLUMN "template_type" SET DATA TYPE template_type USING "template_type"::template_type;--> statement-breakpoint
ALTER TABLE "spreadsheet_imports" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "spreadsheet_imports" ALTER COLUMN "status" SET DATA TYPE import_status USING "status"::import_status;--> statement-breakpoint
ALTER TABLE "spreadsheet_imports" ALTER COLUMN "status" SET DEFAULT 'preview'::import_status;

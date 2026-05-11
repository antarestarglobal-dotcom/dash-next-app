CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "bundle_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_id" integer NOT NULL,
	"product_name" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "channels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "daily_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand_id" integer,
	"platform_id" integer,
	"channel_id" integer,
	"metric" text NOT NULL,
	"date" date NOT NULL,
	"day_name" text,
	"total" numeric(18, 2),
	"contribution_percent" numeric(8, 4),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_metrics_brand_id_platform_id_channel_id_metric_date_unique" UNIQUE("brand_id","platform_id","channel_id","metric","date")
);
--> statement-breakpoint
CREATE TABLE "host_okr" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer,
	"platform_id" integer,
	"date" date NOT NULL,
	"shift" text NOT NULL,
	"ctr" numeric(8, 4),
	"aov" numeric(18, 2),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "host_okr_host_id_platform_id_date_shift_unique" UNIQUE("host_id","platform_id","date","shift")
);
--> statement-breakpoint
CREATE TABLE "host_shift_gmv" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_id" integer,
	"platform_id" integer,
	"date" date NOT NULL,
	"shift" text NOT NULL,
	"gmv" numeric(18, 2),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "host_shift_gmv_host_id_platform_id_date_shift_unique" UNIQUE("host_id","platform_id","date","shift")
);
--> statement-breakpoint
CREATE TABLE "hosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "hosts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "hourly_metric_breakdowns" (
	"id" serial PRIMARY KEY NOT NULL,
	"daily_metric_id" integer NOT NULL,
	"hour" integer NOT NULL,
	"value_percent" numeric(8, 4),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "hourly_metric_breakdowns_daily_metric_id_hour_unique" UNIQUE("daily_metric_id","hour")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_date" date NOT NULL,
	"order_time" time,
	"brand_id" integer,
	"platform_id" integer,
	"invoice" text NOT NULL,
	"net_sales" numeric(18, 2),
	"sku" text,
	"quantity" integer,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "orders_invoice_sku_order_date_unique" UNIQUE("invoice","sku","order_date")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "platforms_name_unique" UNIQUE("name"),
	CONSTRAINT "platforms_normalized_name_unique" UNIQUE("normalized_name")
);
--> statement-breakpoint
CREATE TABLE "product_bundles" (
	"id" serial PRIMARY KEY NOT NULL,
	"bundle_name" text NOT NULL,
	"bundle_code" text NOT NULL,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_bundles_bundle_code_unique" UNIQUE("bundle_code")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text,
	"product_name" text NOT NULL,
	"parent_sku" text,
	"variant_name" text,
	"variant_sku" text NOT NULL,
	"hpp" numeric(18, 2),
	"selling_price" numeric(18, 2),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_variant_sku_unique" UNIQUE("variant_sku")
);
--> statement-breakpoint
CREATE TABLE "spreadsheet_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_name" text NOT NULL,
	"sheet_name" text,
	"template_type" text NOT NULL,
	"period" text,
	"brand" text,
	"platform" text,
	"channel" text,
	"metric" text,
	"status" text DEFAULT 'preview' NOT NULL,
	"raw_json" jsonb NOT NULL,
	"detected_json" jsonb NOT NULL,
	"warning_json" jsonb,
	"rejected_rows_json" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"imported_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundle_id_product_bundles_id_fk" FOREIGN KEY ("bundle_id") REFERENCES "public"."product_bundles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_metrics" ADD CONSTRAINT "daily_metrics_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_okr" ADD CONSTRAINT "host_okr_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_okr" ADD CONSTRAINT "host_okr_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_okr" ADD CONSTRAINT "host_okr_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_shift_gmv" ADD CONSTRAINT "host_shift_gmv_host_id_hosts_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."hosts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_shift_gmv" ADD CONSTRAINT "host_shift_gmv_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "host_shift_gmv" ADD CONSTRAINT "host_shift_gmv_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hourly_metric_breakdowns" ADD CONSTRAINT "hourly_metric_breakdowns_daily_metric_id_daily_metrics_id_fk" FOREIGN KEY ("daily_metric_id") REFERENCES "public"."daily_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;
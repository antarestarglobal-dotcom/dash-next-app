ALTER TYPE "public"."template_type" ADD VALUE 'sales_line_items' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."template_type" ADD VALUE 'marketing_costs' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."template_type" ADD VALUE 'stock_snapshot' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."template_type" ADD VALUE 'sales_targets' BEFORE 'unknown';--> statement-breakpoint
ALTER TYPE "public"."template_type" ADD VALUE 'daily_performance' BEFORE 'unknown';--> statement-breakpoint
CREATE TABLE "daily_marketing_breakdown" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"store_id" integer,
	"brand_id" integer,
	"variable" text NOT NULL,
	"contribution" numeric(8, 4),
	"hawa" numeric(18, 2),
	"total_cost" numeric(18, 2),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_marketing_breakdown_date_store_id_brand_id_variable_unique" UNIQUE("date","store_id","brand_id","variable")
);
--> statement-breakpoint
CREATE TABLE "daily_store_performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"store_id" integer,
	"brand_id" integer,
	"net_sales" numeric(18, 2),
	"margin" numeric(18, 2),
	"gpm" numeric(8, 4),
	"marketing_cost" numeric(18, 2),
	"marketing_ratio" numeric(8, 4),
	"net_profit" numeric(18, 2),
	"npm" numeric(8, 4),
	"total_iklan" numeric(18, 2),
	"iklan" numeric(18, 2),
	"gmv" numeric(18, 2),
	"live_gmv" numeric(18, 2),
	"contribution" numeric(8, 4),
	"hawa" numeric(18, 2),
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "daily_store_performance_date_store_id_brand_id_unique" UNIQUE("date","store_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "marketing_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"variable" text NOT NULL,
	"platform" text,
	"store_id" integer,
	"brand_id" integer,
	"category" text,
	"product_name" text,
	"sku" text,
	"qty" integer,
	"total_cost" numeric(18, 2),
	"nilai_produk" numeric(18, 2),
	"ongkos_kirim" numeric(18, 2),
	"rate_card" numeric(18, 2),
	"slot" text,
	"keterangan" text,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marketing_costs_date_variable_store_id_brand_id_product_name_sku_unique" UNIQUE("date","variable","store_id","brand_id","product_name","sku")
);
--> statement-breakpoint
CREATE TABLE "sales_line_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"store_id" integer,
	"brand_id" integer,
	"product_id" integer,
	"category" text,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"qty" integer NOT NULL,
	"harga_jual" numeric(18, 2),
	"hpp" numeric(18, 2),
	"margin_rp" numeric(18, 2),
	"margin_pct" numeric(8, 4),
	"net_sales" numeric(18, 2),
	"net_profit" numeric(18, 2),
	"klasifikasi" text,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sales_line_items_date_store_id_sku_product_name_unique" UNIQUE("date","store_id","sku","product_name")
);
--> statement-breakpoint
CREATE TABLE "sales_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"brand_id" integer,
	"product_id" integer,
	"store_id" integer,
	"platform" text,
	"type" text NOT NULL,
	"nominal" numeric(18, 2) NOT NULL,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sales_targets_period_brand_id_product_id_store_id_type_unique" UNIQUE("period","brand_id","product_id","store_id","type")
);
--> statement-breakpoint
CREATE TABLE "stock_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date NOT NULL,
	"product_id" integer,
	"product_name" text NOT NULL,
	"sku" text NOT NULL,
	"category" text,
	"hpp" numeric(18, 2),
	"total_qty" integer NOT NULL,
	"average_out" numeric(18, 4),
	"average_round" numeric(18, 4),
	"limit_0_days" numeric(18, 4),
	"date_limit" date,
	"qty_open_po" integer,
	"source_import_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stock_snapshots_snapshot_date_sku_unique" UNIQUE("snapshot_date","sku")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"platform" text NOT NULL,
	"store_type" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "stores_platform_store_type_name_unique" UNIQUE("platform","store_type","name")
);
--> statement-breakpoint
INSERT INTO "stores" ("name", "platform", "store_type") VALUES
  ('Tiktok Antarestar Official', 'tiktok', 'official'),
  ('Shopee Antarestar Official', 'shopee', 'official'),
  ('Shopee Antarestar MP', 'shopee', 'mp'),
  ('Shopee Antarestar Sport', 'shopee', 'sport'),
  ('Lazada Antarestar', 'lazada', 'official'),
  ('Tokopedia Antarestar', 'tokopedia', 'official')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
ALTER TABLE "daily_marketing_breakdown" ADD CONSTRAINT "daily_marketing_breakdown_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_marketing_breakdown" ADD CONSTRAINT "daily_marketing_breakdown_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_marketing_breakdown" ADD CONSTRAINT "daily_marketing_breakdown_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_store_performance" ADD CONSTRAINT "daily_store_performance_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_store_performance" ADD CONSTRAINT "daily_store_performance_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_store_performance" ADD CONSTRAINT "daily_store_performance_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_costs" ADD CONSTRAINT "marketing_costs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_costs" ADD CONSTRAINT "marketing_costs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_costs" ADD CONSTRAINT "marketing_costs_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_line_items" ADD CONSTRAINT "sales_line_items_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_line_items" ADD CONSTRAINT "sales_line_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_line_items" ADD CONSTRAINT "sales_line_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_line_items" ADD CONSTRAINT "sales_line_items_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_targets" ADD CONSTRAINT "sales_targets_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_source_import_id_spreadsheet_imports_id_fk" FOREIGN KEY ("source_import_id") REFERENCES "public"."spreadsheet_imports"("id") ON DELETE no action ON UPDATE no action;

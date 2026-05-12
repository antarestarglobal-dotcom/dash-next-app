import {
  pgTable,
  pgEnum,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  date,
  time,
  uuid,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { IMPORT_STATUS_VALUES, TEMPLATE_TYPE_VALUES } from "@/lib/domain/import-domain";

export const templateTypeEnum = pgEnum("template_type", TEMPLATE_TYPE_VALUES);
export const importStatusEnum = pgEnum("import_status", IMPORT_STATUS_VALUES);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  normalizedName: text("normalized_name").unique().notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const channels = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const hosts = pgTable("hosts", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const spreadsheetImports = pgTable("spreadsheet_imports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceName: text("source_name").notNull(),
  sheetName: text("sheet_name"),
  templateType: templateTypeEnum("template_type").notNull(),
  period: text("period"),
  brand: text("brand"),
  platform: text("platform"),
  channel: text("channel"),
  metric: text("metric"),
  status: importStatusEnum("status").notNull().default("preview"),
  rawJson: jsonb("raw_json").notNull(),
  detectedJson: jsonb("detected_json").notNull(),
  warningJson: jsonb("warning_json"),
  rejectedRowsJson: jsonb("rejected_rows_json"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").default(sql`now()`),
  importedAt: timestamp("imported_at"),
});

export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id").references(() => brands.id),
    platformId: integer("platform_id").references(() => platforms.id),
    channelId: integer("channel_id").references(() => channels.id),
    metric: text("metric").notNull(),
    date: date("date").notNull(),
    dayName: text("day_name"),
    total: numeric("total", { precision: 18, scale: 2 }),
    contributionPercent: numeric("contribution_percent", { precision: 8, scale: 4 }),
    sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
    createdAt: timestamp("created_at").default(sql`now()`),
    updatedAt: timestamp("updated_at").default(sql`now()`),
  },
  (t) => [unique().on(t.brandId, t.platformId, t.channelId, t.metric, t.date)],
);

export const hourlyMetricBreakdowns = pgTable(
  "hourly_metric_breakdowns",
  {
    id: serial("id").primaryKey(),
    dailyMetricId: integer("daily_metric_id")
      .references(() => dailyMetrics.id, { onDelete: "cascade" })
      .notNull(),
    hour: integer("hour").notNull(),
    valuePercent: numeric("value_percent", { precision: 8, scale: 4 }),
    createdAt: timestamp("created_at").default(sql`now()`),
  },
  (t) => [unique().on(t.dailyMetricId, t.hour)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    orderDate: date("order_date").notNull(),
    orderTime: time("order_time"),
    brandId: integer("brand_id").references(() => brands.id),
    platformId: integer("platform_id").references(() => platforms.id),
    invoice: text("invoice").notNull(),
    netSales: numeric("net_sales", { precision: 18, scale: 2 }),
    sku: text("sku"),
    quantity: integer("quantity"),
    sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
    createdAt: timestamp("created_at").default(sql`now()`),
  },
  (t) => [unique().on(t.invoice, t.sku, t.orderDate)],
);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  category: text("category"),
  productName: text("product_name").notNull(),
  parentSku: text("parent_sku"),
  variantName: text("variant_name"),
  variantSku: text("variant_sku").unique().notNull(),
  hpp: numeric("hpp", { precision: 18, scale: 2 }),
  sellingPrice: numeric("selling_price", { precision: 18, scale: 2 }),
  sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const productBundles = pgTable("product_bundles", {
  id: serial("id").primaryKey(),
  bundleName: text("bundle_name").notNull(),
  bundleCode: text("bundle_code").unique().notNull(),
  sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const bundleItems = pgTable("bundle_items", {
  id: serial("id").primaryKey(),
  bundleId: integer("bundle_id")
    .references(() => productBundles.id, { onDelete: "cascade" })
    .notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
});

export const hostShiftGmv = pgTable(
  "host_shift_gmv",
  {
    id: serial("id").primaryKey(),
    hostId: integer("host_id").references(() => hosts.id),
    platformId: integer("platform_id").references(() => platforms.id),
    date: date("date").notNull(),
    shift: text("shift").notNull(),
    gmv: numeric("gmv", { precision: 18, scale: 2 }),
    sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
    createdAt: timestamp("created_at").default(sql`now()`),
    updatedAt: timestamp("updated_at").default(sql`now()`),
  },
  (t) => [unique().on(t.hostId, t.platformId, t.date, t.shift)],
);

export const hostOkr = pgTable(
  "host_okr",
  {
    id: serial("id").primaryKey(),
    hostId: integer("host_id").references(() => hosts.id),
    platformId: integer("platform_id").references(() => platforms.id),
    date: date("date").notNull(),
    shift: text("shift").notNull(),
    ctr: numeric("ctr", { precision: 8, scale: 4 }),
    aov: numeric("aov", { precision: 18, scale: 2 }),
    sourceImportId: uuid("source_import_id").references(() => spreadsheetImports.id),
    createdAt: timestamp("created_at").default(sql`now()`),
    updatedAt: timestamp("updated_at").default(sql`now()`),
  },
  (t) => [unique().on(t.hostId, t.platformId, t.date, t.shift)],
);

export type Brand = typeof brands.$inferSelect;
export type Platform = typeof platforms.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Host = typeof hosts.$inferSelect;
export type SpreadsheetImport = typeof spreadsheetImports.$inferSelect;
export type DailyMetric = typeof dailyMetrics.$inferSelect;
export type HourlyMetricBreakdown = typeof hourlyMetricBreakdowns.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductBundle = typeof productBundles.$inferSelect;
export type BundleItem = typeof bundleItems.$inferSelect;
export type HostShiftGmv = typeof hostShiftGmv.$inferSelect;
export type HostOkr = typeof hostOkr.$inferSelect;

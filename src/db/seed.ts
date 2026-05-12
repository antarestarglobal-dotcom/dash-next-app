/**
 * DB Seed — Antarestar Run Rate Dashboard
 * Run: npx tsx src/db/seed.ts
 */
import { db } from ".";
import {
  brands,
  stores,
  products,
  salesLineItems,
  marketingCosts,
  stockSnapshots,
  salesTargets,
  dailyStorePerformance,
  dailyMarketingBreakdown,
} from "./schema";
import { sql } from "drizzle-orm";

// ─── Deterministic pseudo-random ──────────────────────────────────────────────

let _seed = 42;
const rand = (): number => {
  _seed = (_seed * 1664525 + 1013904223) & 0xffffffff;
  return ((_seed >>> 0) / 0xffffffff);
};
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => min + rand() * (max - min);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

// ─── Date helpers ─────────────────────────────────────────────────────────────

const dateRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
};

const toPeriod = (date: string) => date.slice(0, 7);
const addDays = (date: string, n: number): string => {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dayOfWeek = (date: string): number => new Date(date + "T00:00:00Z").getUTCDay(); // 0=Sun

// ─── Static master data ───────────────────────────────────────────────────────

const BRAND_NAME = "Antarestar";

const STORES = [
  { name: "Antarestar Official Tokopedia", platform: "Tokopedia", storeType: "official" },
  { name: "Antarestar Official Shopee",    platform: "Shopee",    storeType: "official" },
  { name: "Antarestar TikTok Shop",        platform: "TikTok",    storeType: "official" },
  { name: "Antarestar Lazada",             platform: "Lazada",    storeType: "official" },
  { name: "Antarestar Tokopedia Regular",  platform: "Tokopedia", storeType: "reseller" },
  { name: "Antarestar Shopee Regular",     platform: "Shopee",    storeType: "reseller" },
] as const;

const PRODUCTS: { category: string; productName: string; sku: string; hpp: number; hargaJual: number }[] = [
  // Skincare
  { category: "Skincare", productName: "Antarestar Brightening Serum 30ml",    sku: "ANT-SER-001", hpp: 45000,  hargaJual: 129000 },
  { category: "Skincare", productName: "Antarestar Brightening Serum 50ml",    sku: "ANT-SER-002", hpp: 65000,  hargaJual: 179000 },
  { category: "Skincare", productName: "Antarestar Moisturizer Gel 50g",       sku: "ANT-MOI-001", hpp: 38000,  hargaJual: 99000  },
  { category: "Skincare", productName: "Antarestar Moisturizer Cream 50g",     sku: "ANT-MOI-002", hpp: 42000,  hargaJual: 115000 },
  { category: "Skincare", productName: "Antarestar Sunscreen SPF50 30ml",      sku: "ANT-SUN-001", hpp: 35000,  hargaJual: 89000  },
  { category: "Skincare", productName: "Antarestar Sunscreen SPF50 60ml",      sku: "ANT-SUN-002", hpp: 55000,  hargaJual: 145000 },
  { category: "Skincare", productName: "Antarestar Toner Essence 150ml",       sku: "ANT-TON-001", hpp: 40000,  hargaJual: 109000 },
  { category: "Skincare", productName: "Antarestar Face Wash Foam 100ml",      sku: "ANT-FW-001",  hpp: 25000,  hargaJual: 65000  },
  { category: "Skincare", productName: "Antarestar Eye Cream 15ml",            sku: "ANT-EYE-001", hpp: 60000,  hargaJual: 165000 },
  { category: "Skincare", productName: "Antarestar AHA BHA Exfoliant 100ml",   sku: "ANT-EXF-001", hpp: 55000,  hargaJual: 149000 },
  // Haircare
  { category: "Haircare", productName: "Antarestar Hair Serum 50ml",           sku: "ANT-HS-001",  hpp: 30000,  hargaJual: 79000  },
  { category: "Haircare", productName: "Antarestar Hair Mask 200ml",           sku: "ANT-HM-001",  hpp: 35000,  hargaJual: 89000  },
  { category: "Haircare", productName: "Antarestar Shampoo Anti Rontok 200ml", sku: "ANT-SHP-001", hpp: 28000,  hargaJual: 75000  },
  { category: "Haircare", productName: "Antarestar Conditioner 200ml",         sku: "ANT-CON-001", hpp: 26000,  hargaJual: 69000  },
  // Bodycare
  { category: "Bodycare", productName: "Antarestar Body Lotion 250ml",         sku: "ANT-BL-001",  hpp: 30000,  hargaJual: 79000  },
  { category: "Bodycare", productName: "Antarestar Body Scrub 200g",           sku: "ANT-BS-001",  hpp: 32000,  hargaJual: 85000  },
  { category: "Bodycare", productName: "Antarestar Body Wash 250ml",           sku: "ANT-BW-001",  hpp: 22000,  hargaJual: 59000  },
  // Bundle
  { category: "Bundle",   productName: "Antarestar Starter Kit Skincare",      sku: "ANT-BDL-001", hpp: 120000, hargaJual: 299000 },
  { category: "Bundle",   productName: "Antarestar Haircare Complete Set",     sku: "ANT-BDL-002", hpp: 95000,  hargaJual: 249000 },
  { category: "Bundle",   productName: "Antarestar Brightening Paket Hemat",   sku: "ANT-BDL-003", hpp: 140000, hargaJual: 349000 },
];

const MARKETING_CHANNELS = ["voucher", "affiliate", "sample", "endorse", "iklan", "other"] as const;

// ─── Seasonal multiplier ──────────────────────────────────────────────────────

const salesMultiplier = (date: string): number => {
  const dow = dayOfWeek(date);
  const dom = parseInt(date.slice(8, 10));
  let m = 1.0;
  if (dow === 0 || dow === 6) m *= 1.3; // weekend boost
  if (dom >= 10 && dom <= 12) m *= 1.5; // 10.10-12.12 campaigns
  if (dom === 1) m *= 1.2; // harbolnas / month start promo
  return m;
};

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding database…");

  // ── Clear run-rate tables (order matters for FK) ───────────────────────────
  await db.execute(sql`TRUNCATE daily_marketing_breakdown, daily_store_performance, marketing_costs, sales_line_items, stock_snapshots, sales_targets RESTART IDENTITY CASCADE`);
  await db.execute(sql`DELETE FROM brands WHERE name = ${BRAND_NAME}`);
  await db.execute(sql`DELETE FROM stores WHERE name = ANY(ARRAY[${sql.raw(STORES.map(s => `'${s.name}'`).join(","))}])`);
  await db.execute(sql`DELETE FROM products WHERE variant_sku = ANY(ARRAY[${sql.raw(PRODUCTS.map(p => `'${p.sku}'`).join(","))}])`);

  // ── Brands ────────────────────────────────────────────────────────────────
  const [brand] = await db.insert(brands).values({ name: BRAND_NAME }).returning();
  console.log(`  ✓ Brand: ${brand.name} (id=${brand.id})`);

  // ── Stores ────────────────────────────────────────────────────────────────
  const insertedStores = await db.insert(stores).values(STORES.map(s => ({
    name: s.name, platform: s.platform, storeType: s.storeType,
  }))).returning();
  console.log(`  ✓ Stores: ${insertedStores.length}`);

  // ── Products ──────────────────────────────────────────────────────────────
  const insertedProducts = await db.insert(products).values(PRODUCTS.map(p => ({
    category: p.category,
    productName: p.productName,
    variantSku: p.sku,
    variantName: "Default",
    parentSku: p.sku.replace(/-\d+$/, ""),
    hpp: String(p.hpp),
    sellingPrice: String(p.hargaJual),
  }))).returning();
  console.log(`  ✓ Products: ${insertedProducts.length}`);

  const productMap = new Map(insertedProducts.map(p => [p.variantSku, p]));

  // ── Date range: 3 months ──────────────────────────────────────────────────
  const ALL_DATES = dateRange("2026-03-01", "2026-05-12");
  const MONTHS = ["2026-03", "2026-04", "2026-05"];

  // ── Sales Targets ─────────────────────────────────────────────────────────
  const targetRows = MONTHS.flatMap(period => [
    { period, brandId: brand.id, type: "net_sales",       nominal: String(period === "2026-05" ? 450_000_000 : period === "2026-04" ? 420_000_000 : 380_000_000) },
    { period, brandId: brand.id, type: "marketing_cost",  nominal: String(period === "2026-05" ? 85_000_000  : period === "2026-04" ? 80_000_000  : 72_000_000)  },
    { period, brandId: brand.id, type: "net_profit",      nominal: String(period === "2026-05" ? 55_000_000  : period === "2026-04" ? 50_000_000  : 45_000_000)  },
  ]);
  await db.insert(salesTargets).values(targetRows);
  console.log(`  ✓ Sales targets: ${targetRows.length}`);

  // ── Per-date, per-store data ──────────────────────────────────────────────
  const salesLineRows: typeof salesLineItems.$inferInsert[] = [];
  const marketingCostRows: typeof marketingCosts.$inferInsert[] = [];
  const dailyPerfRows: typeof dailyStorePerformance.$inferInsert[] = [];
  const dailyMktRows: typeof dailyMarketingBreakdown.$inferInsert[] = [];

  // Base daily net_sales per store (IDR)
  const storeBaseDaily: Record<string, number> = {
    "Antarestar Official Tokopedia": 9_500_000,
    "Antarestar Official Shopee":    8_200_000,
    "Antarestar TikTok Shop":        7_800_000,
    "Antarestar Lazada":             3_500_000,
    "Antarestar Tokopedia Regular":  2_200_000,
    "Antarestar Shopee Regular":     1_800_000,
  };

  for (const date of ALL_DATES) {
    const mult = salesMultiplier(date);

    for (const store of insertedStores) {
      const baseDaily = storeBaseDaily[store.name] ?? 4_000_000;
      const dailyTarget = baseDaily * mult * randFloat(0.85, 1.18);

      // ── Sales line items (distribute across ~5–8 products) ───────────────
      const numProducts = randInt(5, 10);
      const selectedProducts = [...insertedProducts].sort(() => rand() - 0.5).slice(0, numProducts);
      let totalNetSales = 0;
      let totalMargin = 0;
      let totalNetProfit = 0;
      let totalGmv = 0;

      for (const product of selectedProducts) {
        const srcProduct = PRODUCTS.find(p => p.sku === product.variantSku)!;
        const qty = randInt(1, 15);
        const hargaJual = srcProduct.hargaJual * randFloat(0.9, 1.05); // price variance
        const hpp = srcProduct.hpp;
        const netSales = qty * hargaJual;
        const marginRp = qty * (hargaJual - hpp);
        const marginPct = (hargaJual - hpp) / hargaJual;
        const marketingAlloc = netSales * randFloat(0.08, 0.22);
        const netProfit = marginRp - marketingAlloc;

        totalNetSales += netSales;
        totalMargin += marginRp;
        totalNetProfit += netProfit;
        totalGmv += netSales * randFloat(1.05, 1.25);

        salesLineRows.push({
          date,
          storeId: store.id,
          brandId: brand.id,
          productId: product.id,
          category: product.category,
          productName: product.productName,
          sku: product.variantSku,
          qty,
          hargaJual: String(hargaJual.toFixed(2)),
          hpp: String(hpp.toFixed(2)),
          marginRp: String(marginRp.toFixed(2)),
          marginPct: String(marginPct.toFixed(4)),
          netSales: String(netSales.toFixed(2)),
          netProfit: String(netProfit.toFixed(2)),
        });
      }

      // Scale to daily target
      const scale = dailyTarget / (totalNetSales || 1);
      const scaledNetSales = totalNetSales * scale;
      const scaledMargin = totalMargin * scale;
      const scaledNetProfit = totalNetProfit * scale;
      const scaledGmv = totalGmv * scale;
      const mktCostTotal = scaledNetSales * randFloat(0.10, 0.22);
      const npm = scaledNetSales > 0 ? (scaledNetProfit - mktCostTotal) / scaledNetSales : 0;

      // ── Daily store performance ───────────────────────────────────────────
      dailyPerfRows.push({
        date,
        storeId: store.id,
        brandId: brand.id,
        netSales: String(scaledNetSales.toFixed(2)),
        margin: String(scaledMargin.toFixed(2)),
        gpm: String((scaledMargin / (scaledNetSales || 1)).toFixed(4)),
        marketingCost: String(mktCostTotal.toFixed(2)),
        marketingRatio: String((mktCostTotal / (scaledNetSales || 1)).toFixed(4)),
        netProfit: String((scaledNetProfit - mktCostTotal).toFixed(2)),
        npm: String(Math.max(npm, -0.3).toFixed(4)),
        gmv: String(scaledGmv.toFixed(2)),
        liveGmv: String((scaledGmv * randFloat(0.15, 0.40)).toFixed(2)),
        iklan: String((mktCostTotal * randFloat(0.4, 0.7)).toFixed(2)),
        totalIklan: String((mktCostTotal * randFloat(0.4, 0.7)).toFixed(2)),
        contribution: String(randFloat(0.1, 0.35).toFixed(4)),
        hawa: String((scaledNetSales * randFloat(0.02, 0.06)).toFixed(2)),
      });

      // ── Marketing costs per channel ───────────────────────────────────────
      const mktChannelWeights = { voucher: 0.30, affiliate: 0.20, iklan: 0.25, sample: 0.08, endorse: 0.10, other: 0.07 };
      for (const [channel, weight] of Object.entries(mktChannelWeights)) {
        const cost = mktCostTotal * weight * randFloat(0.8, 1.2);
        if (cost < 1000) continue; // skip tiny amounts

        marketingCostRows.push({
          date,
          variable: channel,
          storeId: store.id,
          brandId: brand.id,
          totalCost: String(cost.toFixed(2)),
        });

        dailyMktRows.push({
          date,
          storeId: store.id,
          brandId: brand.id,
          variable: channel,
          totalCost: String(cost.toFixed(2)),
          contribution: String((cost / mktCostTotal).toFixed(4)),
          hawa: String((cost * randFloat(0.05, 0.15)).toFixed(2)),
        });
      }
    }
  }

  // ── Batch insert ──────────────────────────────────────────────────────────
  console.log(`  → Inserting ${salesLineRows.length} sales_line_items…`);
  for (let i = 0; i < salesLineRows.length; i += 500) {
    await db.insert(salesLineItems).values(salesLineRows.slice(i, i + 500)).onConflictDoNothing();
  }

  console.log(`  → Inserting ${dailyPerfRows.length} daily_store_performance…`);
  for (let i = 0; i < dailyPerfRows.length; i += 500) {
    await db.insert(dailyStorePerformance).values(dailyPerfRows.slice(i, i + 500)).onConflictDoNothing();
  }

  console.log(`  → Inserting ${marketingCostRows.length} marketing_costs…`);
  for (let i = 0; i < marketingCostRows.length; i += 500) {
    await db.insert(marketingCosts).values(marketingCostRows.slice(i, i + 500)).onConflictDoNothing();
  }

  console.log(`  → Inserting ${dailyMktRows.length} daily_marketing_breakdown…`);
  for (let i = 0; i < dailyMktRows.length; i += 500) {
    await db.insert(dailyMarketingBreakdown).values(dailyMktRows.slice(i, i + 500)).onConflictDoNothing();
  }

  // ── Stock snapshots ───────────────────────────────────────────────────────
  const snapshotDate = "2026-05-12";
  const stockRows: typeof stockSnapshots.$inferInsert[] = PRODUCTS.map(p => {
    const product = productMap.get(p.sku);
    const avgOut = randFloat(2, 25);
    const totalQty = randInt(5, 400);
    const daysLeft = totalQty / avgOut;
    const dateLimitDate = addDays(snapshotDate, Math.round(daysLeft));
    return {
      snapshotDate,
      productId: product?.id,
      productName: p.productName,
      sku: p.sku,
      category: p.category,
      hpp: String(p.hpp),
      totalQty,
      averageOut: String(avgOut.toFixed(4)),
      averageRound: String(Math.round(avgOut).toFixed(4)),
      limit0Days: String(daysLeft.toFixed(4)),
      dateLimit: dateLimitDate,
      qtyOpenPo: rand() > 0.6 ? randInt(50, 300) : null,
    };
  });

  // Ensure a few critical items for demo
  if (stockRows[0]) { stockRows[0].totalQty = 8;  stockRows[0].limit0Days = "2.5000"; stockRows[0].dateLimit = addDays(snapshotDate, 3); }
  if (stockRows[1]) { stockRows[1].totalQty = 12; stockRows[1].limit0Days = "4.8000"; stockRows[1].dateLimit = addDays(snapshotDate, 5); }
  if (stockRows[4]) { stockRows[4].totalQty = 15; stockRows[4].limit0Days = "5.9000"; stockRows[4].dateLimit = addDays(snapshotDate, 6); }
  if (stockRows[5]) { stockRows[5].totalQty = 25; stockRows[5].limit0Days = "12.0000"; stockRows[5].dateLimit = addDays(snapshotDate, 12); }
  if (stockRows[6]) { stockRows[6].totalQty = 30; stockRows[6].limit0Days = "18.5000"; stockRows[6].dateLimit = addDays(snapshotDate, 19); }

  await db.insert(stockSnapshots).values(stockRows).onConflictDoNothing();
  console.log(`  ✓ Stock snapshots: ${stockRows.length}`);

  console.log("\n✅ Seed complete!");
  const summary = {
    salesLineItems: salesLineRows.length,
    dailyStorePerformance: dailyPerfRows.length,
    marketingCosts: marketingCostRows.length,
    dailyMarketingBreakdown: dailyMktRows.length,
    stockSnapshots: stockRows.length,
    salesTargets: targetRows.length,
  };
  console.table(summary);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

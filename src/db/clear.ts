/**
 * Clear all run-rate data from the database.
 * Safe to run multiple times — only deletes, never drops tables or schema.
 *
 * Run: npx tsx src/db/clear.ts
 *
 * What gets cleared:
 *   - sales_line_items        (imported from Sales sheet)
 *   - marketing_costs         (imported from Voucher/Iklan/Affiliate/Sample/Endorse/Other Cost)
 *   - stock_snapshots         (imported from DATA-ACCEL)
 *   - sales_targets           (imported from Target sheet)
 *   - daily_store_performance (legacy aggregated table — from old seed)
 *   - daily_marketing_breakdown (legacy table — from old seed)
 *   - spreadsheet_imports     (import preview records)
 *   - brands, stores, products (dimension tables seeded with dummy data)
 *
 * What is NOT touched:
 *   - Schema / migrations
 *   - platforms, channels, hosts (not used by run-rate)
 *   - orders, dailyMetrics, etc (not used by run-rate)
 */

import { db } from ".";
import { sql } from "drizzle-orm";

async function clearRunRateData() {
  console.log("⚠️  Clearing all run-rate data from PostgreSQL...\n");

  await db.execute(sql`
    TRUNCATE
      daily_marketing_breakdown,
      daily_store_performance,
      marketing_costs,
      sales_line_items,
      stock_snapshots,
      sales_targets,
      spreadsheet_imports,
      products,
      stores,
      brands
    RESTART IDENTITY CASCADE
  `);

  console.log("✓ Cleared tables:");
  console.log("  - sales_line_items");
  console.log("  - marketing_costs");
  console.log("  - stock_snapshots");
  console.log("  - sales_targets");
  console.log("  - daily_store_performance");
  console.log("  - daily_marketing_breakdown");
  console.log("  - spreadsheet_imports");
  console.log("  - products");
  console.log("  - stores");
  console.log("  - brands");
  console.log("\nDatabase is clean. Ready for real data import from Google Sheets.");
  process.exit(0);
}

clearRunRateData().catch((err) => {
  console.error("Clear failed:", err);
  process.exit(1);
});

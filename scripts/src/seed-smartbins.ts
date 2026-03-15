import { db } from "@workspace/db";
import { smartBinsTable } from "@workspace/db";
import { pool } from "@workspace/db";

async function run() {
  console.log("Connected via @workspace/db.");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS smart_bins (
      id SERIAL PRIMARY KEY,
      bin_id VARCHAR(20) UNIQUE NOT NULL,
      location VARCHAR(255) NOT NULL,
      fill_level INTEGER NOT NULL DEFAULT 0,
      battery_level INTEGER NOT NULL DEFAULT 100,
      last_collected TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'ok',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  console.log("Table ensured.");

  await db
    .insert(smartBinsTable)
    .values([
      { binId: "KSB-001", location: "King Street & Orange St, Downtown",    fillLevel: 82, batteryLevel: 95, status: "ok" },
      { binId: "KSB-002", location: "Half Way Tree Plaza",                   fillLevel: 45, batteryLevel: 78, status: "ok" },
      { binId: "KSB-003", location: "Constant Spring Road & Dunrobin Ave",   fillLevel: 93, batteryLevel: 62, status: "full" },
      { binId: "KSB-004", location: "Portmore Town Center",                  fillLevel: 28, batteryLevel: 88, status: "ok" },
      { binId: "KSB-005", location: "Cross Roads Junction",                  fillLevel: 71, batteryLevel: 91, status: "ok" },
      { binId: "KSB-006", location: "New Kingston Commercial District",      fillLevel: 56, batteryLevel: 44, status: "low-battery" },
      { binId: "KSB-007", location: "Spanish Town Market",                   fillLevel: 88, batteryLevel: 73, status: "ok" },
      { binId: "KSB-008", location: "Maxfield Ave & Waltham Park Road",      fillLevel: 12, batteryLevel: 98, status: "ok" },
    ])
    .onConflictDoNothing();

  console.log("Seeded 8 bins.");

  const rows = await db.select().from(smartBinsTable).orderBy(smartBinsTable.binId);
  console.log("\nCurrent smart_bins:");
  for (const r of rows) {
    console.log(`  ${r.binId}  ${r.fillLevel}%  [${r.status}]  ${r.location}`);
  }

  await pool.end();
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

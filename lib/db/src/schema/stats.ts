import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const dailyStatsTable = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  wasteCollectedKg: integer("waste_collected_kg").notNull().default(0),
  energyGeneratedKwh: integer("energy_generated_kwh").notNull().default(0),
  homesPowered: integer("homes_powered").notNull().default(0),
  co2OffsetKg: integer("co2_offset_kg").notNull().default(0),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DailyStat = typeof dailyStatsTable.$inferSelect;

import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const smartBinsTable = pgTable("smart_bins", {
  id: serial("id").primaryKey(),
  binId: varchar("bin_id", { length: 20 }).unique().notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  fillLevel: integer("fill_level").notNull().default(0),
  batteryLevel: integer("battery_level").notNull().default(100),
  lastCollected: timestamp("last_collected", { withTimezone: true }),
  status: varchar("status", { length: 20 }).notNull().default("ok"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSmartBinSchema = createInsertSchema(smartBinsTable).omit({ id: true });
export type InsertSmartBin = z.infer<typeof insertSmartBinSchema>;
export type SmartBin = typeof smartBinsTable.$inferSelect;

import { pgTable, serial, varchar, boolean, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const trucksTable = pgTable("trucks", {
  id: serial("id").primaryKey(),
  truckId: varchar("truck_id", { length: 20 }).unique().notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("collecting"),
  loadKg: integer("load_kg").notNull().default(0),
  capacityKg: integer("capacity_kg").notNull().default(12000),
  zoneId: integer("zone_id").references(() => zonesTable.id),
  collectionZone: varchar("collection_zone", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTruckSchema = createInsertSchema(trucksTable).omit({ id: true });
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucksTable.$inferSelect;

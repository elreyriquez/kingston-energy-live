import { pgTable, serial, integer, smallint, time, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { zonesTable } from "./zones";

export const scheduleTable = pgTable("schedule", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull().references(() => zonesTable.id, { onDelete: "cascade" }),
  dayOfWeek: smallint("day_of_week").notNull(),
  startTime: time("start_time").notNull().default("07:00:00"),
  endTime: time("end_time").notNull().default("13:00:00"),
  isActive: boolean("is_active").notNull().default(true),
}, (t) => [unique().on(t.zoneId, t.dayOfWeek)]);

export const insertScheduleSchema = createInsertSchema(scheduleTable).omit({ id: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof scheduleTable.$inferSelect;

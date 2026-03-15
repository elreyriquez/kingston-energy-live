import { pgTable, serial, varchar, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { zonesTable } from "./zones";

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportRef: varchar("report_ref", { length: 30 }).unique().notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  zoneId: integer("zone_id").references(() => zonesTable.id, { onDelete: "set null" }),
  zoneName: varchar("zone_name", { length: 100 }).notNull(),
  street: varchar("street", { length: 255 }).notNull(),
  issueType: varchar("issue_type", { length: 50 }).notNull(),
  priority: varchar("priority", { length: 10 }).notNull().default("medium"),
  description: text("description"),
  contactPhone: varchar("contact_phone", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  adminNotes: text("admin_notes"),
  resolvedBy: integer("resolved_by").references(() => usersTable.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;

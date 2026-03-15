import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { scheduleTable, zonesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetScheduleResponse,
  UpdateScheduleBody,
} from "@workspace/api-zod";
import { requireAuth, hasRole } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/schedule", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const schedules = await db
    .select({
      id: scheduleTable.id,
      zone_name: zonesTable.name,
      day_of_week: scheduleTable.dayOfWeek,
      start_time: scheduleTable.startTime,
      end_time: scheduleTable.endTime,
      is_active: scheduleTable.isActive,
    })
    .from(scheduleTable)
    .innerJoin(zonesTable, eq(scheduleTable.zoneId, zonesTable.id))
    .where(eq(scheduleTable.isActive, true))
    .orderBy(zonesTable.name, scheduleTable.dayOfWeek);

  res.json(
    GetScheduleResponse.parse({
      schedule: schedules.map((s) => ({
        id: s.id,
        zone_name: s.zone_name,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: s.is_active,
      })),
    })
  );
});

router.post("/schedule", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin", "manager"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = UpdateScheduleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { zone, days, start_time, end_time } = parsed.data;

  const [zoneRow] = await db
    .select()
    .from(zonesTable)
    .where(and(eq(zonesTable.name, zone), eq(zonesTable.isActive, true)));

  if (!zoneRow) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  // Deactivate existing
  await db
    .update(scheduleTable)
    .set({ isActive: false })
    .where(eq(scheduleTable.zoneId, zoneRow.id));

  // Insert/upsert new days
  for (const day of days) {
    const existing = await db
      .select()
      .from(scheduleTable)
      .where(
        and(eq(scheduleTable.zoneId, zoneRow.id), eq(scheduleTable.dayOfWeek, day))
      );

    if (existing.length > 0) {
      await db
        .update(scheduleTable)
        .set({ isActive: true, startTime: start_time ?? "07:00:00", endTime: end_time ?? "13:00:00" })
        .where(
          and(eq(scheduleTable.zoneId, zoneRow.id), eq(scheduleTable.dayOfWeek, day))
        );
    } else {
      await db.insert(scheduleTable).values({
        zoneId: zoneRow.id,
        dayOfWeek: day,
        startTime: start_time ?? "07:00:00",
        endTime: end_time ?? "13:00:00",
      });
    }
  }

  res.json({ message: `Schedule updated for ${zone}` });
});

export default router;

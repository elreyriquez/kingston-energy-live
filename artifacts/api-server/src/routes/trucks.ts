import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trucksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetTrucksResponse,
  CreateTruckBody,
  UpdateTruckBody,
} from "@workspace/api-zod";
import { requireAuth, hasRole } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/trucks", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const status = req.query.status as string | undefined;

  let query = db
    .select({
      id: trucksTable.id,
      truck_id: trucksTable.truckId,
      latitude: trucksTable.latitude,
      longitude: trucksTable.longitude,
      status: trucksTable.status,
      load_kg: trucksTable.loadKg,
      capacity_kg: trucksTable.capacityKg,
      collection_zone: trucksTable.collectionZone,
      updated_at: trucksTable.updatedAt,
    })
    .from(trucksTable)
    .where(
      status
        ? and(eq(trucksTable.isActive, true), eq(trucksTable.status, status))
        : eq(trucksTable.isActive, true)
    )
    .orderBy(trucksTable.truckId);

  const trucks = await query;

  res.json(
    GetTrucksResponse.parse({
      trucks: trucks.map((t) => ({
        ...t,
        latitude: parseFloat(t.latitude as string),
        longitude: parseFloat(t.longitude as string),
        updated_at: t.updated_at?.toISOString() ?? new Date().toISOString(),
      })),
    })
  );
});

router.post("/trucks", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = CreateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { truck_id, latitude, longitude, collection_zone, capacity_kg } = parsed.data;

  await db.insert(trucksTable).values({
    truckId: truck_id,
    latitude: (latitude ?? 17.997).toString(),
    longitude: (longitude ?? -76.7936).toString(),
    collectionZone: collection_zone ?? null,
    capacityKg: capacity_kg ?? 12000,
  });

  res.status(201).json({ message: "Truck created" });
});

router.patch("/trucks/:truckId", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin", "manager"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rawTruckId = Array.isArray(req.params.truckId)
    ? req.params.truckId[0]
    : req.params.truckId;

  const parsed = UpdateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.latitude !== undefined) updates.latitude = parsed.data.latitude.toString();
  if (parsed.data.longitude !== undefined) updates.longitude = parsed.data.longitude.toString();
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.load_kg !== undefined) updates.loadKg = parsed.data.load_kg;
  if (parsed.data.collection_zone !== undefined) updates.collectionZone = parsed.data.collection_zone;

  await db
    .update(trucksTable)
    .set(updates)
    .where(eq(trucksTable.truckId, rawTruckId));

  res.json({ message: "Truck updated" });
});

export default router;

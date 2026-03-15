import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { zonesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetZonesResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/zones", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const zones = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.isActive, true))
    .orderBy(zonesTable.name);

  res.json(
    GetZonesResponse.parse({
      zones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        center_lat: parseFloat(z.centerLat as string),
        center_lng: parseFloat(z.centerLng as string),
        radius_km: parseFloat(z.radiusKm as string),
      })),
    })
  );
});

export default router;

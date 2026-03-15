import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { smartBinsTable } from "@workspace/db";
import { GetSmartBinsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.get("/smartbin", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const bins = await db
    .select()
    .from(smartBinsTable)
    .orderBy(smartBinsTable.binId);

  res.json(
    GetSmartBinsResponse.parse({
      bins: bins.map((b) => ({
        id: b.id,
        bin_id: b.binId,
        location: b.location,
        fill_level: b.fillLevel,
        battery_level: b.batteryLevel,
        last_collected: b.lastCollected?.toISOString() ?? null,
        status: b.status,
      })),
    })
  );
});

export default router;

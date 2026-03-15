import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { smartBinsTable } from "@workspace/db";
import { GetSmartBinsResponse } from "@workspace/api-zod";
import { requireAuth, hasRole } from "../lib/auth.js";
import { eq } from "drizzle-orm";

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

// Simulate IoT update — randomises fill levels for all bins (admin/manager only)
router.post("/smartbin/simulate", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin", "manager"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const bins = await db.select().from(smartBinsTable);

  for (const bin of bins) {
    // Increase fill level by 5–20%, capped at 100
    const increment = Math.floor(Math.random() * 16) + 5;
    const newFill = Math.min(bin.fillLevel + increment, 100);
    // Slightly drain battery
    const newBattery = Math.max(bin.batteryLevel - Math.floor(Math.random() * 3), 0);
    await db
      .update(smartBinsTable)
      .set({ fillLevel: newFill, batteryLevel: newBattery })
      .where(eq(smartBinsTable.id, bin.id));
  }

  res.json({ message: "Simulation tick applied" });
});

// Dispatch truck — empties a specific bin (admin/manager only)
router.patch("/smartbin/:binId/collect", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin", "manager"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { binId } = req.params;

  await db
    .update(smartBinsTable)
    .set({ fillLevel: Math.floor(Math.random() * 8), lastCollected: new Date() })
    .where(eq(smartBinsTable.binId, binId));

  res.json({ message: "Bin collected" });
});

export default router;

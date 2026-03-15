import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trucksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

// In-memory stop statuses — resets on server restart (demo-grade)
const stopStatuses = new Map<string, string>();

const COLLECTION_STOPS = [
  { id: "KGN-001", name: "Half Way Tree Square",           area: "Kingston",   latitude: 18.0125,  longitude: -76.7945, capacityPercent: 92, priority: "high" },
  { id: "KGN-002", name: "New Kingston Business District", area: "Kingston",   latitude: 18.008,   longitude: -76.785,  capacityPercent: 45, priority: "medium" },
  { id: "KGN-003", name: "Cross Roads Market",             area: "Kingston",   latitude: 18.0065,  longitude: -76.792,  capacityPercent: 78, priority: "high" },
  { id: "KGN-004", name: "Downtown Kingston – King Street",area: "Kingston",   latitude: 17.968,   longitude: -76.793,  capacityPercent: 65, priority: "medium" },
  { id: "KGN-005", name: "Washington Blvd – Half Way Tree",area: "Kingston",   latitude: 18.015,   longitude: -76.798,  capacityPercent: 94, priority: "critical" },
  { id: "KGN-006", name: "Constant Spring Shopping Centre",area: "St Andrew",  latitude: 18.045,   longitude: -76.782,  capacityPercent: 38, priority: "low" },
  { id: "KGN-007", name: "Liguanea Plaza",                 area: "St Andrew",  latitude: 18.03,    longitude: -76.775,  capacityPercent: 88, priority: "high" },
  { id: "KGN-008", name: "Barbican Commercial Zone",       area: "St Andrew",  latitude: 18.038,   longitude: -76.768,  capacityPercent: 22, priority: "low" },
  { id: "KGN-009", name: "Portmore Town Center",           area: "Portmore",   latitude: 17.955,   longitude: -76.868,  capacityPercent: 91, priority: "critical" },
  { id: "KGN-010", name: "Waterford Residential",          area: "Portmore",   latitude: 17.948,   longitude: -76.875,  capacityPercent: 55, priority: "medium" },
  { id: "KGN-011", name: "Hellshire Road Junction",        area: "Portmore",   latitude: 17.9665,  longitude: -76.8556, capacityPercent: 72, priority: "medium" },
  { id: "KGN-012", name: "Papine Market",                  area: "St Andrew",  latitude: 18.022,   longitude: -76.745,  capacityPercent: 93, priority: "critical" },
  { id: "KGN-013", name: "Mountain View Avenue",           area: "St Andrew",  latitude: 18.005,   longitude: -76.765,  capacityPercent: 41, priority: "low" },
  { id: "KGN-014", name: "Spanish Town Road",              area: "Kingston",   latitude: 18.002,   longitude: -76.815,  capacityPercent: 84, priority: "high" },
  { id: "KGN-015", name: "Harbour View",                   area: "St Andrew",  latitude: 17.982,   longitude: -76.755,  capacityPercent: 58, priority: "medium" },
];

// GET /api/driver/stops
router.get("/driver/stops", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const stops = COLLECTION_STOPS.map((s) => ({
    ...s,
    status: stopStatuses.get(s.id) ?? "pending",
  }));

  const trucks = await db
    .select({
      latitude:       trucksTable.latitude,
      longitude:      trucksTable.longitude,
      truckId:        trucksTable.truckId,
    })
    .from(trucksTable)
    .where(eq(trucksTable.isActive, true))
    .limit(1);

  const truck = trucks[0];

  res.json({
    stops,
    truckLocation: {
      lat: truck ? parseFloat(truck.latitude as string) : 18.0129,
      lng: truck ? parseFloat(truck.longitude as string) : -76.795,
    },
    driverInfo: {
      driverName: user.name,
      truckId:    truck?.truckId ?? "KGN-TRUCK-001",
      shiftTime:  "6:00 AM – 2:00 PM",
    },
  });
});

// PATCH /api/driver/stops/:stopId/status
router.patch("/driver/stops/:stopId/status", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const stopId = req.params["stopId"] as string;
  const { status } = req.body as { status: string };

  const valid = ["pending", "en_route", "arrived", "complete"];
  if (!valid.includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  stopStatuses.set(stopId, status);
  res.json({ ok: true });
});

export default router;

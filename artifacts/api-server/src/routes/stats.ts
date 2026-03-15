import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trucksTable, reportsTable } from "@workspace/db";
import { eq, count, sum, not } from "drizzle-orm";
import { GetStatsResponse, GetAiAlertsResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth.js";
import crypto from "crypto";

const router: IRouter = Router();

const ALERT_TYPES = [
  {
    type: "MAINTENANCE",
    title: "Maintenance Required",
    icon: "🔧",
    messages: [
      "Truck {truck} shows signs of brake wear. Schedule maintenance within 48 hours.",
      "Engine performance degradation detected in {truck}. Recommended inspection.",
      "Hydraulic system pressure irregular in {truck}. Preventive maintenance advised.",
    ],
  },
  {
    type: "EFFICIENCY",
    title: "Efficiency Alert",
    icon: "📊",
    messages: [
      "{truck} collection efficiency dropped 15% in Cross Roads zone.",
      "Fuel consumption increased 12% for {truck}. Check tire pressure.",
      "Collection rate below target for {truck}.",
    ],
  },
  {
    type: "ROUTE",
    title: "Route Optimization",
    icon: "🗺️",
    messages: [
      "Traffic congestion detected on Washington Boulevard. Alternate route available.",
      "Optimized route available for {truck} that could save 23 minutes and 15% fuel.",
      "Weather conditions affecting downtown zone. Consider rescheduling.",
    ],
  },
  {
    type: "SAFETY",
    title: "Safety Concern",
    icon: "🚨",
    messages: [
      "Unusual driving pattern detected for {truck}. Possible driver fatigue.",
      "Safety inspection overdue for {truck}. Schedule immediately.",
      "Road conditions deteriorating in Half Way Tree. Advise reduced speed.",
    ],
  },
  {
    type: "CAPACITY",
    title: "Capacity Warning",
    icon: "⚡",
    messages: [
      "Riverton City Power Plant operating at 92% capacity. Consider redirecting trucks.",
      "Peak collection hours approaching. Deploy additional trucks.",
      "Waste processing backlog detected at Naggo Head Energy Facility.",
    ],
  },
  {
    type: "WEATHER",
    title: "Weather Impact",
    icon: "🌧️",
    messages: [
      "Heavy rainfall predicted in Downtown Kingston within 2 hours.",
      "High winds affecting collection efficiency. Secure loose materials.",
      "Temperature spike may affect waste decomposition rates.",
    ],
  },
];

const TRUCK_IDS = ["KGN-1234", "KGN-5678", "KGN-9012"];
const PRIORITIES: Array<"critical" | "high" | "medium" | "low"> = ["critical", "high", "medium", "low"];

let cachedAlerts: Array<{
  id: string;
  type: string;
  title: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  truck_id: string | null;
  created_at: string;
}> = [];
let lastAlertGenTime = 0;

function generateAlerts() {
  const now = Date.now();
  if (now - lastAlertGenTime < 30000 && cachedAlerts.length > 0) return cachedAlerts;

  cachedAlerts = [];
  const count = 4 + Math.floor(Math.random() * 4);

  for (let i = 0; i < count; i++) {
    const alertType = ALERT_TYPES[Math.floor(Math.random() * ALERT_TYPES.length)];
    const truck = TRUCK_IDS[Math.floor(Math.random() * TRUCK_IDS.length)];
    const msg = alertType.messages[Math.floor(Math.random() * alertType.messages.length)];
    cachedAlerts.push({
      id: crypto.randomBytes(8).toString("hex"),
      type: alertType.type,
      title: alertType.title,
      message: msg.replace("{truck}", truck),
      priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
      truck_id: truck,
      created_at: new Date(now - Math.floor(Math.random() * 3600000)).toISOString(),
    });
  }

  lastAlertGenTime = now;
  return cachedAlerts;
}

router.get("/stats", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const [truckStats] = await db
    .select({
      total: count(),
    })
    .from(trucksTable)
    .where(eq(trucksTable.isActive, true));

  const [activeTrucks] = await db
    .select({ total: count() })
    .from(trucksTable)
    .where(eq(trucksTable.status, "collecting"));

  const [reportStats] = await db
    .select({ total: count() })
    .from(reportsTable);

  const [pendingReports] = await db
    .select({ total: count() })
    .from(reportsTable)
    .where(eq(reportsTable.status, "pending"));

  // Simulate cumulative stats
  const wasteCollectedKg = 142500 + Math.floor(Math.random() * 5000);
  const energyGeneratedKwh = Math.round(wasteCollectedKg * 0.52);
  const homesPowered = Math.round(energyGeneratedKwh / 30);
  const co2OffsetKg = Math.round(wasteCollectedKg * 0.43);

  res.json(
    GetStatsResponse.parse({
      total_trucks: truckStats.total,
      active_trucks: activeTrucks.total,
      waste_collected_kg: wasteCollectedKg,
      energy_generated_kwh: energyGeneratedKwh,
      homes_powered: homesPowered,
      co2_offset_kg: co2OffsetKg,
      total_reports: reportStats.total,
      pending_reports: pendingReports.total,
    })
  );
});

router.get("/ai-alerts", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const alerts = generateAlerts();
  res.json(GetAiAlertsResponse.parse({ alerts }));
});

export default router;

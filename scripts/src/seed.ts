import { db } from "@workspace/db";
import {
  usersTable,
  zonesTable,
  trucksTable,
  scheduleTable,
  smartBinsTable,
  reportsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Users
  const passwords = {
    admin: await bcrypt.hash("admin123", 10),
    manager: await bcrypt.hash("manager123", 10),
    user: await bcrypt.hash("user123", 10),
    driver: await bcrypt.hash("driver123", 10),
  };

  await db
    .insert(usersTable)
    .values([
      {
        username: "admin",
        passwordHash: passwords.admin,
        role: "admin",
        name: "System Administrator",
        email: "admin@kingstonenergy.jm",
      },
      {
        username: "manager",
        passwordHash: passwords.manager,
        role: "manager",
        name: "Operations Manager",
        email: "manager@kingstonenergy.jm",
      },
      {
        username: "user",
        passwordHash: passwords.user,
        role: "user",
        name: "Resident User",
        email: "resident@example.com",
        zone: "Downtown Kingston",
      },
      {
        username: "driver",
        passwordHash: passwords.driver,
        role: "driver",
        name: "Field Driver",
        email: "driver@kingstonenergy.jm",
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Users seeded");

  // Zones
  const zones = [
    { name: "Downtown Kingston", centerLat: "17.9700", centerLng: "-76.7900", radiusKm: "1.5" },
    { name: "Cross Roads", centerLat: "18.0000", centerLng: "-76.7900", radiusKm: "1.2" },
    { name: "Half Way Tree", centerLat: "18.0100", centerLng: "-76.8000", radiusKm: "1.3" },
    { name: "Constant Spring", centerLat: "18.0200", centerLng: "-76.7800", radiusKm: "1.1" },
    { name: "Spanish Town", centerLat: "18.0100", centerLng: "-76.7500", radiusKm: "1.4" },
    { name: "Portmore", centerLat: "17.9600", centerLng: "-76.8700", radiusKm: "1.6" },
  ];

  for (const z of zones) {
    await db.insert(zonesTable).values(z).onConflictDoNothing();
  }

  console.log("✓ Zones seeded");

  // Trucks
  await db
    .insert(trucksTable)
    .values([
      {
        truckId: "KGN-1234",
        latitude: "18.0100",
        longitude: "-76.8000",
        status: "collecting",
        loadKg: 2500,
        capacityKg: 12000,
        collectionZone: "Half Way Tree",
      },
      {
        truckId: "KGN-5678",
        latitude: "17.9700",
        longitude: "-76.7900",
        status: "collecting",
        loadKg: 8500,
        capacityKg: 15000,
        collectionZone: "Downtown Kingston",
      },
      {
        truckId: "KGN-9012",
        latitude: "18.0200",
        longitude: "-76.7800",
        status: "enroute-to-disposal",
        loadKg: 11000,
        capacityKg: 10000,
        collectionZone: "Constant Spring",
      },
      {
        truckId: "KGN-3456",
        latitude: "17.9600",
        longitude: "-76.8700",
        status: "returning",
        loadKg: 0,
        capacityKg: 12000,
        collectionZone: "Portmore",
      },
      {
        truckId: "KGN-7890",
        latitude: "18.0100",
        longitude: "-76.7500",
        status: "collecting",
        loadKg: 4200,
        capacityKg: 14000,
        collectionZone: "Spanish Town",
      },
    ])
    .onConflictDoNothing();

  console.log("✓ Trucks seeded");

  // Schedule: get all zone IDs
  const allZones = await db.select().from(zonesTable);
  const zoneMap = Object.fromEntries(allZones.map((z) => [z.name, z.id]));

  const scheduleData = [
    { zone: "Downtown Kingston", days: [1, 3, 5] }, // Mon, Wed, Fri
    { zone: "Cross Roads", days: [2, 4, 6] },        // Tue, Thu, Sat
    { zone: "Half Way Tree", days: [1, 4] },         // Mon, Thu
    { zone: "Constant Spring", days: [2, 5] },       // Tue, Fri
    { zone: "Spanish Town", days: [3, 6] },          // Wed, Sat
    { zone: "Portmore", days: [1, 3, 5] },           // Mon, Wed, Fri
  ];

  for (const entry of scheduleData) {
    const zoneId = zoneMap[entry.zone];
    if (!zoneId) continue;
    for (const day of entry.days) {
      await db
        .insert(scheduleTable)
        .values({
          zoneId,
          dayOfWeek: day,
          startTime: "07:00:00",
          endTime: "13:00:00",
        })
        .onConflictDoNothing();
    }
  }

  console.log("✓ Schedule seeded");

  // Smart Bins
  await db
    .insert(smartBinsTable)
    .values([
      { binId: "KSB-001", location: "King Street & Orange St, Downtown", fillLevel: 82, batteryLevel: 95, status: "ok" },
      { binId: "KSB-002", location: "Half Way Tree Plaza", fillLevel: 45, batteryLevel: 78, status: "ok" },
      { binId: "KSB-003", location: "Constant Spring Road & Dunrobin Ave", fillLevel: 93, batteryLevel: 62, status: "full" },
      { binId: "KSB-004", location: "Portmore Town Center", fillLevel: 28, batteryLevel: 88, status: "ok" },
      { binId: "KSB-005", location: "Cross Roads Junction", fillLevel: 71, batteryLevel: 91, status: "ok" },
      { binId: "KSB-006", location: "New Kingston Commercial District", fillLevel: 56, batteryLevel: 44, status: "low-battery" },
      { binId: "KSB-007", location: "Spanish Town Market", fillLevel: 88, batteryLevel: 73, status: "ok" },
      { binId: "KSB-008", location: "Maxfield Ave & Waltham Park Road", fillLevel: 12, batteryLevel: 98, status: "ok" },
    ])
    .onConflictDoNothing();

  console.log("✓ Smart Bins seeded");

  // Sample Reports
  const [residentUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, "user"));

  if (residentUser) {
    await db
      .insert(reportsTable)
      .values([
        {
          reportRef: "KE-ABC123-XYZ",
          userId: residentUser.id,
          zoneName: "Downtown Kingston",
          street: "King Street",
          issueType: "missed-pickup",
          priority: "high",
          description: "Garbage has not been collected for 3 days",
          status: "pending",
        },
        {
          reportRef: "KE-DEF456-ABC",
          userId: residentUser.id,
          zoneName: "Downtown Kingston",
          street: "Orange Street",
          issueType: "overflowing",
          priority: "high",
          description: "Bin is overflowing onto the sidewalk",
          status: "in-review",
        },
        {
          reportRef: "KE-GHI789-DEF",
          userId: residentUser.id,
          zoneName: "Cross Roads",
          street: "Maxfield Avenue",
          issueType: "illegal-dumping",
          priority: "medium",
          description: "Large pile of trash dumped illegally behind the bus stop",
          status: "resolved",
        },
      ])
      .onConflictDoNothing();
  }

  console.log("✓ Reports seeded");
  console.log("\n✅ Database seeded successfully!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

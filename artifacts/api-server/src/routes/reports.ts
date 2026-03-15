import { Router, type IRouter } from "express";
import crypto from "crypto";
import { db } from "@workspace/db";
import { reportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  GetReportsResponse,
  CreateReportBody,
  UpdateReportBody,
} from "@workspace/api-zod";
import { requireAuth, hasRole } from "../lib/auth.js";

const router: IRouter = Router();

function generateReportRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let ref = "KE-";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  ref += "-";
  for (let i = 0; i < 3; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

router.get("/reports", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const status = req.query.status as string | undefined;
  const zone = req.query.zone as string | undefined;

  let conditions = [];
  if (status) conditions.push(eq(reportsTable.status, status));
  if (zone) conditions.push(eq(reportsTable.zoneName, zone));

  // Residents only see their own reports
  if (user.role === "user") {
    conditions.push(eq(reportsTable.userId, user.id));
  }

  const reports = await db
    .select()
    .from(reportsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(reportsTable.submittedAt);

  res.json(
    GetReportsResponse.parse({
      reports: reports.map((r) => ({
        id: r.id,
        report_ref: r.reportRef,
        zone_name: r.zoneName,
        street: r.street,
        issue_type: r.issueType,
        priority: r.priority,
        description: r.description,
        status: r.status,
        submitted_at: r.submittedAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
      })),
    })
  );
});

router.post("/reports", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = CreateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { zone_name, street, issue_type, priority, description, contact_phone } = parsed.data;
  const reportRef = generateReportRef();

  await db.insert(reportsTable).values({
    reportRef,
    userId: user.id,
    zoneName: zone_name,
    street,
    issueType: issue_type,
    priority: priority ?? "medium",
    description: description ?? null,
    contactPhone: contact_phone ?? null,
  });

  res.status(201).json({ message: "Report submitted", report_ref: reportRef });
});

router.patch("/reports/:reportId", async (req, res): Promise<void> => {
  const user = await requireAuth(req, res);
  if (!user) return;

  if (!hasRole(user, ["admin", "manager"])) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const raw = Array.isArray(req.params.reportId)
    ? req.params.reportId[0]
    : req.params.reportId;
  const reportId = parseInt(raw, 10);

  const parsed = UpdateReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.admin_notes !== undefined) updates.adminNotes = parsed.data.admin_notes;
  if (parsed.data.status === "resolved") updates.resolvedBy = user.id;

  await db
    .update(reportsTable)
    .set(updates)
    .where(eq(reportsTable.id, reportId));

  res.json({ message: "Report updated" });
});

export default router;

import { Request, Response } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AuthUser {
  id: number;
  username: string;
  role: string;
  name: string;
  zone: string | null;
}

export async function requireAuth(req: Request, res: Response): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const token = authHeader.slice(7);
  const now = new Date();

  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.token, token), gt(sessionsTable.expiresAt, now)));

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    zone: user.zone,
  };
}

export function hasRole(user: AuthUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

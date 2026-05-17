import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userRolesTable, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminSetUserRoleBody } from "@workspace/api-zod";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

async function requireAdmin(req: any, res: any, next: any) {
  const userId = req.userId;
  const role = await db
    .select()
    .from(userRolesTable)
    .where(eq(userRolesTable.userId, userId))
    .limit(1);
  if (!role.length || role[0].role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

router.get("/check", requireAuth, async (req: any, res) => {
  try {
    const roles = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, req.userId));
    const isAdmin = roles.some((r) => r.role === "admin");
    res.json({ isAdmin });
  } catch (err) {
    req.log.error({ err }, "adminCheck error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const users = await db
      .select({
        userId: profilesTable.userId,
        displayName: profilesTable.displayName,
        avatarUrl: profilesTable.avatarUrl,
        createdAt: profilesTable.createdAt,
        role: userRolesTable.role,
      })
      .from(profilesTable)
      .leftJoin(userRolesTable, eq(userRolesTable.userId, profilesTable.userId))
      .orderBy(profilesTable.createdAt);

    const result = users.map((u) => ({
      userId: u.userId,
      email: "",
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      role: (u.role ?? "user") as "admin" | "user",
      createdAt: u.createdAt?.toISOString() ?? new Date().toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "adminListUsers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:userId/role", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const parsed = AdminSetUserRoleBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const { userId } = req.params;
    const { role } = parsed.data;

    await db.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
    await db.insert(userRolesTable).values({ userId, role });

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "adminSetUserRole error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/:userId", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { userId } = req.params;
    await db.delete(userRolesTable).where(eq(userRolesTable.userId, userId));
    await db.delete(profilesTable).where(eq(profilesTable.userId, userId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "adminDeleteUser error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

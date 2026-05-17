import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { profilesTable, userRolesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/", async (req: any, res) => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [profileRow] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);

    const [roleRow] = await db
      .select()
      .from(userRolesTable)
      .where(eq(userRolesTable.userId, userId))
      .limit(1);

    res.json({
      userId,
      displayName: profileRow?.displayName ?? null,
      avatarUrl: profileRow?.avatarUrl ?? null,
      role: (roleRow?.role ?? "user") as "admin" | "user",
      isAdmin: roleRow?.role === "admin",
    });
  } catch (err) {
    req.log.error({ err }, "me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

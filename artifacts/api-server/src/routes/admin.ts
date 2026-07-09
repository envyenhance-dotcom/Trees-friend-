import { Router } from "express";
import {
  db,
  treesTable,
  treeVarietiesTable,
  profilesTable,
  listingsTable,
  ordersTable,
  varietyRequestsTable,
} from "@workspace/db";
import { eq, sql, desc, or } from "drizzle-orm";
import { adminAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/admin/stats
router.get("/stats", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const [
      [{ totalTrees }],
      [{ totalVarieties }],
      [{ totalSellers }],
      [{ pendingListings }],
      [{ pendingVarietyRequests }],
      [{ totalOrders }],
      [{ totalRevenue }],
      recentOrders,
    ] = await Promise.all([
      db.select({ totalTrees: sql<number>`count(*)::int` }).from(treesTable),
      db.select({ totalVarieties: sql<number>`count(*)::int` }).from(treeVarietiesTable),
      db
        .select({ totalSellers: sql<number>`count(*)::int` })
        .from(profilesTable)
        .where(eq(profilesTable.role, "seller")),
      db
        .select({ pendingListings: sql<number>`count(*)::int` })
        .from(listingsTable)
        .where(eq(listingsTable.status, "pending")),
      db
        .select({ pendingVarietyRequests: sql<number>`count(*)::int` })
        .from(varietyRequestsTable)
        .where(eq(varietyRequestsTable.status, "pending")),
      db.select({ totalOrders: sql<number>`count(*)::int` }).from(ordersTable),
      db
        .select({ totalRevenue: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}::numeric), 0)::float` })
        .from(ordersTable)
        .where(eq(ordersTable.paymentStatus, "paid")),
      db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10),
    ]);

    res.json({
      totalTrees,
      totalVarieties,
      totalSellers,
      pendingListings,
      pendingVarietyRequests,
      totalOrders,
      totalRevenue,
      recentOrders,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/admin/users — list all users with pagination + role filter
router.get("/users", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const role = req.query.role as string | undefined;

    const whereClause = role ? eq(profilesTable.role, role) : undefined;

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(profilesTable)
      .where(whereClause);

    const users = await db
      .select()
      .from(profilesTable)
      .where(whereClause)
      .orderBy(desc(profilesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ data: users, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

// POST /api/admin/users/:id/set-role — promote or demote any user's role
// Industry-standard admin capability: only admins can change roles.
// Prevents self-demotion to avoid accidental lockout.
router.post("/users/:id/set-role", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const targetId = Number(req.params.id);
    const { role } = req.body as { role: string };

    const VALID_ROLES = ["buyer", "seller", "admin"];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
    }

    // Prevent self-demotion (accidental admin lockout)
    if (targetId === req.profileId && role !== "admin") {
      return res.status(400).json({ error: "Admins cannot demote themselves. Have another admin do this." });
    }

    const [profile] = await db
      .update(profilesTable)
      .set({ role })
      .where(eq(profilesTable.id, targetId))
      .returning();

    if (!profile) return res.status(404).json({ error: "User not found" });

    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to set role" });
  }
});

export default router;

import { Router } from "express";
import { db, profilesTable, listingsTable, reviewsTable, ordersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { adminAuth, sellerAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/sellers — admin: list all sellers
router.get("/", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(profilesTable)
      .where(eq(profilesTable.role, "seller"));
    const sellers = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.role, "seller"))
      .limit(limit)
      .offset(offset);
    res.json({ data: sellers, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list sellers" });
  }
});

// GET /api/sellers/me/stats — authenticated seller: personal dashboard stats
router.get("/me/stats", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const sellerId = req.profileId!;

    const [
      [{ totalRevenue }],
      [{ totalOrders }],
      [{ activeListings }],
      [{ pendingListings }],
      [{ rejectedListings }],
      recentOrders,
    ] = await Promise.all([
      db
        .select({ totalRevenue: sql<number>`COALESCE(SUM(${ordersTable.totalPrice}::numeric), 0)::float` })
        .from(ordersTable)
        .where(and(eq(ordersTable.sellerId, sellerId), eq(ordersTable.paymentStatus, "paid"))),
      db
        .select({ totalOrders: sql<number>`count(*)::int` })
        .from(ordersTable)
        .where(eq(ordersTable.sellerId, sellerId)),
      db
        .select({ activeListings: sql<number>`count(*)::int` })
        .from(listingsTable)
        .where(and(eq(listingsTable.sellerId, sellerId), eq(listingsTable.status, "approved"))),
      db
        .select({ pendingListings: sql<number>`count(*)::int` })
        .from(listingsTable)
        .where(and(eq(listingsTable.sellerId, sellerId), eq(listingsTable.status, "pending"))),
      db
        .select({ rejectedListings: sql<number>`count(*)::int` })
        .from(listingsTable)
        .where(and(eq(listingsTable.sellerId, sellerId), eq(listingsTable.status, "rejected"))),
      db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.sellerId, sellerId))
        .orderBy(desc(ordersTable.createdAt))
        .limit(8),
    ]);

    res.json({
      totalRevenue,
      totalOrders,
      activeListings,
      pendingListings,
      rejectedListings,
      recentOrders,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get seller stats" });
  }
});

// GET /api/sellers/:id — public seller storefront
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.id, id))
      .limit(1);
    if (!profile || profile.role === "buyer") return res.status(404).json({ error: "Seller not found" });

    const listings = await db
      .select()
      .from(listingsTable)
      .where(and(eq(listingsTable.sellerId, id), eq(listingsTable.status, "approved")))
      .orderBy(desc(listingsTable.createdAt))
      .limit(50);

    const [ratingRow] = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)::float`,
        cnt: sql<number>`COUNT(*)::int`,
      })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.targetType, "seller"), eq(reviewsTable.targetId, id)));

    res.json({
      profile,
      listings,
      stats: {
        totalListings: listings.length,
        averageRating: ratingRow ? Math.round(ratingRow.avg * 10) / 10 : null,
        reviewCount: ratingRow?.cnt ?? 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get seller" });
  }
});

// POST /api/sellers/:id/verify — admin only
router.post("/:id/verify", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const [profile] = await db
      .update(profilesTable)
      .set({ isVerified: true })
      .where(eq(profilesTable.id, Number(req.params.id)))
      .returning();
    if (!profile) return res.status(404).json({ error: "Seller not found" });
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to verify seller" });
  }
});

// POST /api/sellers/:id/suspend — admin only
router.post("/:id/suspend", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const { suspended } = req.body as { suspended: boolean };
    const [profile] = await db
      .update(profilesTable)
      .set({ isSuspended: suspended })
      .where(eq(profilesTable.id, Number(req.params.id)))
      .returning();
    if (!profile) return res.status(404).json({ error: "Seller not found" });
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update seller" });
  }
});

export default router;

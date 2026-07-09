import { Router } from "express";
import { db, ordersTable, listingsTable, profilesTable, treeVarietiesTable, paymentsTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth, sellerAuth, adminAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, order.listingId)).limit(1);
  const [buyer] = await db.select().from(profilesTable).where(eq(profilesTable.id, order.buyerId)).limit(1);
  const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, order.sellerId)).limit(1);
  let variety = null;
  if (listing) {
    const [v] = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.id, listing.varietyId)).limit(1);
    variety = v ?? null;
  }
  return {
    ...order,
    listing: listing ? { ...listing, variety } : null,
    buyer: buyer ?? null,
    seller: seller ?? null,
  };
}

function paginate(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

// GET /api/orders
router.get("/", ...auth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.buyerId, req.profileId!));
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.buyerId, req.profileId!)).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);
    res.json({ data: await Promise.all(orders.map(enrichOrder)), meta: paginate(total, page, limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list orders" });
  }
});

// GET /api/orders/all (admin)
router.get("/all", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const where = status ? eq(ordersTable.status, status) : sql`true`;
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(ordersTable).where(where);
    const orders = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);
    res.json({ data: await Promise.all(orders.map(enrichOrder)), meta: paginate(total, page, limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list orders" });
  }
});

// GET /api/orders/seller
router.get("/seller", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const where = status
      ? and(eq(ordersTable.sellerId, req.profileId!), eq(ordersTable.status, status))
      : eq(ordersTable.sellerId, req.profileId!);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(ordersTable).where(where);
    const orders = await db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset);
    res.json({ data: await Promise.all(orders.map(enrichOrder)), meta: paginate(total, page, limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list seller orders" });
  }
});

// GET /api/orders/:id
router.get("/:id", ...auth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.role !== "admin" && order.buyerId !== req.profileId && order.sellerId !== req.profileId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const enriched = await enrichOrder(order);
    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.orderId, id)).limit(1);
    res.json({ ...enriched, payment: payment ?? null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get order" });
  }
});

// PUT /api/orders/:id/status
router.put("/:id/status", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body as { status: string };
    const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Order not found" });
    if (req.role !== "admin" && existing.sellerId !== req.profileId) {
      return res.status(403).json({ error: "Not your order" });
    }
    const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    res.json(order);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

export default router;

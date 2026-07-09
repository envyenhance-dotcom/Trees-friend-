import { Router } from "express";
import { db, listingsTable, treeVarietiesTable, treesTable, profilesTable } from "@workspace/db";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { auth, sellerAuth, adminAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function enrichListing(listing: typeof listingsTable.$inferSelect) {
  const [variety] = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.id, listing.varietyId)).limit(1);
  const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, listing.sellerId)).limit(1);
  return { ...listing, variety: variety ?? null, seller: seller ?? null };
}

function paginateQuery(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}

// GET /api/listings/mine
router.get("/mine", ...auth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(listingsTable)
      .where(eq(listingsTable.sellerId, req.profileId!));
    const listings = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.sellerId, req.profileId!))
      .orderBy(desc(listingsTable.createdAt))
      .limit(limit)
      .offset(offset);
    const enriched = await Promise.all(listings.map(enrichListing));
    res.json({ data: enriched, meta: paginateQuery(total, page, limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list listings" });
  }
});

// GET /api/listings
router.get("/", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const where = status ? eq(listingsTable.status, status) : undefined;
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(listingsTable).where(where ?? sql`true`);
    const listings = await db.select().from(listingsTable).where(where ?? sql`true`).orderBy(desc(listingsTable.createdAt)).limit(limit).offset(offset);
    const enriched = await Promise.all(listings.map(enrichListing));
    res.json({ data: enriched, meta: paginateQuery(total, page, limit) });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list listings" });
  }
});

// POST /api/listings
router.post("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const body = req.body as {
      varietyId: number; price: number; currency?: string; quantity: number;
      unit?: string; location?: string; deliveryAvailable: boolean; deliveryNotes?: string; images?: string[];
    };
    if (!body.varietyId || !body.price || !body.quantity) {
      return res.status(400).json({ error: "varietyId, price, and quantity are required" });
    }
    const [listing] = await db.insert(listingsTable).values({
      sellerId: req.profileId!,
      varietyId: body.varietyId,
      price: String(body.price),
      currency: body.currency || "BDT",
      quantity: body.quantity,
      unit: body.unit || "per plant",
      location: body.location,
      deliveryAvailable: body.deliveryAvailable ?? false,
      deliveryNotes: body.deliveryNotes,
      images: body.images || [],
      status: "pending",
    }).returning();
    res.status(201).json(await enrichListing(listing));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  try {
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, Number(req.params.id))).limit(1);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(await enrichListing(listing));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get listing" });
  }
});

// PUT /api/listings/:id
router.put("/:id", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (req.role !== "admin" && existing.sellerId !== req.profileId) {
      return res.status(403).json({ error: "Not your listing" });
    }
    const body = req.body as Partial<typeof listingsTable.$inferInsert>;
    if (body.price) body.price = String(body.price);
    const [listing] = await db.update(listingsTable).set({ ...body, status: "pending" }).where(eq(listingsTable.id, id)).returning();
    res.json(await enrichListing(listing));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// DELETE /api/listings/:id
router.delete("/:id", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(listingsTable).where(eq(listingsTable.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (req.role !== "admin" && existing.sellerId !== req.profileId) {
      return res.status(403).json({ error: "Not your listing" });
    }
    await db.delete(listingsTable).where(eq(listingsTable.id, id));
    res.json({ message: "Listing deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete listing" });
  }
});

// POST /api/listings/:id/approve
router.post("/:id/approve", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const [listing] = await db.update(listingsTable).set({ status: "approved", rejectionReason: null }).where(eq(listingsTable.id, Number(req.params.id))).returning();
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(await enrichListing(listing));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve listing" });
  }
});

// POST /api/listings/:id/reject
router.post("/:id/reject", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body as { reason: string };
    const [listing] = await db.update(listingsTable).set({ status: "rejected", rejectionReason: reason }).where(eq(listingsTable.id, Number(req.params.id))).returning();
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(await enrichListing(listing));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reject listing" });
  }
});

export default router;

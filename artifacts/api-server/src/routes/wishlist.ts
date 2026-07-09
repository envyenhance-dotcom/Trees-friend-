import { Router } from "express";
import { db, wishlistItemsTable, listingsTable, treeVarietiesTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { auth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function enrichWishlistItem(item: typeof wishlistItemsTable.$inferSelect) {
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, item.listingId)).limit(1);
  if (!listing) return { ...item, listing: null };
  const [variety] = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.id, listing.varietyId)).limit(1);
  const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, listing.sellerId)).limit(1);
  return { ...item, listing: { ...listing, variety: variety ?? null, seller: seller ?? null } };
}

// GET /api/wishlist
router.get("/", ...auth, async (req: AuthRequest, res) => {
  try {
    const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.buyerId, req.profileId!));
    res.json(await Promise.all(items.map(enrichWishlistItem)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get wishlist" });
  }
});

// POST /api/wishlist
router.post("/", ...auth, async (req: AuthRequest, res) => {
  try {
    const { listingId } = req.body as { listingId: number };
    if (!listingId) return res.status(400).json({ error: "listingId required" });
    const existing = await db.select().from(wishlistItemsTable).where(and(
      eq(wishlistItemsTable.buyerId, req.profileId!),
      eq(wishlistItemsTable.listingId, listingId)
    )).limit(1);
    if (existing.length > 0) return res.status(201).json(existing[0]);
    const [item] = await db.insert(wishlistItemsTable).values({ buyerId: req.profileId!, listingId }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
});

// DELETE /api/wishlist/:id
router.delete("/:id", ...auth, async (req: AuthRequest, res) => {
  try {
    await db.delete(wishlistItemsTable).where(and(
      eq(wishlistItemsTable.id, Number(req.params.id)),
      eq(wishlistItemsTable.buyerId, req.profileId!)
    ));
    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
});

export default router;

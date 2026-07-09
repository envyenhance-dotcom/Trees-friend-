import { Router } from "express";
import { db, cartItemsTable, listingsTable, profilesTable, treeVarietiesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

async function getFullCart(buyerId: number) {
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(eq(cartItemsTable.buyerId, buyerId));

  if (items.length === 0) return { groups: [], total: 0, itemCount: 0 };

  const enriched = await Promise.all(
    items.map(async (item) => {
      const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, item.listingId)).limit(1);
      if (!listing) return null;
      const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, listing.sellerId)).limit(1);
      const [variety] = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.id, listing.varietyId)).limit(1);
      return { ...item, listing: { ...listing, seller: seller ?? null, variety: variety ?? null } };
    })
  );

  const validItems = enriched.filter(Boolean) as NonNullable<(typeof enriched)[number]>[];

  // Group by seller
  const grouped = new Map<number, typeof validItems>();
  for (const item of validItems) {
    const sellerId = item.listing.sellerId;
    if (!grouped.has(sellerId)) grouped.set(sellerId, []);
    grouped.get(sellerId)!.push(item);
  }

  let total = 0;
  const groups = [];
  for (const [, items] of grouped) {
    const subtotal = items.reduce((sum, i) => sum + Number(i.listing.price) * i.quantity, 0);
    total += subtotal;
    groups.push({ seller: items[0].listing.seller, items, subtotal });
  }

  return { groups, total, itemCount: validItems.length };
}

// GET /api/cart
router.get("/", ...auth, async (req: AuthRequest, res) => {
  try {
    res.json(await getFullCart(req.profileId!));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get cart" });
  }
});

// POST /api/cart
router.post("/", ...auth, async (req: AuthRequest, res) => {
  try {
    const { listingId, quantity } = req.body as { listingId: number; quantity: number };
    if (!listingId || !quantity) return res.status(400).json({ error: "listingId and quantity required" });
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId)).limit(1);
    if (!listing || listing.status !== "approved") return res.status(400).json({ error: "Listing not available" });

    // Check if already in cart, update quantity
    const existing = await db.select().from(cartItemsTable).where(and(eq(cartItemsTable.buyerId, req.profileId!), eq(cartItemsTable.listingId, listingId))).limit(1);
    if (existing.length > 0) {
      const [item] = await db.update(cartItemsTable).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItemsTable.id, existing[0].id)).returning();
      return res.status(201).json(item);
    }
    const [item] = await db.insert(cartItemsTable).values({ buyerId: req.profileId!, listingId, quantity }).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add to cart" });
  }
});

// PUT /api/cart/:id
router.put("/:id", ...auth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { quantity } = req.body as { quantity: number };
    if (!quantity || quantity < 1) return res.status(400).json({ error: "quantity must be >= 1" });
    const [item] = await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.id, id), eq(cartItemsTable.buyerId, req.profileId!))).returning();
    if (!item) return res.status(404).json({ error: "Cart item not found" });
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

// DELETE /api/cart/:id
router.delete("/:id", ...auth, async (req: AuthRequest, res) => {
  try {
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.id, Number(req.params.id)), eq(cartItemsTable.buyerId, req.profileId!)));
    res.json({ message: "Removed from cart" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove cart item" });
  }
});

export default router;

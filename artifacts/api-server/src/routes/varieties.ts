import { Router } from "express";
import { db, treeVarietiesTable, treeImagesTable, treesTable, listingsTable, reviewsTable, profilesTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { adminAuth, auth } from "../lib/auth";
import { toSlug } from "../lib/slug";

const router = Router();

async function enrichVariety(v: typeof treeVarietiesTable.$inferSelect) {
  const [ratingRow] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)::float`,
      cnt: sql<number>`COUNT(*)::int`,
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.targetType, "variety"), eq(reviewsTable.targetId, v.id)));

  const [listingCount] = await db
    .select({ cnt: sql<number>`count(*)::int` })
    .from(listingsTable)
    .where(and(eq(listingsTable.varietyId, v.id), eq(listingsTable.status, "approved")));

  return {
    ...v,
    averageRating: ratingRow ? Math.round(ratingRow.avg * 10) / 10 : null,
    reviewCount: ratingRow?.cnt ?? 0,
    activeListingCount: listingCount?.cnt ?? 0,
  };
}

// GET /api/varieties/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [variety] = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.id, id)).limit(1);
    if (!variety) return res.status(404).json({ error: "Variety not found" });
    const tree = await db.select().from(treesTable).where(eq(treesTable.id, variety.treeId)).limit(1);
    const images = await db.select().from(treeImagesTable).where(eq(treeImagesTable.varietyId, id)).orderBy(treeImagesTable.sortOrder);
    const enriched = await enrichVariety(variety);
    res.json({ ...enriched, tree: tree[0] ?? null, images });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get variety" });
  }
});

// POST /api/varieties
router.post("/", ...adminAuth, async (req, res) => {
  try {
    const body = req.body as { treeId: number; varietyName: string; [key: string]: unknown };
    if (!body.treeId || !body.varietyName) return res.status(400).json({ error: "treeId and varietyName required" });
    const [tree] = await db.select().from(treesTable).where(eq(treesTable.id, body.treeId)).limit(1);
    if (!tree) return res.status(404).json({ error: "Tree not found" });
    const slug = toSlug(`${tree.commonName}-${body.varietyName}`);
    const [variety] = await db.insert(treeVarietiesTable).values({
      treeId: body.treeId,
      varietyName: body.varietyName,
      slug,
      description: body.description as string | undefined,
      origin: body.origin as string | undefined,
      taste: body.taste as string | undefined,
      fruitSize: body.fruitSize as string | undefined,
      treeSize: body.treeSize as string | undefined,
      yieldAmount: body.yieldAmount as string | undefined,
      diseaseResistance: body.diseaseResistance as string | undefined,
      harvestTime: body.harvestTime as string | undefined,
      bestClimate: body.bestClimate as string | undefined,
      advantages: body.advantages as string | undefined,
      disadvantages: body.disadvantages as string | undefined,
    }).returning();
    res.status(201).json(await enrichVariety(variety));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create variety" });
  }
});

// PUT /api/varieties/:id
router.put("/:id", ...adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body as Partial<typeof treeVarietiesTable.$inferInsert>;
    const [variety] = await db.update(treeVarietiesTable).set(body).where(eq(treeVarietiesTable.id, id)).returning();
    if (!variety) return res.status(404).json({ error: "Variety not found" });
    res.json(await enrichVariety(variety));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update variety" });
  }
});

// DELETE /api/varieties/:id
router.delete("/:id", ...adminAuth, async (req, res) => {
  try {
    await db.delete(treeVarietiesTable).where(eq(treeVarietiesTable.id, Number(req.params.id)));
    res.json({ message: "Variety deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete variety" });
  }
});

// POST /api/varieties/:id/images
router.post("/:id/images", ...adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { imageUrl, imageType, sortOrder } = req.body as { imageUrl: string; imageType?: string; sortOrder?: number };
    const [img] = await db.insert(treeImagesTable).values({
      varietyId: id, imageUrl, imageType: imageType || "general", sortOrder: sortOrder ?? 0
    }).returning();
    res.status(201).json(img);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add image" });
  }
});

// GET /api/varieties/:id/listings
router.get("/:id/listings", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const listings = await db
      .select()
      .from(listingsTable)
      .where(and(eq(listingsTable.varietyId, id), eq(listingsTable.status, "approved")))
      .orderBy(listingsTable.price);

    const enriched = await Promise.all(
      listings.map(async (listing) => {
        const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, listing.sellerId)).limit(1);
        return { ...listing, seller: seller ?? null };
      })
    );

    // Filter out suspended sellers
    const filtered = enriched.filter((l) => l.seller && !l.seller.isSuspended);
    res.json(filtered);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get listings" });
  }
});

export default router;

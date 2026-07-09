import { Router } from "express";
import { db, treesTable, treeVarietiesTable, treeImagesTable, treeCategoriesTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, ilike, or, sql, and, inArray } from "drizzle-orm";
import { adminAuth } from "../lib/auth";
import { toSlug } from "../lib/slug";

const router = Router();

async function enrichTree(tree: typeof treesTable.$inferSelect) {
  const categories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug })
    .from(categoriesTable)
    .innerJoin(treeCategoriesTable, eq(treeCategoriesTable.categoryId, categoriesTable.id))
    .where(eq(treeCategoriesTable.treeId, tree.id));

  const [ratingRow] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)::float`,
      cnt: sql<number>`COUNT(*)::int`,
    })
    .from(reviewsTable)
    .where(and(eq(reviewsTable.targetType, "tree"), eq(reviewsTable.targetId, tree.id)));

  return {
    ...tree,
    categories,
    averageRating: ratingRow ? Math.round(ratingRow.avg * 10) / 10 : null,
    reviewCount: ratingRow?.cnt ?? 0,
  };
}

// GET /api/trees/search (must come before /:slug)
router.get("/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(20, Number(req.query.limit) || 10);
    if (!q) return res.json({ results: [] });

    const pattern = `%${q}%`;
    const trees = await db
      .select()
      .from(treesTable)
      .where(or(ilike(treesTable.commonName, pattern), ilike(treesTable.scientificName, pattern)))
      .limit(limit);

    const varieties = await db
      .select({
        id: treeVarietiesTable.id,
        varietyName: treeVarietiesTable.varietyName,
        slug: treeVarietiesTable.slug,
        treeId: treeVarietiesTable.treeId,
        treeSlug: treesTable.slug,
        treeName: treesTable.commonName,
      })
      .from(treeVarietiesTable)
      .innerJoin(treesTable, eq(treesTable.id, treeVarietiesTable.treeId))
      .where(ilike(treeVarietiesTable.varietyName, pattern))
      .limit(limit);

    const results = [
      ...trees.map((t) => ({
        type: "tree" as const,
        id: t.id,
        name: t.commonName,
        scientificName: t.scientificName,
        slug: t.slug,
        treeSlug: null,
        imageUrl: t.heroImageUrl,
      })),
      ...varieties.map((v) => ({
        type: "variety" as const,
        id: v.id,
        name: v.varietyName,
        scientificName: null,
        slug: v.slug,
        treeSlug: v.treeSlug,
        imageUrl: null,
      })),
    ];
    res.json({ results });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/trees
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);
    const offset = (page - 1) * limit;
    const search = String(req.query.search || "").trim();
    const climate = String(req.query.climate || "").trim();
    const categorySlug = String(req.query.category || "").trim();

    const conditions = [];
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(or(ilike(treesTable.commonName, pattern), ilike(treesTable.scientificName, pattern))!);
    }
    if (climate) conditions.push(ilike(treesTable.climate, `%${climate}%`));

    let query = db.select().from(treesTable).$dynamic();
    let countQuery = db.select({ total: sql<number>`count(*)::int` }).from(treesTable).$dynamic();

    if (categorySlug) {
      const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, categorySlug)).limit(1);
      if (cat) {
        const treeIdsInCat = db
          .select({ treeId: treeCategoriesTable.treeId })
          .from(treeCategoriesTable)
          .where(eq(treeCategoriesTable.categoryId, cat.id));
        conditions.push(inArray(treesTable.id, treeIdsInCat));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    if (whereClause) {
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const [{ total }] = await countQuery;
    const trees = await query.orderBy(treesTable.commonName).limit(limit).offset(offset);
    const enriched = await Promise.all(trees.map(enrichTree));

    res.json({ data: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list trees" });
  }
});

// POST /api/trees
router.post("/", ...adminAuth, async (req, res) => {
  try {
    const body = req.body as {
      commonName: string; scientificName: string; family?: string; nativeRegion?: string;
      description?: string; climate?: string; soil?: string; waterRequirement?: string;
      sunlight?: string; growthRate?: string; height?: string; lifespan?: string;
      floweringSeason?: string; fruitingSeason?: string; uses?: string; heroImageUrl?: string;
      categoryIds?: number[];
    };
    if (!body.commonName || !body.scientificName) {
      return res.status(400).json({ error: "commonName and scientificName are required" });
    }
    const slug = toSlug(body.commonName);
    const [tree] = await db.insert(treesTable).values({
      slug, commonName: body.commonName, scientificName: body.scientificName,
      family: body.family, nativeRegion: body.nativeRegion, description: body.description,
      climate: body.climate, soil: body.soil, waterRequirement: body.waterRequirement,
      sunlight: body.sunlight, growthRate: body.growthRate, height: body.height,
      lifespan: body.lifespan, floweringSeason: body.floweringSeason,
      fruitingSeason: body.fruitingSeason, uses: body.uses, heroImageUrl: body.heroImageUrl,
    }).returning();
    if (body.categoryIds?.length) {
      await db.insert(treeCategoriesTable).values(
        body.categoryIds.map((cid) => ({ treeId: tree.id, categoryId: cid }))
      );
    }
    res.status(201).json(await enrichTree(tree));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create tree" });
  }
});

// GET /api/trees/:slug
router.get("/:slug", async (req, res) => {
  try {
    const slug = String(req.params.slug);
    const [tree] = await db.select().from(treesTable).where(eq(treesTable.slug, slug)).limit(1);
    if (!tree) return res.status(404).json({ error: "Tree not found" });

    const varieties = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.treeId, tree.id));
    const images = await db.select().from(treeImagesTable).where(eq(treeImagesTable.treeId, tree.id)).orderBy(treeImagesTable.sortOrder);
    const enriched = await enrichTree(tree);
    res.json({ ...enriched, varieties, images });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get tree" });
  }
});

// PUT /api/trees/:slug
router.put("/:slug", ...adminAuth, async (req, res) => {
  try {
    const body = req.body as Partial<typeof treesTable.$inferInsert> & { categoryIds?: number[] };
    if (body.commonName) body.slug = toSlug(body.commonName);
    const { categoryIds, ...treeData } = body;
    const [tree] = await db.update(treesTable).set(treeData).where(eq(treesTable.slug, String(req.params.slug))).returning();
    if (!tree) return res.status(404).json({ error: "Tree not found" });
    if (categoryIds !== undefined) {
      await db.delete(treeCategoriesTable).where(eq(treeCategoriesTable.treeId, tree.id));
      if (categoryIds.length) {
        await db.insert(treeCategoriesTable).values(categoryIds.map((cid) => ({ treeId: tree.id, categoryId: cid })));
      }
    }
    res.json(await enrichTree(tree));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update tree" });
  }
});

// DELETE /api/trees/:slug
router.delete("/:slug", ...adminAuth, async (req, res) => {
  try {
    await db.delete(treesTable).where(eq(treesTable.slug, String(req.params.slug)));
    res.json({ message: "Tree deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete tree" });
  }
});

// GET /api/trees/:slug/varieties
router.get("/:slug/varieties", async (req, res) => {
  try {
    const [tree] = await db.select().from(treesTable).where(eq(treesTable.slug, String(req.params.slug))).limit(1);
    if (!tree) return res.status(404).json({ error: "Tree not found" });
    const varieties = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.treeId, tree.id));
    res.json(varieties);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list varieties" });
  }
});

// POST /api/trees/:slug/images
router.post("/:slug/images", ...adminAuth, async (req, res) => {
  try {
    const [tree] = await db.select().from(treesTable).where(eq(treesTable.slug, String(req.params.slug))).limit(1);
    if (!tree) return res.status(404).json({ error: "Tree not found" });
    const { imageUrl, imageType, sortOrder } = req.body as { imageUrl: string; imageType: string; sortOrder?: number };
    const [img] = await db.insert(treeImagesTable).values({
      treeId: tree.id, imageUrl, imageType: imageType || "general", sortOrder: sortOrder ?? 0
    }).returning();
    res.status(201).json(img);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add image" });
  }
});

export default router;

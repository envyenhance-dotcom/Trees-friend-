import { Router } from "express";
import { db, categoriesTable, treesTable, treeCategoriesTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { adminAuth } from "../lib/auth";
import { toSlug } from "../lib/slug";

const router = Router();

// GET /api/categories
router.get("/", async (req, res) => {
  try {
    const categories = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        treeCount: sql<number>`count(${treeCategoriesTable.treeId})::int`,
      })
      .from(categoriesTable)
      .leftJoin(treeCategoriesTable, eq(treeCategoriesTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id)
      .orderBy(categoriesTable.name);
    res.json(categories);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list categories" });
  }
});

// POST /api/categories
router.post("/", ...adminAuth, async (req, res) => {
  try {
    const { name } = req.body as { name: string };
    if (!name) return res.status(400).json({ error: "name is required" });
    const slug = toSlug(name);
    const [cat] = await db.insert(categoriesTable).values({ name, slug }).returning();
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
});

// PUT /api/categories/:id
router.put("/:id", ...adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, slug } = req.body as { name?: string; slug?: string };
    const updates: Partial<typeof categoriesTable.$inferSelect> = {};
    if (name) updates.name = name;
    if (slug) updates.slug = slug;
    else if (name) updates.slug = toSlug(name);
    const [cat] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
    if (!cat) return res.status(404).json({ error: "Category not found" });
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
});

// DELETE /api/categories/:id
router.delete("/:id", ...adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.json({ message: "Category deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
});

// GET /api/categories/:slug/trees
router.get("/:slug/trees", async (req, res) => {
  try {
    const slug = req.params.slug;
    const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, slug)).limit(1);
    if (!category) return res.status(404).json({ error: "Category not found" });
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 24);
    const offset = (page - 1) * limit;

    const baseQuery = db
      .select({ id: treesTable.id })
      .from(treesTable)
      .innerJoin(treeCategoriesTable, eq(treeCategoriesTable.treeId, treesTable.id))
      .where(eq(treeCategoriesTable.categoryId, category.id));

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(treesTable)
      .innerJoin(treeCategoriesTable, eq(treeCategoriesTable.treeId, treesTable.id))
      .where(eq(treeCategoriesTable.categoryId, category.id));

    const trees = await db
      .select()
      .from(treesTable)
      .innerJoin(treeCategoriesTable, eq(treeCategoriesTable.treeId, treesTable.id))
      .where(eq(treeCategoriesTable.categoryId, category.id))
      .limit(limit)
      .offset(offset);

    const treeList = trees.map(({ trees }) => trees);

    res.json({
      data: treeList,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list trees by category" });
  }
});

export default router;

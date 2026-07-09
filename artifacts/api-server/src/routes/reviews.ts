import { Router } from "express";
import { db, reviewsTable, profilesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

// GET /api/reviews/stats
router.get("/stats", async (req, res) => {
  try {
    const targetType = req.query.targetType as string;
    const targetId = Number(req.query.targetId);
    if (!targetType || !targetId) return res.status(400).json({ error: "targetType and targetId required" });

    const where = and(eq(reviewsTable.targetType, targetType), eq(reviewsTable.targetId, targetId));
    const [stats] = await db
      .select({ avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)::float`, cnt: sql<number>`count(*)::int` })
      .from(reviewsTable)
      .where(where);

    const dist = await db
      .select({ rating: reviewsTable.rating, cnt: sql<number>`count(*)::int` })
      .from(reviewsTable)
      .where(where)
      .groupBy(reviewsTable.rating);

    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const d of dist) distribution[String(d.rating)] = d.cnt;

    res.json({
      averageRating: stats ? Math.round(stats.avg * 10) / 10 : null,
      totalReviews: stats?.cnt ?? 0,
      distribution,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

// GET /api/reviews
router.get("/", async (req, res) => {
  try {
    const targetType = req.query.targetType as string;
    const targetId = Number(req.query.targetId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    if (!targetType || !targetId) return res.status(400).json({ error: "targetType and targetId required" });

    const where = and(eq(reviewsTable.targetType, targetType), eq(reviewsTable.targetId, targetId));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(reviewsTable).where(where);
    const reviews = await db.select().from(reviewsTable).where(where).orderBy(desc(reviewsTable.createdAt)).limit(limit).offset(offset);

    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const [reviewer] = await db.select().from(profilesTable).where(eq(profilesTable.id, r.reviewerId)).limit(1);
        return { ...r, reviewer: reviewer ?? null };
      })
    );

    const [stats] = await db
      .select({ avg: sql<number>`COALESCE(AVG(${reviewsTable.rating}), 0)::float`, cnt: sql<number>`count(*)::int` })
      .from(reviewsTable)
      .where(where);
    const dist = await db.select({ rating: reviewsTable.rating, cnt: sql<number>`count(*)::int` }).from(reviewsTable).where(where).groupBy(reviewsTable.rating);
    const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    for (const d of dist) distribution[String(d.rating)] = d.cnt;

    res.json({
      data: enriched,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      stats: { averageRating: stats ? Math.round(stats.avg * 10) / 10 : null, totalReviews: stats?.cnt ?? 0, distribution },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list reviews" });
  }
});

// POST /api/reviews
router.post("/", ...auth, async (req: AuthRequest, res) => {
  try {
    const { targetType, targetId, rating, comment } = req.body as {
      targetType: string; targetId: number; rating: number; comment?: string;
    };
    if (!targetType || !targetId || !rating) return res.status(400).json({ error: "targetType, targetId, and rating required" });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: "Rating must be 1-5" });

    // Check if already reviewed
    const existing = await db.select().from(reviewsTable).where(and(
      eq(reviewsTable.reviewerId, req.profileId!),
      eq(reviewsTable.targetType, targetType),
      eq(reviewsTable.targetId, targetId)
    )).limit(1);
    if (existing.length > 0) {
      const [r] = await db.update(reviewsTable).set({ rating, comment }).where(eq(reviewsTable.id, existing[0].id)).returning();
      return res.status(201).json(r);
    }

    const [review] = await db.insert(reviewsTable).values({
      reviewerId: req.profileId!, targetType, targetId, rating, comment
    }).returning();
    res.status(201).json(review);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;

import { Router } from "express";
import { db, varietyRequestsTable, treesTable, profilesTable, treeVarietiesTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { sellerAuth, adminAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { toSlug } from "../lib/slug";

const router = Router();

async function enrichRequest(r: typeof varietyRequestsTable.$inferSelect) {
  const [tree] = await db.select().from(treesTable).where(eq(treesTable.id, r.treeId)).limit(1);
  const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, r.sellerId)).limit(1);
  return { ...r, tree: tree ?? null, seller: seller ?? null };
}

// GET /api/variety-requests
router.get("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string | undefined;

    const isAdmin = req.role === "admin";
    const baseWhere = isAdmin
      ? status ? eq(varietyRequestsTable.status, status) : sql`true`
      : status
        ? and(eq(varietyRequestsTable.sellerId, req.profileId!), eq(varietyRequestsTable.status, status))
        : eq(varietyRequestsTable.sellerId, req.profileId!);

    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(varietyRequestsTable).where(baseWhere);
    const requests = await db.select().from(varietyRequestsTable).where(baseWhere).orderBy(desc(varietyRequestsTable.createdAt)).limit(limit).offset(offset);
    res.json({ data: await Promise.all(requests.map(enrichRequest)), meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list requests" });
  }
});

// POST /api/variety-requests
router.post("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const { treeId, requestedVarietyName, notes } = req.body as { treeId: number; requestedVarietyName: string; notes?: string };
    if (!treeId || !requestedVarietyName) return res.status(400).json({ error: "treeId and requestedVarietyName required" });
    const [r] = await db.insert(varietyRequestsTable).values({ sellerId: req.profileId!, treeId, requestedVarietyName, notes }).returning();
    res.status(201).json(await enrichRequest(r));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

// POST /api/variety-requests/:id/approve
router.post("/:id/approve", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [vr] = await db.select().from(varietyRequestsTable).where(eq(varietyRequestsTable.id, id)).limit(1);
    if (!vr) return res.status(404).json({ error: "Request not found" });

    const { varietyName, description } = req.body as { varietyName: string; description?: string };
    if (!varietyName) return res.status(400).json({ error: "varietyName required" });

    // Create the variety
    const [tree] = await db.select().from(treesTable).where(eq(treesTable.id, vr.treeId)).limit(1);
    if (!tree) return res.status(404).json({ error: "Tree not found" });
    const slug = toSlug(`${tree.commonName}-${varietyName}`);
    await db.insert(treeVarietiesTable).values({ treeId: vr.treeId, varietyName, slug, description }).onConflictDoNothing();

    const [updated] = await db.update(varietyRequestsTable).set({ status: "approved" }).where(eq(varietyRequestsTable.id, id)).returning();
    res.json(await enrichRequest(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to approve request" });
  }
});

// POST /api/variety-requests/:id/reject
router.post("/:id/reject", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body as { reason?: string };
    const [updated] = await db.update(varietyRequestsTable).set({ status: "rejected", rejectionReason: reason ?? null }).where(eq(varietyRequestsTable.id, Number(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "Request not found" });
    res.json(await enrichRequest(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

export default router;

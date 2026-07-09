import { Router } from "express";
import { db, courierIntegrationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sellerAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { encrypt, decrypt, maskKey } from "../lib/encryption";
import { getCourierAdapter } from "../lib/couriers/index";

const router = Router();

function safeMask(row: typeof courierIntegrationsTable.$inferSelect) {
  return {
    ...row,
    apiKeyMasked: maskKey(row.apiKeyEncrypted.split(":").at(-1) ?? row.apiKeyEncrypted),
    // Never return raw encrypted values to frontend
    apiKeyEncrypted: undefined,
    apiSecretEncrypted: undefined,
  };
}

// GET /api/couriers
router.get("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const integrations = await db.select().from(courierIntegrationsTable).where(eq(courierIntegrationsTable.sellerId, req.profileId!));
    res.json(integrations.map(safeMask));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to list courier integrations" });
  }
});

// POST /api/couriers
router.post("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const { courierName, apiKey, apiSecret, merchantId, isDefault } = req.body as {
      courierName: string; apiKey: string; apiSecret?: string; merchantId?: string; isDefault?: boolean;
    };
    if (!courierName || !apiKey) return res.status(400).json({ error: "courierName and apiKey required" });

    // If setting as default, unset others
    if (isDefault) {
      await db.update(courierIntegrationsTable).set({ isDefault: false }).where(eq(courierIntegrationsTable.sellerId, req.profileId!));
    }

    const [integration] = await db.insert(courierIntegrationsTable).values({
      sellerId: req.profileId!,
      courierName,
      apiKeyEncrypted: encrypt(apiKey),
      apiSecretEncrypted: apiSecret ? encrypt(apiSecret) : null,
      merchantId,
      isActive: true,
      isDefault: isDefault ?? false,
    }).returning();

    res.status(201).json(safeMask(integration));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to add courier integration" });
  }
});

// PUT /api/couriers/:id
router.put("/:id", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { isActive, isDefault } = req.body as { isActive?: boolean; isDefault?: boolean };
    const [existing] = await db.select().from(courierIntegrationsTable).where(and(eq(courierIntegrationsTable.id, id), eq(courierIntegrationsTable.sellerId, req.profileId!))).limit(1);
    if (!existing) return res.status(404).json({ error: "Not found" });

    if (isDefault) {
      await db.update(courierIntegrationsTable).set({ isDefault: false }).where(eq(courierIntegrationsTable.sellerId, req.profileId!));
    }

    const updates: Record<string, unknown> = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    const [integration] = await db.update(courierIntegrationsTable).set(updates).where(eq(courierIntegrationsTable.id, id)).returning();
    res.json(safeMask(integration));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update courier integration" });
  }
});

// DELETE /api/couriers/:id
router.delete("/:id", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    await db.delete(courierIntegrationsTable).where(and(eq(courierIntegrationsTable.id, Number(req.params.id)), eq(courierIntegrationsTable.sellerId, req.profileId!)));
    res.json({ message: "Courier integration removed" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to remove courier integration" });
  }
});

// POST /api/couriers/:id/test
router.post("/:id/test", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [integration] = await db.select().from(courierIntegrationsTable).where(and(eq(courierIntegrationsTable.id, id), eq(courierIntegrationsTable.sellerId, req.profileId!))).limit(1);
    if (!integration) return res.status(404).json({ error: "Not found" });

    const adapter = getCourierAdapter(integration.courierName);
    const credentials = {
      apiKey: decrypt(integration.apiKeyEncrypted),
      apiSecret: integration.apiSecretEncrypted ? decrypt(integration.apiSecretEncrypted) : null,
      merchantId: integration.merchantId,
    };
    const result = await adapter.testConnection(credentials);
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to test connection" });
  }
});

export default router;

import { Router } from "express";
import { db, shipmentsTable, ordersTable, courierIntegrationsTable, listingsTable, profilesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { sellerAuth, auth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { getCourierAdapter } from "../lib/couriers/index";
import { decrypt } from "../lib/encryption";

const router = Router();

// GET /api/shipments/order/:orderId
router.get("/order/:orderId", ...auth, async (req: AuthRequest, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (req.role !== "admin" && order.buyerId !== req.profileId && order.sellerId !== req.profileId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [shipment] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.orderId, orderId)).limit(1);
    if (!shipment) return res.json(null);

    let liveStatus = null;
    let statusHistory: Array<{ status: string; timestamp: string; note?: string }> = [];

    if (shipment.courierIntegrationId && shipment.courierTrackingId) {
      try {
        const [integration] = await db.select().from(courierIntegrationsTable).where(eq(courierIntegrationsTable.id, shipment.courierIntegrationId)).limit(1);
        if (integration) {
          const adapter = getCourierAdapter(integration.courierName);
          const creds = {
            apiKey: decrypt(integration.apiKeyEncrypted),
            apiSecret: integration.apiSecretEncrypted ? decrypt(integration.apiSecretEncrypted) : null,
            merchantId: integration.merchantId,
          };
          const tracking = await adapter.getTrackingStatus(shipment.courierTrackingId, creds);
          liveStatus = tracking.status;
          statusHistory = tracking.statusHistory;
        }
      } catch {
        // Tracking fetch failed — return stored status
      }
    }

    res.json({ ...shipment, liveStatus, statusHistory });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get shipment" });
  }
});

// POST /api/shipments
router.post("/", ...sellerAuth, async (req: AuthRequest, res) => {
  try {
    const { orderId, courierIntegrationId } = req.body as { orderId: number; courierIntegrationId: number };
    if (!orderId || !courierIntegrationId) return res.status(400).json({ error: "orderId and courierIntegrationId required" });

    const [order] = await db.select().from(ordersTable).where(and(eq(ordersTable.id, orderId), eq(ordersTable.sellerId, req.profileId!))).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found or not yours" });

    const [integration] = await db.select().from(courierIntegrationsTable).where(and(eq(courierIntegrationsTable.id, courierIntegrationId), eq(courierIntegrationsTable.sellerId, req.profileId!))).limit(1);
    if (!integration) return res.status(404).json({ error: "Courier integration not found" });

    const adapter = getCourierAdapter(integration.courierName);
    const creds = {
      apiKey: decrypt(integration.apiKeyEncrypted),
      apiSecret: integration.apiSecretEncrypted ? decrypt(integration.apiSecretEncrypted) : null,
      merchantId: integration.merchantId,
    };

    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, order.listingId)).limit(1);
    const [buyer] = await db.select().from(profilesTable).where(eq(profilesTable.id, order.buyerId)).limit(1);
    const [seller] = await db.select().from(profilesTable).where(eq(profilesTable.id, order.sellerId)).limit(1);

    const result = await adapter.createShipment({
      orderId: order.id,
      sellerName: seller?.displayName ?? "Seller",
      sellerAddress: listing?.location ?? "Bangladesh",
      buyerName: buyer?.displayName ?? "Buyer",
      buyerPhone: "",
      buyerAddress: "",
      weightKg: 1,
      amountToBePaid: 0,
    }, creds);

    const [shipment] = await db.insert(shipmentsTable).values({
      orderId,
      sellerId: req.profileId!,
      courierIntegrationId,
      courierTrackingId: result.trackingId,
      status: "pending",
      trackingUrl: result.trackingUrl ?? null,
      lastUpdated: new Date(),
    }).returning();

    // Update order status
    await db.update(ordersTable).set({ status: "shipped" }).where(eq(ordersTable.id, orderId));

    res.status(201).json(shipment);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create shipment" });
  }
});

export default router;

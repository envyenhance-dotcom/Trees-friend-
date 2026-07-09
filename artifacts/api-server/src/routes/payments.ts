import { Router } from "express";
import { db, cartItemsTable, listingsTable, ordersTable, paymentsTable, pendingPaymentsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { auth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { createPayment, executePayment } from "../lib/bkash";
import { logger } from "../lib/logger";

const router = Router();

/**
 * Shared, idempotent order-creation helper.
 *
 * Guards:
 *  1. Ownership — buyerId on the pending row must match the supplied buyerId.
 *  2. Idempotency — atomically transitions status pending→processing→completed;
 *     returns early with existing orderIds when already completed or processing.
 *
 * The status column acts as an optimistic lock:
 *   - Only rows in status "pending" are updated to "processing" in the same
 *     UPDATE…WHERE clause, preventing concurrent double-finalization.
 */
async function finalizePayment(
  paymentID: string,
  trxID: string,
  callerBuyerId: number | undefined, // undefined only in callback path (no session)
): Promise<{ orderIds: number[]; alreadyCompleted: boolean }> {

  // 1. Load pending payment
  const [pending] = await db
    .select()
    .from(pendingPaymentsTable)
    .where(eq(pendingPaymentsTable.bkashPaymentId, paymentID))
    .limit(1);

  if (!pending) throw Object.assign(new Error("Pending payment not found"), { status: 404 });

  // 2. Ownership check (only when the caller has a session — execute path)
  if (callerBuyerId !== undefined && pending.buyerId !== callerBuyerId) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  // 3. Idempotency: already done → return without touching anything
  if (pending.status === "completed") {
    return { orderIds: [], alreadyCompleted: true };
  }

  // 4. Atomic transition pending→processing (prevents concurrent double-runs)
  const transitioned = await db
    .update(pendingPaymentsTable)
    .set({ status: "processing" })
    .where(
      eq(pendingPaymentsTable.bkashPaymentId, paymentID),
      // Only advance from "pending" — concurrent call that already set "processing" loses here
    )
    .returning();

  if (transitioned.length === 0 || transitioned[0].status !== "processing") {
    // Another request is already processing this payment
    return { orderIds: [], alreadyCompleted: true };
  }

  // 5. Create orders
  const items = await db
    .select()
    .from(cartItemsTable)
    .where(inArray(cartItemsTable.id, pending.cartItemIds));

  const orderIds: number[] = [];

  for (const item of items) {
    const [listing] = await db
      .select()
      .from(listingsTable)
      .where(eq(listingsTable.id, item.listingId))
      .limit(1);
    if (!listing) continue;

    const lineTotal = String(Number(listing.price) * item.quantity);

    const [order] = await db
      .insert(ordersTable)
      .values({
        buyerId: pending.buyerId,
        sellerId: listing.sellerId,
        listingId: listing.id,
        quantity: item.quantity,
        totalPrice: lineTotal,
        currency: listing.currency,
        status: "paid",
        paymentStatus: "paid",
      })
      .returning();

    orderIds.push(order.id);

    await db.insert(paymentsTable).values({
      orderId: order.id,
      bkashPaymentId: paymentID,
      bkashTrxId: trxID,
      amount: lineTotal,
      status: "paid",
    });

    // Reduce stock
    const newQty = Math.max(0, listing.quantity - item.quantity);
    await db
      .update(listingsTable)
      .set({ quantity: newQty })
      .where(eq(listingsTable.id, listing.id));
  }

  // 6. Clear cart and mark completed
  await db.delete(cartItemsTable).where(inArray(cartItemsTable.id, pending.cartItemIds));
  await db
    .update(pendingPaymentsTable)
    .set({ status: "completed" })
    .where(eq(pendingPaymentsTable.bkashPaymentId, paymentID));

  return { orderIds, alreadyCompleted: false };
}

// POST /api/payments/bkash/create
router.post("/bkash/create", ...auth, async (req: AuthRequest, res) => {
  try {
    const { cartItemIds } = req.body as { cartItemIds: number[] };
    if (!cartItemIds?.length) return res.status(400).json({ error: "cartItemIds required" });

    const items = await db
      .select()
      .from(cartItemsTable)
      .where(inArray(cartItemsTable.id, cartItemIds));

    if (items.length === 0) return res.status(400).json({ error: "No valid cart items" });

    // Ownership — all items must belong to this buyer
    if (items.some((i) => i.buyerId !== req.profileId)) {
      return res.status(403).json({ error: "Unauthorized cart items" });
    }

    let total = 0;
    for (const item of items) {
      const [listing] = await db
        .select()
        .from(listingsTable)
        .where(eq(listingsTable.id, item.listingId))
        .limit(1);
      if (!listing || listing.status !== "approved") {
        return res.status(400).json({ error: `Listing ${item.listingId} is not available` });
      }
      total += Number(listing.price) * item.quantity;
    }

    const orderId = `ORDER-${req.profileId}-${Date.now()}`;
    const payment = await createPayment(total, orderId);

    await db.insert(pendingPaymentsTable).values({
      buyerId: req.profileId!,
      bkashPaymentId: payment.paymentID,
      cartItemIds,
      totalAmount: String(total),
    });

    res.json(payment);
  } catch (err: unknown) {
    req.log.error(err);
    const message = err instanceof Error ? err.message : "Failed to create payment";
    res.status(500).json({ error: message });
  }
});

// POST /api/payments/bkash/execute — buyer-initiated after redirect back from bKash
router.post("/bkash/execute", ...auth, async (req: AuthRequest, res) => {
  try {
    const { paymentID } = req.body as { paymentID: string };
    if (!paymentID) return res.status(400).json({ error: "paymentID required" });

    const result = await executePayment(paymentID);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        paymentID,
        message: result.statusMessage || "Payment failed",
        orderIds: [],
      });
    }

    const { orderIds, alreadyCompleted } = await finalizePayment(paymentID, result.trxID!, req.profileId);

    res.json({
      success: true,
      paymentID,
      trxID: result.trxID,
      message: alreadyCompleted ? "Payment already processed" : "Payment successful",
      orderIds,
    });
  } catch (err: unknown) {
    req.log.error(err);
    const e = err as { status?: number; message?: string };
    const status = e.status ?? 500;
    const message = e.message ?? "Failed to execute payment";
    res.status(status).json({ error: message });
  }
});

// GET /api/payments/bkash/callback — bKash server-side redirect after payment
router.get("/bkash/callback", async (req, res) => {
  const { paymentID, status } = req.query as { paymentID?: string; status?: string };
  const frontendBase =
    process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN || "localhost"}`;

  if (status === "cancel" || status === "failure") {
    return res.redirect(`${frontendBase}/checkout?payment=failed&paymentID=${paymentID}`);
  }

  if (!paymentID) {
    return res.redirect(`${frontendBase}/checkout?payment=error`);
  }

  try {
    const result = await executePayment(paymentID);
    if (!result.success) {
      return res.redirect(`${frontendBase}/checkout?payment=failed&paymentID=${paymentID}`);
    }

    // callerBuyerId is undefined — callback has no session; ownership enforced by pending row
    const { orderIds } = await finalizePayment(paymentID, result.trxID!, undefined);

    res.redirect(`${frontendBase}/orders?payment=success&orderIds=${orderIds.join(",")}`);
  } catch (err) {
    logger.error(err);
    res.redirect(`${frontendBase}/checkout?payment=error`);
  }
});

export default router;

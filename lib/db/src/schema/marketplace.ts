import { pgTable, serial, text, integer, boolean, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { profilesTable } from "./profiles";
import { treeVarietiesTable } from "./trees";

// Listings
export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  varietyId: integer("variety_id").notNull().references(() => treeVarietiesTable.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BDT"),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull().default("per plant"),
  location: text("location"),
  deliveryAvailable: boolean("delivery_available").notNull().default(false),
  deliveryNotes: text("delivery_notes"),
  status: text("status").notNull().default("pending"), // pending|approved|rejected
  rejectionReason: text("rejection_reason"),
  images: json("images").$type<string[]>().notNull().default([]),
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cart Items
export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => listingsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Orders
export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => profilesTable.id),
  sellerId: integer("seller_id").notNull().references(() => profilesTable.id),
  listingId: integer("listing_id").notNull().references(() => listingsTable.id),
  quantity: integer("quantity").notNull(),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("BDT"),
  status: text("status").notNull().default("pending_payment"), // pending_payment|paid|processing|shipped|delivered|cancelled|refunded
  paymentStatus: text("payment_status").notNull().default("pending"), // pending|paid|failed|refunded
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payments
export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  bkashPaymentId: text("bkash_payment_id"),
  bkashTrxId: text("bkash_trx_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending|paid|failed|refunded
  pendingCartItemIds: json("pending_cart_item_ids").$type<number[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reviews
export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  reviewerId: integer("reviewer_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(), // tree|variety|seller
  targetId: integer("target_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Wishlist
export const wishlistItemsTable = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").notNull().references(() => listingsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Variety Requests
export const varietyRequestsTable = pgTable("variety_requests", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  treeId: integer("tree_id").notNull(),
  requestedVarietyName: text("requested_variety_name").notNull(),
  notes: text("notes"),
  status: text("status").notNull().default("pending"), // pending|approved|rejected
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Courier Integrations
export const courierIntegrationsTable = pgTable("courier_integrations", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  courierName: text("courier_name").notNull(), // Pathao|Steadfast|RedX|Sundarban|Other
  apiKeyEncrypted: text("api_key_encrypted").notNull(),
  apiSecretEncrypted: text("api_secret_encrypted"),
  merchantId: text("merchant_id"),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shipments
export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  sellerId: integer("seller_id").notNull().references(() => profilesTable.id),
  courierIntegrationId: integer("courier_integration_id").references(() => courierIntegrationsTable.id),
  courierTrackingId: text("courier_tracking_id"),
  status: text("status").notNull().default("pending"), // pending|picked_up|in_transit|delivered|failed
  lastUpdated: timestamp("last_updated"),
  trackingUrl: text("tracking_url"),
});

// App Settings (for API keys entered by admin)
export const appSettingsTable = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  isSecret: boolean("is_secret").notNull().default(false),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Pending bKash payments (cart -> order mapping before payment completes)
export const pendingPaymentsTable = pgTable("pending_payments", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => profilesTable.id),
  bkashPaymentId: text("bkash_payment_id").notNull().unique(),
  cartItemIds: json("cart_item_ids").$type<number[]>().notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const listingsRelations = relations(listingsTable, ({ one }) => ({
  seller: one(profilesTable, { fields: [listingsTable.sellerId], references: [profilesTable.id] }),
  variety: one(treeVarietiesTable, { fields: [listingsTable.varietyId], references: [treeVarietiesTable.id] }),
}));

export const ordersRelations = relations(ordersTable, ({ one }) => ({
  buyer: one(profilesTable, { fields: [ordersTable.buyerId], references: [profilesTable.id], relationName: "buyer" }),
  seller: one(profilesTable, { fields: [ordersTable.sellerId], references: [profilesTable.id], relationName: "seller" }),
  listing: one(listingsTable, { fields: [ordersTable.listingId], references: [listingsTable.id] }),
}));

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, viewCount: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;

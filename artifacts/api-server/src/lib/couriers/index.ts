/**
 * Courier adapter interface.
 * Each courier adapter implements this interface.
 * To add a new courier: create a new file in this directory and implement CourierAdapter.
 * The UI, storage, and shipment logic does not change — only this adapter file.
 */

export interface ShipmentDetails {
  orderId: number;
  sellerName: string;
  sellerPhone?: string;
  sellerAddress: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  weightKg: number;
  amountToBePaid: number; // COD amount
  notes?: string;
}

export interface TrackingStatus {
  status: string;
  currentLocation?: string;
  lastUpdated: string;
  trackingUrl?: string;
  statusHistory: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
}

export interface CourierAdapter {
  name: string;
  /** Create a shipment and return the tracking ID */
  createShipment(details: ShipmentDetails, credentials: CourierCredentials): Promise<{ trackingId: string; trackingUrl?: string }>;
  /** Get tracking status by tracking ID */
  getTrackingStatus(trackingId: string, credentials: CourierCredentials): Promise<TrackingStatus>;
  /** Cancel a shipment */
  cancelShipment(trackingId: string, credentials: CourierCredentials): Promise<boolean>;
  /** Test the connection with given credentials */
  testConnection(credentials: CourierCredentials): Promise<{ success: boolean; message: string }>;
}

export interface CourierCredentials {
  apiKey: string;
  apiSecret?: string | null;
  merchantId?: string | null;
}

// Import adapters
import { pathaoCourier } from "./pathao";
import { steadfastCourier } from "./steadfast";
import { redxCourier } from "./redx";
import { sundarbanCourier } from "./sundarban";

export const COURIER_ADAPTERS: Record<string, CourierAdapter> = {
  Pathao: pathaoCourier,
  Steadfast: steadfastCourier,
  RedX: redxCourier,
  Sundarban: sundarbanCourier,
};

export function getCourierAdapter(name: string): CourierAdapter {
  const adapter = COURIER_ADAPTERS[name];
  if (!adapter) throw new Error(`Unknown courier: ${name}`);
  return adapter;
}

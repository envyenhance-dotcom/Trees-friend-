/**
 * Pathao Courier Adapter
 *
 * TODO: Replace mock implementations with real Pathao API calls.
 * Pathao API docs: https://developers.pathao.com/
 *
 * Real auth: POST https://api-hermes.pathao.com/aladdin/api/v1/clients/issue-token
 * Real create: POST https://api-hermes.pathao.com/aladdin/api/v1/orders/
 * Real tracking: GET https://api-hermes.pathao.com/aladdin/api/v1/orders/:consignment_id
 */

import type { CourierAdapter, CourierCredentials, ShipmentDetails, TrackingStatus } from "./index";

export const pathaoCourier: CourierAdapter = {
  name: "Pathao",

  async testConnection(creds: CourierCredentials): Promise<{ success: boolean; message: string }> {
    // TODO: Call POST https://api-hermes.pathao.com/aladdin/api/v1/clients/issue-token
    // with { client_id: creds.apiKey, client_secret: creds.apiSecret, username, password, grant_type: "password" }
    if (!creds.apiKey) {
      return { success: false, message: "API key is required" };
    }
    // Mock: credentials present = success
    return { success: true, message: "Pathao credentials accepted (mock — real validation requires Pathao sandbox)" };
  },

  async createShipment(details: ShipmentDetails, creds: CourierCredentials): Promise<{ trackingId: string; trackingUrl?: string }> {
    // TODO: Replace with real Pathao order creation API call:
    // POST https://api-hermes.pathao.com/aladdin/api/v1/orders/
    // Body: { store_id, merchant_order_id, recipient_name, recipient_phone, recipient_address, ... }
    const mockTrackingId = `PATHAO-${details.orderId}-${Date.now()}`;
    return {
      trackingId: mockTrackingId,
      trackingUrl: `https://pathao.com/tracking?id=${mockTrackingId}`,
    };
  },

  async getTrackingStatus(trackingId: string, _creds: CourierCredentials): Promise<TrackingStatus> {
    // TODO: Replace with real Pathao tracking API call:
    // GET https://api-hermes.pathao.com/aladdin/api/v1/orders/{consignment_id}
    return {
      status: "in_transit",
      currentLocation: "Dhaka Hub",
      lastUpdated: new Date().toISOString(),
      trackingUrl: `https://pathao.com/tracking?id=${trackingId}`,
      statusHistory: [
        { status: "picked_up", timestamp: new Date(Date.now() - 3600000).toISOString(), note: "Package picked up by Pathao" },
        { status: "in_transit", timestamp: new Date().toISOString(), note: "In transit to destination" },
      ],
    };
  },

  async cancelShipment(trackingId: string, _creds: CourierCredentials): Promise<boolean> {
    // TODO: Replace with real Pathao order cancellation API call
    return true;
  },
};

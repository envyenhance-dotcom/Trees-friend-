/**
 * Steadfast Courier Adapter
 *
 * TODO: Replace mock implementations with real Steadfast API calls.
 * Steadfast API docs: https://steadfast.com.bd/
 *
 * Real create: POST https://portal.steadfast.com.bd/api/v1/create_order
 * Headers: Api-Key, Secret-Key
 * Real tracking: GET https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/{tracking_code}
 */

import type { CourierAdapter, CourierCredentials, ShipmentDetails, TrackingStatus } from "./index";

export const steadfastCourier: CourierAdapter = {
  name: "Steadfast",

  async testConnection(creds: CourierCredentials): Promise<{ success: boolean; message: string }> {
    // TODO: Make a lightweight test request to Steadfast API
    if (!creds.apiKey || !creds.apiSecret) {
      return { success: false, message: "API key and API secret are required" };
    }
    return { success: true, message: "Steadfast credentials accepted (mock — real validation requires Steadfast account)" };
  },

  async createShipment(details: ShipmentDetails, _creds: CourierCredentials): Promise<{ trackingId: string; trackingUrl?: string }> {
    // TODO: POST https://portal.steadfast.com.bd/api/v1/create_order
    // Headers: { "Api-Key": creds.apiKey, "Secret-Key": creds.apiSecret }
    // Body: { invoice, recipient_name, recipient_phone, recipient_address, cod_amount, note }
    const mockTrackingId = `SF-${details.orderId}-${Date.now()}`;
    return { trackingId: mockTrackingId };
  },

  async getTrackingStatus(trackingId: string, _creds: CourierCredentials): Promise<TrackingStatus> {
    // TODO: GET https://portal.steadfast.com.bd/api/v1/status_by_trackingcode/{trackingId}
    return {
      status: "in_transit",
      lastUpdated: new Date().toISOString(),
      statusHistory: [
        { status: "pending", timestamp: new Date(Date.now() - 7200000).toISOString() },
        { status: "in_transit", timestamp: new Date().toISOString() },
      ],
    };
  },

  async cancelShipment(_trackingId: string, _creds: CourierCredentials): Promise<boolean> {
    // TODO: Steadfast cancellation endpoint
    return true;
  },
};

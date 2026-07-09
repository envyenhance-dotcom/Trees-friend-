/**
 * RedX Courier Adapter
 *
 * TODO: Replace mock implementations with real RedX API calls.
 * RedX API docs: https://redx.com.bd/
 */

import type { CourierAdapter, CourierCredentials, ShipmentDetails, TrackingStatus } from "./index";

export const redxCourier: CourierAdapter = {
  name: "RedX",

  async testConnection(creds: CourierCredentials): Promise<{ success: boolean; message: string }> {
    if (!creds.apiKey) {
      return { success: false, message: "API key is required" };
    }
    return { success: true, message: "RedX credentials accepted (mock — real validation requires RedX account)" };
  },

  async createShipment(details: ShipmentDetails, _creds: CourierCredentials): Promise<{ trackingId: string; trackingUrl?: string }> {
    // TODO: POST https://openapi.redx.com.bd/v1.0.0-beta/parcel
    const mockTrackingId = `REDX-${details.orderId}-${Date.now()}`;
    return { trackingId: mockTrackingId };
  },

  async getTrackingStatus(trackingId: string, _creds: CourierCredentials): Promise<TrackingStatus> {
    // TODO: GET https://openapi.redx.com.bd/v1.0.0-beta/parcel/info/{trackingId}
    return {
      status: "pending",
      lastUpdated: new Date().toISOString(),
      statusHistory: [
        { status: "pending", timestamp: new Date().toISOString(), note: "Parcel created" },
      ],
    };
  },

  async cancelShipment(_trackingId: string, _creds: CourierCredentials): Promise<boolean> {
    return true;
  },
};

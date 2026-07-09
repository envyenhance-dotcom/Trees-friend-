/**
 * Sundarban Courier Adapter
 *
 * TODO: Replace mock implementations with real Sundarban Courier API calls.
 */

import type { CourierAdapter, CourierCredentials, ShipmentDetails, TrackingStatus } from "./index";

export const sundarbanCourier: CourierAdapter = {
  name: "Sundarban",

  async testConnection(creds: CourierCredentials): Promise<{ success: boolean; message: string }> {
    if (!creds.apiKey) {
      return { success: false, message: "API key is required" };
    }
    return { success: true, message: "Sundarban credentials accepted (mock — real validation requires Sundarban account)" };
  },

  async createShipment(details: ShipmentDetails, _creds: CourierCredentials): Promise<{ trackingId: string; trackingUrl?: string }> {
    // TODO: Implement real Sundarban shipment creation
    const mockTrackingId = `SBC-${details.orderId}-${Date.now()}`;
    return { trackingId: mockTrackingId };
  },

  async getTrackingStatus(trackingId: string, _creds: CourierCredentials): Promise<TrackingStatus> {
    return {
      status: "pending",
      lastUpdated: new Date().toISOString(),
      statusHistory: [
        { status: "pending", timestamp: new Date().toISOString() },
      ],
    };
  },

  async cancelShipment(_trackingId: string, _creds: CourierCredentials): Promise<boolean> {
    return true;
  },
};

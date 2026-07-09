import { useListSellerOrders } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

export default function SellerOrders() {
  const { data, isLoading } = useListSellerOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Order Management</h1>
        <p className="text-muted-foreground mt-1">Fulfill orders from buyers</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qty / Total</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center">Loading...</td></tr>
                ) : data?.data.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
                ) : data?.data.map((order) => (
                  <tr key={order.id} className="border-b transition-colors">
                    <td className="p-4 align-middle font-medium">#{order.id}</td>
                    <td className="p-4 align-middle text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">
                      <div className="font-medium text-foreground">{order.listing?.variety?.tree?.commonName}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <div>{order.quantity} units</div>
                      <div className="font-medium">{formatCurrency(order.totalPrice)}</div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="capitalize">{order.status.replace('_', ' ')}</Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {/* Action buttons would go here (update status, ship, etc) */}
                      <span className="text-sm text-primary hover:underline cursor-pointer">Manage</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

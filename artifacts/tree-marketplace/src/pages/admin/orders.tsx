import { useListAllOrders } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Package } from "lucide-react";
import { Link } from "wouter";

export default function AdminOrders() {
  const { data, isLoading } = useListAllOrders({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">All Orders</h1>
        <p className="text-muted-foreground mt-1">Platform-wide order oversight</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Buyer</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Seller</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Item</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Total</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading orders...</td></tr>
                ) : data?.data.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center">No orders found</td></tr>
                ) : data?.data.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">#{order.id}</td>
                    <td className="p-4 align-middle text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">{order.buyer?.displayName || 'Unknown Buyer'}</td>
                    <td className="p-4 align-middle">
                      <Link href={`/sellers/${order.sellerId}`} className="hover:underline">{order.seller?.displayName}</Link>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-medium">{order.listing?.variety?.tree?.commonName}</div>
                      <div className="text-xs text-muted-foreground">Qty: {order.quantity}</div>
                    </td>
                    <td className="p-4 align-middle text-right font-medium">{formatCurrency(order.totalPrice)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="capitalize">{order.status.replace('_', ' ')}</Badge>
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

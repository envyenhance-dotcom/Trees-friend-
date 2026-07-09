import { useListOrders } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight } from "lucide-react";

export default function OrdersPage() {
  const { data, isLoading } = useListOrders();

  if (isLoading) return <div className="p-8"><div className="h-64 bg-muted animate-pulse rounded-xl max-w-4xl mx-auto" /></div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-serif font-bold mb-8">Order History</h1>

      {!data?.data.length ? (
        <div className="text-center py-24 bg-card border rounded-xl">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No orders yet</h3>
          <p className="text-muted-foreground">When you purchase items, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map(order => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="bg-card border rounded-xl p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center hover:shadow-md transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded shrink-0 overflow-hidden">
                    {order.listing?.images?.[0] ? <img src={order.listing.images[0]} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {order.listing?.variety?.tree?.commonName}
                    </h4>
                    <p className="text-sm text-muted-foreground">Order #{order.id} • {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground mt-1">From: {order.seller?.displayName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(order.totalPrice)}</div>
                    <div className="text-sm text-muted-foreground">Qty: {order.quantity}</div>
                  </div>
                  
                  <Badge variant={
                    order.status === 'delivered' ? 'default' : 
                    order.status === 'cancelled' ? 'destructive' : 
                    'secondary'
                  } className="capitalize">
                    {order.status.replace('_', ' ')}
                  </Badge>

                  <ChevronRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

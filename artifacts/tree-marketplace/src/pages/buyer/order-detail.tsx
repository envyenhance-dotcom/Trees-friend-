import { useGetOrder } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Package, CreditCard, ChevronLeft } from "lucide-react";

export default function OrderDetailPage({ id }: { id: number }) {
  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: !!id } });

  if (isLoading) return <div className="p-8 animate-pulse"><div className="h-96 max-w-3xl mx-auto bg-muted rounded-xl" /></div>;
  if (!order) return <div className="p-8 text-center">Order not found</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link href="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to Orders
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Order #{order.id}</h1>
          <p className="text-muted-foreground mt-1">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'} className="text-sm capitalize px-3 py-1">
          {order.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Item Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-6">
                <div className="w-24 h-24 bg-muted rounded shrink-0 overflow-hidden border">
                  {order.listing?.images?.[0] ? <img src={order.listing.images[0]} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg"><Link href={`/trees/${order.listing?.variety?.tree?.slug}`} className="hover:underline">{order.listing?.variety?.tree?.commonName}</Link></h3>
                  <p className="text-muted-foreground text-sm mb-4">Variety: {order.listing?.variety?.varietyName}</p>
                  
                  <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <div><span className="text-muted-foreground text-sm mr-2">Quantity:</span><span className="font-medium">{order.quantity}</span></div>
                    <div><span className="text-muted-foreground text-sm mr-2">Price:</span><span className="font-medium">{formatCurrency(order.listing?.price || 0)}</span></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Widget */}
          <Card>
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Shipment Tracking</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!order.shipment ? (
                <div className="text-muted-foreground text-sm text-center py-4">Shipment details not available yet.</div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center text-sm border-b pb-4">
                    <div>
                      <span className="text-muted-foreground">Courier:</span> <span className="font-medium">{order.shipment.courierName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tracking ID:</span> <span className="font-mono bg-muted px-2 py-1 rounded ml-2">{order.shipment.trackingId}</span>
                    </div>
                  </div>

                  <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-4 mt-8">
                    {['pending', 'picked_up', 'in_transit', 'delivered'].map((step, index) => {
                      const statusMap: Record<string, number> = { 'pending': 0, 'picked_up': 1, 'in_transit': 2, 'delivered': 3 };
                      const currentStatusIndex = statusMap[order.shipment?.status || 'pending'] || 0;
                      const isComplete = index <= currentStatusIndex;
                      const isActive = index === currentStatusIndex;
                      
                      return (
                        <div key={step} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 bg-background ${isComplete ? 'border-primary bg-primary' : 'border-muted'}`} />
                          <p className={`font-medium capitalize ${isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {step.replace('_', ' ')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Items Total</span><span>{formatCurrency(order.totalPrice)}</span></div>
              <div className="border-t pt-4 flex justify-between font-bold text-base"><span>Total Paid</span><span>{formatCurrency(order.totalPrice)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 border-b pb-4">
              <CardTitle className="text-lg">Seller Info</CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-sm">
              <p className="font-medium text-foreground mb-2">{order.seller?.displayName}</p>
              <Link href={`/sellers/${order.sellerId}`} className="text-primary hover:underline">View Store</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

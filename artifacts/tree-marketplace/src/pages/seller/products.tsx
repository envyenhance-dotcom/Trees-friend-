import { useListMyListings } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package } from "lucide-react";
import { Link } from "wouter";

export default function SellerProducts() {
  const { data, isLoading } = useListMyListings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground mt-1">Manage your active marketplace listings</p>
        </div>
        <Button asChild className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/seller/products/new"><Plus className="h-4 w-4 mr-2" /> List New Plant</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12">Img</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Inventory</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading listings...</td></tr>
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground">No listings yet</h3>
                      <p className="text-muted-foreground mb-4">Start selling by adding your first plant variety.</p>
                      <Button variant="outline" asChild><Link href="/seller/products/new">Create Listing</Link></Button>
                    </td>
                  </tr>
                ) : data?.data.map((listing) => (
                  <tr key={listing.id} className="border-b transition-colors">
                    <td className="p-2 align-middle">
                      <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                        {listing.images?.[0] && <img src={listing.images[0]} className="h-full w-full object-cover" />}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-bold text-foreground">{listing.variety?.tree?.commonName}</div>
                      <div className="text-xs text-muted-foreground">Var: {listing.variety?.varietyName}</div>
                    </td>
                    <td className="p-4 align-middle font-medium">
                      {formatCurrency(listing.price)} / {listing.unit}
                    </td>
                    <td className="p-4 align-middle">
                      {listing.quantity}
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={listing.status === 'approved' ? 'default' : listing.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                        {listing.status}
                      </Badge>
                      {listing.status === 'rejected' && listing.rejectionReason && (
                        <p className="text-[10px] text-destructive mt-1 max-w-[150px] truncate" title={listing.rejectionReason}>
                          {listing.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <Button variant="ghost" size="sm" className="h-8">Edit</Button>
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

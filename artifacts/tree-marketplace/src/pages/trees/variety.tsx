import { useGetVariety, useListVarietyListings, useAddToCart } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Leaf, ChevronLeft, Store, ShieldCheck, MapPin } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function VarietyDetailPage({ slug, id }: { slug: string, id: number }) {
  const { data: variety, isLoading: isVarLoading } = useGetVariety(id, { query: { enabled: !!id } });
  const { data: listings, isLoading: isListingsLoading } = useListVarietyListings(id, { query: { enabled: !!id } });
  const addToCart = useAddToCart();
  const { toast } = useToast();

  if (isVarLoading) {
    return <div className="container mx-auto p-8 animate-pulse"><div className="h-64 bg-muted rounded-xl"></div></div>;
  }

  if (!variety || variety.tree?.slug !== slug) {
    return <div className="container mx-auto p-8 text-center"><h2 className="text-xl">Variety not found</h2></div>;
  }

  const handleAddToCart = (listingId: number) => {
    addToCart.mutate({ data: { listingId, quantity: 1 } }, {
      onSuccess: () => {
        toast({ title: "Added to cart", description: "Item has been added to your cart." });
      },
      onError: (err) => {
        toast({ title: "Error", description: "Could not add to cart. Please log in.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link href={`/trees/${slug}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" /> Back to {variety.tree?.commonName}
      </Link>

      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-2">{variety.varietyName}</h1>
            <p className="text-xl text-muted-foreground font-serif italic">{variety.tree?.commonName}</p>
          </div>

          <div className="prose prose-emerald max-w-none text-muted-foreground mb-8">
            <p>{variety.description || "A distinct cultivar with unique characteristics."}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {variety.taste && (
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Taste Profile</dt><dd className="font-medium">{variety.taste}</dd></div>
            )}
            {variety.origin && (
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Origin</dt><dd className="font-medium">{variety.origin}</dd></div>
            )}
            {variety.fruitSize && (
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Fruit Size</dt><dd className="font-medium">{variety.fruitSize}</dd></div>
            )}
            {variety.harvestTime && (
              <div><dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Harvest Time</dt><dd className="font-medium">{variety.harvestTime}</dd></div>
            )}
            {variety.diseaseResistance && (
              <div className="col-span-2"><dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Disease Resistance</dt><dd className="font-medium">{variety.diseaseResistance}</dd></div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 bg-muted/30 p-6 rounded-xl border border-muted">
            {variety.advantages && (
              <div>
                <h4 className="font-semibold text-emerald-700 mb-2 flex items-center gap-2"><Leaf className="h-4 w-4" /> Pros</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{variety.advantages}</p>
              </div>
            )}
            {variety.disadvantages && (
              <div>
                <h4 className="font-semibold text-amber-700 mb-2">Cons</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{variety.disadvantages}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sellers / Marketplace Section */}
        <div>
          <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" /> Purchase Plants
          </h2>

          {isListingsLoading ? (
            <div className="space-y-4"><div className="h-32 bg-muted animate-pulse rounded-xl"></div></div>
          ) : listings?.data && listings.data.length > 0 ? (
            <div className="space-y-4">
              {listings.data.map(listing => (
                <Card key={listing.id} className="overflow-hidden border-primary/20 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row">
                    {listing.images?.[0] && (
                      <div className="w-full sm:w-32 h-32 bg-muted shrink-0">
                        <img src={listing.images[0]} alt="Plant" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Link href={`/sellers/${listing.sellerId}`} className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1">
                            {listing.seller?.displayName || "Nursery"}
                            {listing.seller?.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                          </Link>
                          {listing.location && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3 mr-1" /> {listing.location}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-foreground">{formatCurrency(listing.price)}</div>
                          <div className="text-xs text-muted-foreground">per {listing.unit}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground">
                          {listing.quantity > 0 ? `${listing.quantity} available` : 'Out of stock'}
                        </Badge>
                        <Button 
                          size="sm" 
                          disabled={listing.quantity <= 0 || addToCart.isPending}
                          onClick={() => handleAddToCart(listing.id)}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted/20 border border-dashed rounded-xl">
              <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-medium text-foreground">No active listings</h3>
              <p className="text-sm text-muted-foreground mt-1">Check back later or explore other varieties.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

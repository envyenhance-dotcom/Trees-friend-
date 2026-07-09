import { useGetSellerProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Star, ShieldCheck, MapPin, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function SellerStorefrontPage({ id }: { id: number }) {
  const { data: storefront, isLoading } = useGetSellerProfile(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-muted w-full"></div>
        <div className="container mx-auto px-4 max-w-6xl -mt-16 relative z-10">
          <div className="h-32 w-32 bg-card rounded-full border-4 border-background mx-auto md:mx-0"></div>
          <div className="h-8 bg-muted w-48 mt-4"></div>
        </div>
      </div>
    );
  }

  if (!storefront) {
    return <div className="p-24 text-center">Store not found</div>;
  }

  const { profile, stats, listings } = storefront;

  return (
    <div className="min-h-screen bg-muted/10 pb-24">
      {/* Banner */}
      <div className="h-64 w-full bg-slate-800 relative">
        {profile.bannerUrl && (
          <img src={profile.bannerUrl} alt="Store banner" className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      {/* Store Header */}
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="bg-card rounded-2xl shadow-md p-6 sm:p-8 -mt-16 flex flex-col md:flex-row gap-6 md:items-end border">
          <div className="h-32 w-32 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shrink-0 mx-auto md:mx-0 -mt-20 md:-mt-24 shadow-sm relative z-20">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt={profile.displayName || "Store logo"} className="w-full h-full object-cover" />
            ) : (
              <Store className="h-12 w-12 text-muted-foreground/50" />
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-2">
              {profile.displayName || "Untitled Store"}
              {profile.isVerified && <ShieldCheck className="h-6 w-6 text-emerald-500" title="Verified Seller" />}
            </h1>
            <p className="text-muted-foreground mt-1">Joined {new Date(profile.createdAt).getFullYear()}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-center">
            <div className="bg-muted/50 px-4 py-2 rounded-lg">
              <div className="text-xl font-bold text-foreground">{stats.totalListings}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Listings</div>
            </div>
            {stats.averageRating ? (
              <div className="bg-amber-50 px-4 py-2 rounded-lg border border-amber-100">
                <div className="text-xl font-bold text-amber-700 flex items-center justify-center gap-1">
                  {stats.averageRating.toFixed(1)} <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                </div>
                <div className="text-xs text-amber-800/70 uppercase tracking-wider">{stats.reviewCount} Reviews</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="mt-12">
          <h2 className="text-2xl font-serif font-bold mb-6">Available Plants</h2>
          
          {listings.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-xl border border-dashed">
              <Store className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No active listings</h3>
              <p className="text-muted-foreground mt-1">This seller doesn't have any items for sale right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map(listing => (
                <Link key={listing.id} href={`/trees/${listing.variety?.tree?.slug}/varieties/${listing.variety?.id}`}>
                  <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-muted h-full flex flex-col cursor-pointer">
                    <div className="aspect-square overflow-hidden relative bg-muted">
                      {listing.images?.[0] ? (
                        <img 
                          src={listing.images[0]} 
                          alt="Plant"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5">
                          <Store className="h-10 w-10 text-primary/20" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {listing.variety?.tree?.commonName}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                        Var: {listing.variety?.varietyName}
                      </p>
                      
                      <div className="mt-auto flex justify-between items-end">
                        <div>
                          <div className="font-bold text-lg text-foreground">{formatCurrency(listing.price)}</div>
                          <div className="text-xs text-muted-foreground">per {listing.unit}</div>
                        </div>
                        <Badge variant="secondary" className="bg-muted font-normal">
                          {listing.quantity} left
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

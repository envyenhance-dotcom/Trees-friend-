import { useGetCart, useUpdateCartItem, useRemoveCartItem, useGetMyProfile } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Trash2, ShoppingCart, ArrowRight, Minus, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function CartPage() {
  const { data: cart, isLoading } = useGetCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const { toast } = useToast();

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateItem.mutate({ id: itemId, data: { quantity: newQuantity } });
  };

  const handleRemove = (itemId: number) => {
    removeItem.mutate({ id: itemId }, {
      onSuccess: () => toast({ description: "Item removed from cart" })
    });
  };

  if (isLoading) {
    return <div className="container mx-auto p-8 max-w-4xl animate-pulse"><div className="h-64 bg-muted rounded-xl"></div></div>;
  }

  if (!cart || cart.itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-4xl text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any plants to your cart yet.</p>
        <Button size="lg" asChild>
          <Link href="/trees">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-serif font-bold mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {cart.groups.map(group => (
            <div key={group.seller.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-muted/30 px-6 py-4 border-b flex justify-between items-center">
                <div className="font-medium flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Seller:</span>
                  <Link href={`/sellers/${group.seller.id}`} className="hover:text-primary hover:underline">
                    {group.seller.displayName}
                  </Link>
                </div>
              </div>
              
              <div className="divide-y">
                {group.items.map(item => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-6">
                    {item.listing?.images?.[0] ? (
                      <img src={item.listing.images[0]} alt="" className="w-24 h-24 object-cover rounded-md bg-muted shrink-0" />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-md shrink-0 flex items-center justify-center">
                        <Leaf className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-bold text-foreground">
                            {item.listing?.variety?.tree?.commonName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Variety: {item.listing?.variety?.varietyName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency((item.listing?.price || 0) * item.quantity)}</p>
                          <p className="text-xs text-muted-foreground">{formatCurrency(item.listing?.price || 0)} / {item.listing?.unit}</p>
                        </div>
                      </div>

                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex items-center border rounded-md">
                          <button 
                            className="p-2 hover:bg-muted text-muted-foreground disabled:opacity-50"
                            disabled={item.quantity <= 1 || updateItem.isPending}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                          <button 
                            className="p-2 hover:bg-muted text-muted-foreground disabled:opacity-50"
                            disabled={item.quantity >= (item.listing?.quantity || 1) || updateItem.isPending}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(item.id)}
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-muted/10 border-t text-right">
                <span className="text-muted-foreground text-sm mr-4">Seller Subtotal:</span>
                <span className="font-bold">{formatCurrency(group.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-card border rounded-xl p-6 sticky top-24 shadow-sm">
            <h3 className="font-serif text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items ({cart.itemCount})</span>
                <span className="font-medium">{formatCurrency(cart.total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="border-t pt-4 flex justify-between items-end">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-2xl text-foreground">{formatCurrency(cart.total)}</span>
              </div>
            </div>
            
            <Button size="lg" className="w-full" asChild>
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            
            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
              Secure checkout via bKash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Need to import Leaf
import { Leaf } from "lucide-react";

import { useGetCart, useCreateBkashPayment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

export default function CheckoutPage() {
  const { data: cart, isLoading } = useGetCart();
  const createPayment = useCreateBkashPayment();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (isLoading) return <div className="p-8 animate-pulse"><div className="h-96 max-w-2xl mx-auto bg-muted rounded-xl" /></div>;

  if (!cart || cart.itemCount === 0) {
    return <div className="text-center p-24">Cart is empty</div>;
  }

  const handleBkashPay = () => {
    setIsProcessing(true);
    // Collect all cart item IDs
    const itemIds = cart.groups.flatMap(g => g.items.map(i => i.id));
    
    createPayment.mutate({ data: { cartItemIds: itemIds } }, {
      onSuccess: (res) => {
        // Redirect to bKash URL
        window.location.href = res.bkashURL;
      },
      onError: () => {
        setIsProcessing(false);
        toast({ title: "Payment Error", description: "Could not initialize bKash payment.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-serif font-bold mb-8 text-center">Secure Checkout</h1>
      
      <Card className="mb-8 shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {cart.groups.map(g => (
              <div key={g.seller.id} className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-4">From: {g.seller.displayName}</p>
                <div className="space-y-4">
                  {g.items.map(item => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">{item.quantity}x</span>
                        <span className="font-medium text-foreground">{item.listing?.variety?.tree?.commonName}</span>
                      </div>
                      <span>{formatCurrency((item.listing?.price || 0) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-muted/10 flex justify-between items-center border-t">
            <span className="font-bold text-lg">Total Amount</span>
            <span className="font-bold text-2xl text-primary">{formatCurrency(cart.total)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-pink-200 shadow-sm overflow-hidden">
        <div className="bg-[#e2136e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-bold">Pay with bKash</span>
          </div>
        </div>
        <CardContent className="p-6 flex flex-col items-center text-center space-y-6">
          <p className="text-muted-foreground max-w-sm">
            You will be redirected to the secure bKash payment gateway to complete your purchase.
          </p>
          <Button 
            size="lg" 
            className="w-full max-w-sm bg-[#e2136e] hover:bg-[#e2136e]/90 text-white h-14 text-lg font-bold"
            onClick={handleBkashPay}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
            {isProcessing ? "Processing..." : `Pay ${formatCurrency(cart.total)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

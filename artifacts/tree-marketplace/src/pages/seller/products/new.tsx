import { useState } from "react";
import { useSearchTrees, useCreateListing } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight, TreePine, Leaf, CheckCircle2 } from "lucide-react";

export default function SellerProductsNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createListing = useCreateListing();
  
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form State
  const [selectedTreeId, setSelectedTreeId] = useState<number | null>(null);
  const [selectedVarietyId, setSelectedVarietyId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("plant");
  const [locationStr, setLocationStr] = useState("");
  const [delivery, setDelivery] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const { data: searchResults } = useSearchTrees(
    { q: searchQuery, limit: 10 },
    { query: { enabled: searchQuery.length > 1 } }
  );

  const handleSubmit = () => {
    if (!selectedVarietyId || !price || !quantity) return;
    
    createListing.mutate({
      data: {
        varietyId: selectedVarietyId,
        price: Number(price),
        quantity: Number(quantity),
        unit,
        location: locationStr,
        deliveryAvailable: delivery,
        images: imageUrl ? [imageUrl] : [],
      }
    }, {
      onSuccess: () => {
        toast({ title: "Listing created", description: "Your listing is pending admin approval." });
        setLocation("/seller/products");
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Create Listing</h1>
        <p className="text-muted-foreground mt-1">Add a new plant variety to your store</p>
      </div>

      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -z-10"></div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
            step >= s ? 'bg-primary text-white ring-4 ring-background' : 'bg-muted text-muted-foreground ring-4 ring-background'
          }`}>
            {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
          </div>
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-serif">1. Select Tree Species</h2>
              <Input 
                placeholder="Search encyclopedia (e.g. Mango, Oak)..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12"
              />
              
              <div className="border rounded-xl divide-y">
                {searchResults?.results.filter(r => r.type === 'tree').map(tree => (
                  <div 
                    key={tree.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedTreeId(tree.id);
                      setStep(2);
                      setSearchQuery("");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary"><TreePine className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold">{tree.name}</p>
                        <p className="text-sm text-muted-foreground italic">{tree.scientificName}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-serif">2. Select Variety</h2>
              {/* Note: In a real app we'd fetch varieties for selectedTreeId. Using search endpoint for brevity here. */}
              <Input 
                placeholder="Search cultivars/varieties..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12"
              />
              
              <div className="border rounded-xl divide-y">
                {searchResults?.results.filter(r => r.type === 'variety').map(v => (
                  <div 
                    key={v.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between"
                    onClick={() => {
                      setSelectedVarietyId(v.id);
                      setStep(3);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-emerald-100 rounded flex items-center justify-center text-emerald-600"><Leaf className="h-5 w-5" /></div>
                      <p className="font-bold">{v.name}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-serif">3. Product Details</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Price (BDT)</Label>
                  <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Inventory Quantity</Label>
                  <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="10" />
                </div>
                <div className="space-y-2">
                  <Label>Unit (e.g. plant, seeds, sapling)</Label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nursery Location</Label>
                  <Input value={locationStr} onChange={e => setLocationStr(e.target.value)} placeholder="City, Region" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div>
                  <p className="font-medium">Delivery Available</p>
                  <p className="text-sm text-muted-foreground">Can you ship this item via courier?</p>
                </div>
                <Switch checked={delivery} onCheckedChange={setDelivery} />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={() => setStep(4)} disabled={!price || !quantity}>Continue</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold font-serif">4. Images & Finish</h2>
              
              <div className="space-y-2">
                <Label>Image URL (Temporary for scaffold)</Label>
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                {imageUrl && <img src={imageUrl} alt="Preview" className="h-32 w-32 object-cover rounded mt-2" />}
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
                <strong>Note:</strong> New listings require administrator approval before appearing in the public marketplace.
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                <Button onClick={handleSubmit} disabled={createListing.isPending}>
                  {createListing.isPending ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

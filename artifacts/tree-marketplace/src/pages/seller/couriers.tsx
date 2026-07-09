import { useListCourierIntegrations, useCreateCourierIntegration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Truck, Plus, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function SellerCouriers() {
  const { data, isLoading } = useListCourierIntegrations();
  const createCourier = useCreateCourierIntegration();

  const [isAdding, setIsAdding] = useState(false);
  const [courierName, setCourierName] = useState<"Pathao" | "Steadfast" | "RedX" | "Sundarban" | "Other" | "">("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [merchantId, setMerchantId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !apiKey) return;
    
    createCourier.mutate({
      data: {
        courierName: courierName as any,
        apiKey,
        apiSecret,
        merchantId
      }
    }, {
      onSuccess: () => {
        setIsAdding(false);
        setCourierName("");
        setApiKey("");
        setApiSecret("");
        setMerchantId("");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Courier Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect your shipping providers for automated tracking</p>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} className="shrink-0 bg-primary text-white">
          <Plus className="h-4 w-4 mr-2" /> Add Courier
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">New Courier Connection</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Courier Provider</label>
                  <Select value={courierName} onValueChange={(v) => setCourierName(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pathao">Pathao</SelectItem>
                      <SelectItem value="Steadfast">Steadfast</SelectItem>
                      <SelectItem value="RedX">RedX</SelectItem>
                      <SelectItem value="Sundarban">Sundarban</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Merchant ID (if applicable)</label>
                  <Input value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="M-12345" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Secret (if applicable)</label>
                  <Input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
                <Button type="submit" disabled={!courierName || !apiKey || createCourier.isPending}>Save Connection</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="h-32 bg-muted animate-pulse rounded-xl" />
      ) : data?.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl">
          <Truck className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No couriers connected</h3>
          <p className="text-muted-foreground mt-1">Add a courier to sync tracking numbers automatically.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data?.map(courier => (
            <Card key={courier.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg leading-tight">{courier.courierName}</h4>
                      {courier.merchantId && <p className="text-xs text-muted-foreground">ID: {courier.merchantId}</p>}
                    </div>
                  </div>
                  {courier.isActive && <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>}
                </div>
                
                <div className="bg-muted p-3 rounded-md mb-4">
                  <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">API Key</p>
                  <p className="font-mono text-sm">{courier.apiKeyMasked}</p>
                </div>
                
                <div className="flex justify-between items-center border-t pt-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">Test Connection</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useListListings, useApproveListing, useRejectListing, getListListingsQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X, Store } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

export default function AdminListings() {
  const [status, setStatus] = useState<string>("pending");
  const { data, isLoading } = useListListings({ status: status === "all" ? undefined : status, limit: 50 });
  const approve = useApproveListing();
  const reject = useRejectListing();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = (id: number) => {
    approve.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Listing approved" });
        queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
      }
    });
  };

  const handleReject = () => {
    if (!rejectId || !rejectReason.trim()) return;
    reject.mutate({ id: rejectId, data: { reason: rejectReason } }, {
      onSuccess: () => {
        toast({ title: "Listing rejected" });
        setRejectId(null);
        setRejectReason("");
        queryClient.invalidateQueries({ queryKey: getListListingsQueryKey() });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Listing Approvals</h1>
          <p className="text-muted-foreground mt-1">Review marketplace items before they go live</p>
        </div>
        <div className="w-48 shrink-0">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All Listings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12">Img</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Seller</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Price/Qty</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading listings...</td></tr>
                ) : data?.data.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No listings found for this status.</td></tr>
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
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <Store className="h-3 w-3" /> {listing.seller?.displayName}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-medium text-foreground">{formatCurrency(listing.price)} / {listing.unit}</div>
                      <div className="text-xs text-muted-foreground">{listing.quantity} available</div>
                    </td>
                    <td className="p-4 align-middle">
                      <Badge variant={listing.status === 'approved' ? 'default' : listing.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                        {listing.status}
                      </Badge>
                    </td>
                    <td className="p-4 align-middle text-right">
                      {listing.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => setRejectId(listing.id)}>
                            <X className="h-4 w-4 mr-1" /> Reject
                          </Button>
                          <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(listing.id)} disabled={approve.isPending}>
                            <Check className="h-4 w-4 mr-1" /> Approve
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!rejectId} onOpenChange={(open) => !open && setRejectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Reason for rejection</label>
            <Input 
              value={rejectReason} 
              onChange={e => setRejectReason(e.target.value)} 
              placeholder="e.g. Images are blurry, price is unrealistic..." 
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim() || reject.isPending}>Reject Listing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useListSellers } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, ShieldCheck, Ban } from "lucide-react";
import { Link } from "wouter";

export default function AdminSellers() {
  const { data, isLoading } = useListSellers({ limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Seller Management</h1>
        <p className="text-muted-foreground mt-1">Verify nurseries and manage platform access</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12">Logo</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Store Name</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading sellers...</td></tr>
                ) : data?.data.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center">No sellers found</td></tr>
                ) : data?.data.map((seller) => (
                  <tr key={seller.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-2 align-middle">
                      <div className="h-10 w-10 bg-muted rounded-full overflow-hidden flex items-center justify-center">
                        {seller.logoUrl ? <img src={seller.logoUrl} className="h-full w-full object-cover" /> : <Store className="h-5 w-5 text-muted-foreground/50" />}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <Link href={`/sellers/${seller.id}`} className="font-bold text-foreground hover:underline flex items-center gap-1">
                        {seller.displayName || 'Unnamed Store'}
                        {seller.isVerified && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                      </Link>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{seller.email}</td>
                    <td className="p-4 align-middle text-muted-foreground">{new Date(seller.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">
                      {seller.isSuspended ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>
                      ) : seller.isVerified ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Verified</Badge>
                      ) : (
                        <Badge variant="secondary">Unverified</Badge>
                      )}
                    </td>
                    <td className="p-4 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        {!seller.isVerified && (
                          <Button size="sm" variant="outline" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                            Verify
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10">
                          {seller.isSuspended ? "Unsuspend" : "Suspend"}
                        </Button>
                      </div>
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

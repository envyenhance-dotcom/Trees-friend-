import { useGetAdminStats, useListAllOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TreePine, Leaf, Users, Package, DollarSign, Activity } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStats();

  if (isLoading) return <div className="animate-pulse space-y-8"><div className="h-32 bg-muted rounded-xl" /><div className="h-96 bg-muted rounded-xl" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Key metrics across the entire marketplace</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSellers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tree Encyclopedia</CardTitle>
            <TreePine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTrees} <span className="text-sm font-normal text-muted-foreground">species</span></div>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalVarieties} varieties tracked</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600"><Activity className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-amber-800">Pending Listings to Review</p>
                <h4 className="text-2xl font-bold text-amber-900">{stats.pendingListings}</h4>
              </div>
            </div>
            <Link href="/admin/listings" className="text-sm font-medium text-amber-700 hover:underline">Review &rarr;</Link>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 bg-emerald-50/30">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><Leaf className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-emerald-800">Variety Requests</p>
                <h4 className="text-2xl font-bold text-emerald-900">{stats.pendingVarietyRequests}</h4>
              </div>
            </div>
            <Link href="/admin/variety-requests" className="text-sm font-medium text-emerald-700 hover:underline">Review &rarr;</Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Order ID</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Seller</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {stats.recentOrders.map(order => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium"><Link href={`/admin/orders`} className="hover:underline">#{order.id}</Link></td>
                    <td className="p-4 align-middle text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle">{order.seller?.displayName}</td>
                    <td className="p-4 align-middle text-right">{formatCurrency(order.totalPrice)}</td>
                    <td className="p-4 align-middle">
                      <Badge variant="outline" className="capitalize">{order.status.replace('_', ' ')}</Badge>
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

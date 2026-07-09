import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  ListOrdered,
  Package,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Leaf,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SellerStats {
  totalRevenue: number;
  totalOrders: number;
  activeListings: number;
  pendingListings: number;
  rejectedListings: number;
  recentOrders: Array<{
    id: number;
    status: string;
    paymentStatus: string;
    totalPrice: string;
    currency: string;
    createdAt: string;
    quantity: number;
  }>;
}

function useSellerStats() {
  return useQuery<SellerStats>({
    queryKey: ["/api/sellers/me/stats"],
    queryFn: async () => {
      const res = await fetch(`${BASE}/api/sellers/me/stats`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
    staleTime: 30_000,
  });
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  paid: "bg-blue-100 text-blue-700 border-blue-200",
  processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

export default function SellerDashboard() {
  const { user } = useUser();
  const { data: stats, isLoading, error } = useSellerStats();

  const statCards = [
    {
      label: "Total Revenue",
      value: isLoading ? "—" : formatCurrency(stats?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "bg-emerald-500/10 text-emerald-600",
      sub: "From paid orders",
    },
    {
      label: "Total Orders",
      value: isLoading ? "—" : String(stats?.totalOrders ?? 0),
      icon: ListOrdered,
      color: "bg-blue-500/10 text-blue-600",
      sub: "All time",
    },
    {
      label: "Active Listings",
      value: isLoading ? "—" : String(stats?.activeListings ?? 0),
      icon: Package,
      color: "bg-primary/10 text-primary",
      sub: "Approved & live",
    },
    {
      label: "Awaiting Review",
      value: isLoading ? "—" : String(stats?.pendingListings ?? 0),
      icon: Clock,
      color: "bg-amber-500/10 text-amber-600",
      sub: "Pending approval",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 shrink-0">
          <Link href="/seller/products/new">
            <Plus className="h-4 w-4 mr-2" /> New Listing
          </Link>
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          Could not load dashboard stats. Please refresh to try again.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                  <h4 className="text-2xl font-bold text-foreground mt-1">
                    {isLoading ? (
                      <span className="inline-block h-7 w-20 bg-muted animate-pulse rounded" />
                    ) : card.value}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions + Listing Status */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {[
              { href: "/seller/products/new", icon: Plus, label: "Add New Listing", desc: "List a tree variety for sale" },
              { href: "/seller/orders", icon: ShoppingBag, label: "View Orders", desc: "Manage incoming orders" },
              { href: "/seller/couriers", icon: Leaf, label: "Courier Settings", desc: "Set up delivery providers" },
              { href: "/seller/variety-requests", icon: Leaf, label: "Request Variety", desc: "Ask admin to add a new variety" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors group"
              >
                <div className="bg-primary/10 p-2 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Listing health */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" /> Listing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Live (Approved)", count: stats?.activeListings ?? 0, color: "bg-emerald-500", bg: "bg-emerald-50 border-emerald-100 text-emerald-800" },
                  { label: "Pending Admin Review", count: stats?.pendingListings ?? 0, color: "bg-amber-500", bg: "bg-amber-50 border-amber-100 text-amber-800" },
                  { label: "Rejected", count: stats?.rejectedListings ?? 0, color: "bg-red-500", bg: "bg-red-50 border-red-100 text-red-800" },
                ].map((row) => {
                  const total = (stats?.activeListings ?? 0) + (stats?.pendingListings ?? 0) + (stats?.rejectedListings ?? 0);
                  const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                  return (
                    <div key={row.label} className={`flex items-center gap-3 border rounded-lg px-4 py-3 ${row.bg}`}>
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${row.color}`} />
                      <span className="text-sm font-medium flex-1">{row.label}</span>
                      <span className="text-sm font-bold tabular-nums">{row.count}</span>
                      <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                  <Link href="/seller/products">View All Listings <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ListOrdered className="h-4 w-4" /> Recent Orders
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/orders">View all <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}
            </div>
          ) : !stats?.recentOrders?.length ? (
            <div className="py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No orders yet. Your first sale is coming!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Order #</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Amount</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">#{String(order.id).padStart(5, "0")}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3 font-semibold">{formatCurrency(Number(order.totalPrice))}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[order.status] ?? "bg-muted text-muted-foreground border-border"}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

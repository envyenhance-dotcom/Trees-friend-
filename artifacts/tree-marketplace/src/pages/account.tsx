import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  ArrowRight,
  User,
  ShieldCheck,
  LayoutDashboard,
  Edit2,
  Check,
  X,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

const ROLE_META: Record<string, { label: string; color: string; description: string }> = {
  buyer: { label: "Buyer", color: "bg-blue-100 text-blue-700 border-blue-200", description: "Browse and purchase trees from verified sellers." },
  seller: { label: "Seller", color: "bg-emerald-100 text-emerald-700 border-emerald-200", description: "List trees and manage your nursery storefront." },
  admin: { label: "Administrator", color: "bg-purple-100 text-purple-700 border-purple-200", description: "Full platform access including moderation and settings." },
};

export default function AccountPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useGetMyProfile({ query: { enabled: !!user } });

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const updateProfile = useMutation({
    mutationFn: async (data: { displayName: string }) => {
      const res = await fetch(`${API}/profiles/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Profile updated" });
      setEditing(false);
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-3">Sign in to view your account</h1>
        <Button onClick={() => setLocation("/sign-in")}>Sign In</Button>
      </div>
    );
  }

  const roleMeta = ROLE_META[profile.role] ?? ROLE_META.buyer;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold">My Account</h1>
        <p className="text-muted-foreground mt-1">Manage your profile and account settings.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="text-xl">{(profile.displayName ?? user.firstName ?? "U")[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{profile.displayName || user.fullName || "Unnamed"}</p>
              <p className="text-muted-foreground text-sm">{profile.email}</p>
              <Badge className={`mt-1 text-xs border ${roleMeta.color}`}>{roleMeta.label}</Badge>
            </div>
          </div>

          <Separator />

          {/* Editable display name */}
          <div className="space-y-2">
            <Label>Display Name</Label>
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => updateProfile.mutate({ displayName })}
                  disabled={updateProfile.isPending}
                >
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{profile.displayName || "—"}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => { setDisplayName(profile.displayName ?? ""); setEditing(true); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block">Email</span>
              <span>{profile.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Member since</span>
              <span>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-BD") : "—"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Account Type
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`rounded-xl p-4 border ${roleMeta.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-semibold">{roleMeta.label}</span>
              {profile.isVerified && (
                <Badge className="ml-auto bg-emerald-500 text-white text-[10px]">Verified ✓</Badge>
              )}
            </div>
            <p className="text-sm opacity-80">{roleMeta.description}</p>
          </div>

          {/* CTA depending on role */}
          {profile.role === "buyer" && (
            <div className="border rounded-xl p-5 bg-muted/30 space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <span className="font-semibold">Want to sell trees?</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Upgrade to a Seller account to list your trees, manage orders, and connect with buyers across Bangladesh.
              </p>
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => setLocation("/become-seller")}
              >
                <Store className="h-4 w-4 mr-2" />
                Become a Seller
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {(profile.role === "seller" || profile.role === "admin") && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/seller/dashboard")}
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Open Seller Dashboard
            </Button>
          )}

          {profile.role === "admin" && (
            <Button
              variant="outline"
              className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => setLocation("/admin")}
            >
              <ShieldCheck className="h-4 w-4 mr-2" />
              Open Admin Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

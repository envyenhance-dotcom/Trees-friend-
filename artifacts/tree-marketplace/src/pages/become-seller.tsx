import { useState } from "react";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { useGetMyProfile } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Leaf,
  MapPin,
  Phone,
  FileText,
  Shield,
  TrendingUp,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

interface SellerFormData {
  displayName: string;
  phone: string;
  city: string;
  address: string;
  businessDescription: string;
}

const STEPS = [
  { id: 1, title: "Store Details", icon: Store },
  { id: 2, title: "Contact & Location", icon: MapPin },
  { id: 3, title: "About Your Store", icon: FileText },
  { id: 4, title: "Confirm & Submit", icon: CheckCircle2 },
];

const BENEFITS = [
  { icon: TrendingUp, title: "Reach thousands of buyers", desc: "List your trees in front of a growing community of plant lovers across Bangladesh." },
  { icon: Package, title: "Full order management", desc: "Manage listings, track orders, and integrate courier services like Pathao and Steadfast." },
  { icon: Shield, title: "Secure payments", desc: "Get paid via bKash with automatic settlement and clear transaction records." },
];

export default function BecomeSellerPage() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useGetMyProfile({ query: { enabled: !!user } });

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<SellerFormData>({
    displayName: "",
    phone: "",
    city: "",
    address: "",
    businessDescription: "",
  });
  const [errors, setErrors] = useState<Partial<SellerFormData>>({});

  const becomeSeller = useMutation({
    mutationFn: async (data: SellerFormData) => {
      const res = await fetch(`${API}/profiles/become-seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to register as seller");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
      toast({ title: "Welcome to TreeMarket Sellers! 🌳", description: "Your seller account is now active." });
      setTimeout(() => setLocation("/seller/dashboard"), 1200);
    },
    onError: (err: Error) => {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Already a seller/admin — redirect
  if (profile?.role === "seller" || profile?.role === "admin") {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <div className="bg-primary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <Store className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold mb-3">You're already a seller!</h1>
        <p className="text-muted-foreground mb-8">
          Your account has <Badge variant="outline" className="font-semibold capitalize mx-1">{profile.role}</Badge> access.
          Head to your dashboard to manage listings and orders.
        </p>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => setLocation("/seller/dashboard")}>
          Go to Seller Dashboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="max-w-lg mx-auto mt-24 text-center px-4">
        <Leaf className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-serif font-bold mb-3">Start selling on TreeMarket</h1>
        <p className="text-muted-foreground mb-8">Sign in to your account to register as a seller.</p>
        <Button onClick={() => setLocation("/sign-in")}>Sign In to Continue <ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    );
  }

  function validate(s: number): boolean {
    const e: Partial<SellerFormData> = {};
    if (s === 1 && !form.displayName.trim()) e.displayName = "Store name is required";
    if (s === 2) {
      if (!form.phone.trim()) e.phone = "Phone number is required";
      if (!form.city.trim()) e.city = "City is required";
    }
    if (s === 3 && form.businessDescription.trim().length < 30) e.businessDescription = "Please write at least 30 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (validate(step)) setStep((s) => Math.min(4, s + 1));
  }

  function prev() {
    setStep((s) => Math.max(1, s - 1));
  }

  function update(field: keyof SellerFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  return (
    <div className="min-h-[100dvh] bg-muted/20">
      {/* Hero */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-12 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-white/20 text-white border-0 mb-4">For nurseries &amp; growers</Badge>
            <h1 className="text-4xl font-serif font-bold mb-4 leading-tight">
              {profile ? "Upgrade to a Seller Account" : "Start Selling Trees on TreeMarket"}
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              {profile
                ? "You already have an account — just a few details and you can start listing your trees."
                : "Join hundreds of nurseries and growers reaching buyers across Bangladesh."}
            </p>
          </div>
          <div className="hidden md:grid gap-4">
            {BENEFITS.map((b) => (
              <div key={b.title} className="flex items-start gap-3 bg-white/10 rounded-xl p-4">
                <div className="bg-white/20 p-2 rounded-lg shrink-0">
                  <b.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-sm text-primary-foreground/70">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress steps */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center gap-2 shrink-0",
                step >= s.id ? "text-primary" : "text-muted-foreground"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors",
                  step > s.id ? "bg-primary border-primary text-primary-foreground" :
                  step === s.id ? "border-primary text-primary bg-primary/10" :
                  "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
                </div>
                <span className="hidden sm:block text-xs font-medium">{s.title}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-2 transition-colors", step > s.id ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-8">
            {/* Step 1 — Store Name */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">What's your store called?</h2>
                  <p className="text-muted-foreground mt-1">This is what buyers will see when browsing your listings.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Store / Nursery Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="displayName"
                    placeholder="e.g. Green Valley Nursery"
                    value={form.displayName}
                    onChange={(e) => update("displayName", e.target.value)}
                    className={errors.displayName ? "border-destructive" : ""}
                  />
                  {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <strong>Tip:</strong> Use your nursery's official name. You can add a logo and banner later from your seller profile.
                </div>
              </div>
            )}

            {/* Step 2 — Contact & Location */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Where are you located?</h2>
                  <p className="text-muted-foreground mt-1">Help buyers find local sellers and arrange delivery.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="phone">
                      <Phone className="h-3.5 w-3.5 inline mr-1" />
                      Phone Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+880 1XXXXXXXXX"
                      value={form.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      <MapPin className="h-3.5 w-3.5 inline mr-1" />
                      City / District <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="e.g. Dhaka"
                      value={form.city}
                      onChange={(e) => update("city", e.target.value)}
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Full Address (optional)</Label>
                    <Input
                      id="address"
                      placeholder="Street, area, upazila"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — About */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Tell buyers about your store</h2>
                  <p className="text-muted-foreground mt-1">A great description builds trust and helps buyers choose you.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">
                    Store Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="businessDescription"
                    rows={6}
                    placeholder="Describe your nursery, what trees and varieties you specialize in, your experience, and what makes your trees special…"
                    value={form.businessDescription}
                    onChange={(e) => update("businessDescription", e.target.value)}
                    className={errors.businessDescription ? "border-destructive" : ""}
                  />
                  <div className="flex justify-between">
                    {errors.businessDescription
                      ? <p className="text-sm text-destructive">{errors.businessDescription}</p>
                      : <span />}
                    <span className={cn("text-xs", form.businessDescription.length < 30 ? "text-muted-foreground" : "text-primary")}>
                      {form.businessDescription.length} / 30+ chars
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-serif font-bold">Review & Submit</h2>
                  <p className="text-muted-foreground mt-1">Check your details before activating your seller account.</p>
                </div>
                <div className="divide-y border rounded-xl overflow-hidden">
                  {[
                    { label: "Store Name", value: form.displayName },
                    { label: "Phone", value: form.phone },
                    { label: "City", value: form.city },
                    { label: "Address", value: form.address || "—" },
                    { label: "Description", value: form.businessDescription },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-4 px-5 py-3 bg-muted/20">
                      <span className="text-sm font-medium text-muted-foreground w-28 shrink-0">{label}</span>
                      <span className="text-sm text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-foreground">
                  <strong>By submitting</strong>, your account will be upgraded to Seller status. You can start creating listings immediately. All listings will be reviewed by our team before being shown to buyers.
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={prev} disabled={step === 1}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>

              {step < 4 ? (
                <Button onClick={next} className="bg-primary hover:bg-primary/90">
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => becomeSeller.mutate(form)}
                  disabled={becomeSeller.isPending}
                  className="bg-primary hover:bg-primary/90 min-w-[160px]"
                >
                  {becomeSeller.isPending ? (
                    <><span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />Activating…</>
                  ) : (
                    <><Leaf className="h-4 w-4 mr-2" />Activate Seller Account</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

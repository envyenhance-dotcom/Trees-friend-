import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useSyncProfile } from "@workspace/api-client-react";

// Layout & UI
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Pages
import HomePage from "@/pages/home";
import TreesPage from "@/pages/trees";
import TreeDetailPage from "@/pages/trees/detail";
import VarietyDetailPage from "@/pages/trees/variety";
import CategoriesPage from "@/pages/categories";
import CategoryDetailPage from "@/pages/categories/detail";
import SearchPage from "@/pages/search";
import SellerStorefrontPage from "@/pages/sellers/storefront";

// Buyer Pages
import CartPage from "@/pages/buyer/cart";
import CheckoutPage from "@/pages/buyer/checkout";
import OrdersPage from "@/pages/buyer/orders";
import OrderDetailPage from "@/pages/buyer/order-detail";
import WishlistPage from "@/pages/buyer/wishlist";

// Account pages
import BecomeSellerPage from "@/pages/become-seller";
import AccountPage from "@/pages/account";

// Seller Pages
import SellerLayout from "@/components/layout/seller-layout";
import SellerDashboard from "@/pages/seller/dashboard";
import SellerProducts from "@/pages/seller/products";
import SellerProductsNew from "@/pages/seller/products/new";
import SellerOrders from "@/pages/seller/orders";
import SellerCouriers from "@/pages/seller/couriers";
import SellerVarietyRequests from "@/pages/seller/variety-requests";

// Admin Pages
import AdminLayout from "@/components/layout/admin-layout";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTrees from "@/pages/admin/trees";
import AdminVarieties from "@/pages/admin/varieties";
import AdminListings from "@/pages/admin/listings";
import AdminSellers from "@/pages/admin/sellers";
import AdminCategories from "@/pages/admin/categories";
import AdminOrders from "@/pages/admin/orders";
import AdminVarietyRequests from "@/pages/admin/variety-requests";
import AdminSettings from "@/pages/admin/settings";

import NotFound from '@/pages/not-found';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
  },
  variables: {
    colorPrimary: "hsl(145 47% 20%)",
    colorForeground: "hsl(145 47% 10%)",
    colorMutedForeground: "hsl(145 10% 45%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(145 20% 90%)",
    colorInputForeground: "hsl(145 47% 10%)",
    colorNeutral: "hsl(145 20% 90%)",
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden border border-border shadow-lg",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none bg-muted/30",
    headerTitle: "font-serif text-2xl font-bold text-primary",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "font-medium text-foreground",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-accent font-semibold hover:text-accent/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground bg-white px-2",
    identityPreviewEditButton: "text-accent",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive-foreground",
    logoBox: "h-12 w-auto object-contain flex items-center justify-center",
    logoImage: "h-10",
    socialButtonsBlockButton: "border-border hover:bg-muted/50",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm transition-all",
    formFieldInput: "bg-white border-input rounded-md px-3 py-2",
    footerAction: "bg-transparent",
    dividerLine: "bg-border",
    alert: "bg-destructive text-destructive-foreground",
    otpCodeFieldInput: "border-input",
    formFieldRow: "mb-4",
    main: "flex flex-col gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
      <div className="z-10 relative">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 relative">
      <div className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
      <div className="z-10 relative">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClientHook = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClientHook.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClientHook]);

  return null;
}

// User Profile Syncer
function ProfileSyncer() {
  const { user } = useUser();
  const syncProfile = useSyncProfile();
  
  useEffect(() => {
    if (user && !syncProfile.isPending) {
      syncProfile.mutate({
        data: {
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          displayName: user.fullName || user.username || undefined,
        }
      });
    }
  }, [user?.id]);
  
  return null;
}

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <ProfileSyncer />
        <TooltipProvider>
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Admin Routes */}
            <Route path="/admin" component={() => <Show when="signed-in"><AdminLayout><AdminDashboard /></AdminLayout></Show>} />
            <Route path="/admin/trees" component={() => <Show when="signed-in"><AdminLayout><AdminTrees /></AdminLayout></Show>} />
            <Route path="/admin/varieties" component={() => <Show when="signed-in"><AdminLayout><AdminVarieties /></AdminLayout></Show>} />
            <Route path="/admin/listings" component={() => <Show when="signed-in"><AdminLayout><AdminListings /></AdminLayout></Show>} />
            <Route path="/admin/sellers" component={() => <Show when="signed-in"><AdminLayout><AdminSellers /></AdminLayout></Show>} />
            <Route path="/admin/categories" component={() => <Show when="signed-in"><AdminLayout><AdminCategories /></AdminLayout></Show>} />
            <Route path="/admin/orders" component={() => <Show when="signed-in"><AdminLayout><AdminOrders /></AdminLayout></Show>} />
            <Route path="/admin/variety-requests" component={() => <Show when="signed-in"><AdminLayout><AdminVarietyRequests /></AdminLayout></Show>} />
            <Route path="/admin/settings" component={() => <Show when="signed-in"><AdminLayout><AdminSettings /></AdminLayout></Show>} />

            {/* Seller Routes */}
            <Route path="/seller/dashboard" component={() => <Show when="signed-in"><SellerLayout><SellerDashboard /></SellerLayout></Show>} />
            <Route path="/seller/products" component={() => <Show when="signed-in"><SellerLayout><SellerProducts /></SellerLayout></Show>} />
            <Route path="/seller/products/new" component={() => <Show when="signed-in"><SellerLayout><SellerProductsNew /></SellerLayout></Show>} />
            <Route path="/seller/orders" component={() => <Show when="signed-in"><SellerLayout><SellerOrders /></SellerLayout></Show>} />
            <Route path="/seller/couriers" component={() => <Show when="signed-in"><SellerLayout><SellerCouriers /></SellerLayout></Show>} />
            <Route path="/seller/variety-requests" component={() => <Show when="signed-in"><SellerLayout><SellerVarietyRequests /></SellerLayout></Show>} />

            {/* Account Routes */}
            <Route path="/become-seller" component={() => <MainLayout><BecomeSellerPage /></MainLayout>} />
            <Route path="/account" component={() => <Show when="signed-in"><MainLayout><AccountPage /></MainLayout></Show>} />

            {/* Main App Routes */}
            <Route path="/">
              <MainLayout><HomePage /></MainLayout>
            </Route>
            <Route path="/trees">
              <MainLayout><TreesPage /></MainLayout>
            </Route>
            <Route path="/trees/:slug">
              {(params) => <MainLayout><TreeDetailPage slug={params.slug} /></MainLayout>}
            </Route>
            <Route path="/trees/:slug/varieties/:id">
              {(params) => <MainLayout><VarietyDetailPage slug={params.slug} id={Number(params.id)} /></MainLayout>}
            </Route>
            <Route path="/categories">
              <MainLayout><CategoriesPage /></MainLayout>
            </Route>
            <Route path="/categories/:slug">
              {(params) => <MainLayout><CategoryDetailPage slug={params.slug} /></MainLayout>}
            </Route>
            <Route path="/search">
              <MainLayout><SearchPage /></MainLayout>
            </Route>
            <Route path="/sellers/:id">
              {(params) => <MainLayout><SellerStorefrontPage id={Number(params.id)} /></MainLayout>}
            </Route>
            
            {/* Buyer Routes */}
            <Route path="/cart" component={() => <Show when="signed-in"><MainLayout><CartPage /></MainLayout></Show>} />
            <Route path="/checkout" component={() => <Show when="signed-in"><MainLayout><CheckoutPage /></MainLayout></Show>} />
            <Route path="/orders" component={() => <Show when="signed-in"><MainLayout><OrdersPage /></MainLayout></Show>} />
            <Route path="/orders/:id" component={(params) => <Show when="signed-in"><MainLayout><OrderDetailPage id={Number(params.id)} /></MainLayout></Show>} />
            <Route path="/wishlist" component={() => <Show when="signed-in"><MainLayout><WishlistPage /></MainLayout></Show>} />

            <Route>
              <MainLayout><NotFound /></MainLayout>
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

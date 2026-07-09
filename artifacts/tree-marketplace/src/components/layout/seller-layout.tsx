import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings, 
  Truck,
  Leaf,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/react";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/seller/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/seller/products", icon: Package, label: "My Listings" },
    { href: "/seller/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/seller/variety-requests", icon: Leaf, label: "Variety Requests" },
    { href: "/seller/couriers", icon: Truck, label: "Couriers" },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border h-[100dvh] sticky top-0">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-sidebar-primary/20 p-1.5 rounded-md">
              <Leaf className="h-5 w-5 text-sidebar-primary" />
            </div>
            <span className="font-serif text-lg font-bold text-sidebar-foreground">Seller Portal</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden border-b bg-background p-4 flex items-center justify-between">
          <span className="font-serif font-bold text-lg">Seller Portal</span>
          {/* Mobile menu would go here */}
        </div>
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

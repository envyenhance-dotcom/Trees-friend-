import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  TreePine, 
  Package, 
  Users, 
  ShoppingCart, 
  Tags,
  Settings,
  Leaf,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClerk } from "@clerk/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Overview", exact: true },
    { href: "/admin/trees", icon: TreePine, label: "Trees" },
    { href: "/admin/varieties", icon: Leaf, label: "Varieties" },
    { href: "/admin/listings", icon: Package, label: "Listings" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
    { href: "/admin/sellers", icon: Users, label: "Sellers" },
    { href: "/admin/categories", icon: Tags, label: "Categories" },
    { href: "/admin/variety-requests", icon: Leaf, label: "Requests" },
    { href: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-muted/20">
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 border-r border-slate-800 h-[100dvh] sticky top-0 text-slate-300">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-md">
              <TreePine className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="font-serif text-lg font-bold text-white">Admin Console</span>
          </Link>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location === item.href 
              : location.startsWith(item.href);
              
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden border-b bg-slate-900 p-4 flex items-center justify-between text-white">
          <span className="font-serif font-bold text-lg">Admin Console</span>
        </div>
        <div className="flex-1 p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

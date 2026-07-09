import { Link } from "wouter";
import { TreePine } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <TreePine className="h-6 w-6 text-primary" />
              <span className="font-serif text-xl font-bold text-foreground">
                TreeMarket
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The premier marketplace for premium trees, shrubs, and botanical varieties. Connect with trusted nurseries nationwide.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/trees" className="hover:text-primary transition-colors">All Trees</Link></li>
              <li><Link href="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="/search" className="hover:text-primary transition-colors">Advanced Search</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">For Sellers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/seller/dashboard" className="hover:text-primary transition-colors">Seller Dashboard</Link></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Become a Partner</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Seller Guidelines</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Help Center</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Shipping & Delivery</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Return Policy</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Contact Us</span></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Tree Marketplace. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">Privacy Policy</span>
            <span className="hover:text-foreground cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

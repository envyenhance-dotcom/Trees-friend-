import { Link } from "wouter";
import { TreePine, Search, ShoppingCart, User as UserIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser, useClerk, Show } from "@clerk/react";
import { useGetCart, useGetMyProfile, useSearchTrees } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  const { data: cart } = useGetCart({ query: { enabled: !!user } });
  const { data: profile } = useGetMyProfile({ query: { enabled: !!user } });
  
  const { data: searchResults, isLoading: isSearchLoading } = useSearchTrees(
    { q: searchQuery, limit: 5 }, 
    { query: { enabled: searchQuery.length > 1 } }
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
              <TreePine className="h-6 w-6 text-primary" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground hidden sm:inline-block">
              TreeMarket
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/trees" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Trees
            </Link>
            <Link href="/categories" className="text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
          </nav>
        </div>

        <div className="flex-1 max-w-xl relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search"
              placeholder="Search trees, varieties..." 
              className="w-full pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>
          
          {isSearchOpen && searchQuery.length > 1 && (
            <div className="absolute top-full mt-2 w-full bg-card rounded-lg shadow-lg border border-border overflow-hidden">
              {isSearchLoading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Searching...</div>
              ) : searchResults?.results.length ? (
                <div className="py-2">
                  {searchResults.results.map((result) => (
                    <Link 
                      key={`${result.type}-${result.id}`} 
                      href={result.type === 'tree' ? `/trees/${result.slug}` : `/trees/${result.treeSlug}/varieties/${result.id}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors"
                      onClick={() => setIsSearchOpen(false)}
                    >
                      {result.imageUrl ? (
                        <div className="h-10 w-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                          <img src={result.imageUrl} alt={result.name} className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <TreePine className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{result.name}</span>
                        {result.scientificName && (
                          <span className="text-xs text-muted-foreground italic">{result.scientificName}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="ml-auto capitalize">{result.type}</Badge>
                    </Link>
                  ))}
                  <div className="border-t px-4 py-2 mt-2">
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} className="text-sm text-primary font-medium hover:underline block text-center" onClick={() => setIsSearchOpen(false)}>
                      View all results
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Show when="signed-in">
            <Link href="/cart" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart className="h-5 w-5" />
              {cart?.itemCount ? (
                <span className="absolute top-0 right-0 h-4 w-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cart.itemCount}
                </span>
              ) : null}
            </Link>
          </Show>

          <Show when="signed-out">
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href={`${basePath}/sign-in`}>Log in</Link>
              </Button>
              <Button asChild>
                <Link href={`${basePath}/sign-up`}>Sign up</Link>
              </Button>
            </div>
            <Button variant="ghost" size="icon" className="sm:hidden" asChild>
              <Link href={`${basePath}/sign-in`}><UserIcon className="h-5 w-5" /></Link>
            </Button>
          </Show>

          <Show when="signed-in">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                    <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress}
                  </p>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex flex-col space-y-1">
                  <Link href="/orders" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer">
                    My Orders
                  </Link>
                  <Link href="/wishlist" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer">
                    Wishlist
                  </Link>
                  
                  <Link href="/account" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer">
                    My Account
                  </Link>

                  {profile?.role === 'seller' || profile?.role === 'admin' ? (
                    <Link href="/seller/dashboard" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer font-medium text-primary">
                      Seller Dashboard
                    </Link>
                  ) : (
                    <Link href="/become-seller" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer font-medium text-primary">
                      Start Selling →
                    </Link>
                  )}

                  {profile?.role === 'admin' && (
                    <Link href="/admin" className="px-2 py-1.5 text-sm hover:bg-muted rounded-md cursor-pointer font-medium text-purple-700">
                      Admin Dashboard
                    </Link>
                  )}
                  
                  <div className="border-t my-2"></div>
                  <button 
                    onClick={() => signOut({ redirectUrl: basePath || "/" })}
                    className="px-2 py-1.5 text-sm text-destructive hover:bg-muted rounded-md text-left"
                  >
                    Log out
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </Show>
        </div>
      </div>
    </header>
  );
}

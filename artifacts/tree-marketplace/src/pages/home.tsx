import { useListCategories, useListTrees } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowRight, Search, Leaf, TreePine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const { data: treesData, isLoading: treesLoading } = useListTrees({ limit: 6 });
  const { data: categories, isLoading: catLoading } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 mix-blend-multiply z-10" />
          <img 
            src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop" 
            alt="Lush forest canopy" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-20 container mx-auto px-4 flex flex-col items-center text-center">
          <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md mb-6 border-white/30 px-4 py-1.5 text-sm">
            Discover the botanical world
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white max-w-4xl mb-6 leading-tight drop-shadow-lg">
            Cultivate Your Perfect <span className="text-accent italic">Living Space</span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-10 drop-shadow-md">
            The premier marketplace for premium trees, rare shrubs, and expert botanical knowledge. Connect directly with trusted nurseries.
          </p>
          
          <form onSubmit={handleSearch} className="w-full max-w-2xl flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input 
                type="search"
                placeholder="Search for Oak, Maple, Mango..." 
                className="w-full pl-12 bg-white h-12 text-lg rounded-lg border-0 focus-visible:ring-2 focus-visible:ring-accent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90 text-base">
              Search
            </Button>
          </form>

          <div className="mt-12 flex gap-8 text-white text-center opacity-90 drop-shadow-md">
            <div>
              <p className="text-3xl font-bold font-serif">500+</p>
              <p className="text-sm">Varieties</p>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <p className="text-3xl font-bold font-serif">120+</p>
              <p className="text-sm">Nurseries</p>
            </div>
            <div className="w-px h-12 bg-white/30"></div>
            <div>
              <p className="text-3xl font-bold font-serif">10k+</p>
              <p className="text-sm">Happy Growers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-serif font-bold text-foreground">Explore by Category</h2>
              <p className="text-muted-foreground mt-2">Find exactly what your landscape needs</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex group" asChild>
              <Link href="/categories">
                View all <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {catLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-32 w-48 shrink-0 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories?.slice(0, 6).map((cat) => (
                <Link key={cat.id} href={`/categories/${cat.slug}`}>
                  <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                        <Leaf className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{cat.treeCount || 0} trees</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Trees */}
      <section className="py-24 container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 text-primary border-primary/20">Featured Selection</Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">Discover Exceptional Species</h2>
          <p className="text-muted-foreground">
            Explore our hand-picked selection of premium trees, cultivated by expert growers for optimal health and beauty.
          </p>
        </div>

        {treesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[400px] bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {treesData?.data.map((tree) => (
              <Link key={tree.id} href={`/trees/${tree.slug}`}>
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-muted h-full flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                    {tree.heroImageUrl ? (
                      <img 
                        src={tree.heroImageUrl} 
                        alt={tree.commonName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/5">
                        <TreePine className="h-16 w-16 text-primary/20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {tree.categories?.[0] && (
                        <Badge className="bg-white/90 text-foreground hover:bg-white backdrop-blur-sm border-none shadow-sm">
                          {tree.categories[0].name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {tree.commonName}
                        </h3>
                        <p className="text-sm text-muted-foreground italic line-clamp-1">
                          {tree.scientificName}
                        </p>
                      </div>
                      {tree.averageRating ? (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md text-sm font-medium shrink-0">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{tree.averageRating.toFixed(1)}</span>
                        </div>
                      ) : null}
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-4 flex-1">
                      {tree.description || "No description available."}
                    </p>

                    <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm">
                      <div className="flex items-center text-muted-foreground gap-2">
                        <Leaf className="h-4 w-4" />
                        <span>{tree.growthRate || 'Unknown'} growth</span>
                      </div>
                      <span className="text-primary font-medium group-hover:underline">View details</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 text-center">
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" asChild>
            <Link href="/trees">Browse the full encyclopedia</Link>
          </Button>
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">More than just a marketplace. A botanical library.</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 leading-relaxed">
                We believe that buying a tree is an investment in the future. That's why every listing is backed by comprehensive encyclopedia data covering soil requirements, climate zones, and growth patterns.
              </p>
              <div className="space-y-4">
                {[
                  "Detailed variety information",
                  "Verified seller ratings",
                  "Secure bKash payments",
                  "Expert growing guides"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                      <div className="h-2 w-2 rounded-full bg-accent"></div>
                    </div>
                    <span className="font-medium text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-full bg-primary-foreground/5 absolute -inset-8 blur-3xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1599839619722-39751411ea63?q=80&w=2072&auto=format&fit=crop" 
                alt="Planting a tree" 
                className="relative z-10 rounded-2xl shadow-2xl border-4 border-white/10 rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

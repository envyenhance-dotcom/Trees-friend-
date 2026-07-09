import { useListTrees, useListCategories } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TreePine, Star, Search, Filter, Droplets, Sun, MapPin } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function TreesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [climate, setClimate] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: treesData, isLoading: treesLoading } = useListTrees({
    page,
    limit,
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    climate: climate !== "all" ? climate : undefined,
  });

  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3 text-foreground">Category</h3>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories?.map(c => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-foreground">Climate Zone</h3>
        <Select value={climate} onValueChange={(v) => { setClimate(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Climates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Climates</SelectItem>
            <SelectItem value="Tropical">Tropical</SelectItem>
            <SelectItem value="Subtropical">Subtropical</SelectItem>
            <SelectItem value="Temperate">Temperate</SelectItem>
            <SelectItem value="Arid">Arid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          setCategory("all");
          setClimate("all");
          setSearch("");
          setPage(1);
        }}
      >
        Clear Filters
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Botanical Encyclopedia</h1>
          <p className="text-muted-foreground mt-1">Browse our complete collection of trees and shrubs</p>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search trees..." 
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FiltersContent />
            </SheetContent>
          </Sheet>
        </form>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 shrink-0">
          <div className="sticky top-24 bg-card rounded-xl border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-lg font-serif font-bold">
              <Filter className="h-5 w-5 text-primary" />
              Refine Search
            </div>
            <FiltersContent />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {treesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-[380px] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : treesData?.data.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-xl border border-dashed">
              <TreePine className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No trees found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {treesData?.data.map((tree) => (
                  <Link key={tree.id} href={`/trees/${tree.slug}`}>
                    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-muted h-full flex flex-col bg-card">
                      <div className="aspect-[4/3] overflow-hidden relative bg-muted">
                        {tree.heroImageUrl ? (
                          <img 
                            src={tree.heroImageUrl} 
                            alt={tree.commonName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/5">
                            <TreePine className="h-12 w-12 text-primary/20" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {tree.commonName}
                          </h3>
                          {tree.averageRating ? (
                            <div className="flex items-center gap-1 text-amber-500 shrink-0 mt-1">
                              <Star className="h-3 w-3 fill-current" />
                              <span className="text-xs font-medium">{tree.averageRating.toFixed(1)}</span>
                            </div>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground italic mb-3 line-clamp-1">
                          {tree.scientificName}
                        </p>
                        
                        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
                          {tree.climate && (
                            <div className="flex items-center gap-2">
                              <Sun className="h-3.5 w-3.5 text-primary/70" />
                              <span className="line-clamp-1">{tree.climate}</span>
                            </div>
                          )}
                          {tree.waterRequirement && (
                            <div className="flex items-center gap-2">
                              <Droplets className="h-3.5 w-3.5 text-blue-400" />
                              <span className="line-clamp-1">{tree.waterRequirement} water</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {treesData && treesData.meta.totalPages > 1 && (
                <div className="mt-12 flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-4 text-sm font-medium">
                    Page {page} of {treesData.meta.totalPages}
                  </div>
                  <Button 
                    variant="outline" 
                    disabled={page === treesData.meta.totalPages}
                    onClick={() => setPage(p => Math.min(treesData.meta.totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

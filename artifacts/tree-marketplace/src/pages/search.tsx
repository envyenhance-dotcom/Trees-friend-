import { useSearchTrees } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, TreePine, Leaf } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);

  const { data, isLoading } = useSearchTrees(
    { q: activeQuery, limit: 50 },
    { query: { enabled: activeQuery.length > 0 } }
  );

  useEffect(() => {
    setQuery(initialQuery);
    setActiveQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
      setActiveQuery(query);
    }
  };

  const trees = data?.results.filter(r => r.type === 'tree') || [];
  const varieties = data?.results.filter(r => r.type === 'variety') || [];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <form onSubmit={handleSubmit} className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="search" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search trees, varieties, scientific names..."
          className="w-full pl-12 h-14 text-lg bg-card border-2 border-muted focus-visible:border-primary rounded-xl shadow-sm"
          autoFocus
        />
        <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6">
          Search
        </Button>
      </form>

      {!activeQuery ? (
        <div className="text-center py-24">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-medium text-muted-foreground">Enter a search term to begin</h2>
        </div>
      ) : isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />)}
        </div>
      ) : data?.results.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 border border-dashed rounded-xl">
          <TreePine className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No results found for "{activeQuery}"</h3>
          <p className="text-muted-foreground mt-2">Try checking for typos or using broader terms.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {trees.length > 0 && (
            <div>
              <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
                <TreePine className="h-6 w-6 text-primary" /> Trees
              </h3>
              <div className="divide-y border rounded-xl overflow-hidden bg-card">
                {trees.map(result => (
                  <Link key={result.id} href={`/trees/${result.slug}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    {result.imageUrl ? (
                      <div className="h-16 w-16 rounded-md bg-muted overflow-hidden shrink-0">
                        <img src={result.imageUrl} alt={result.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <TreePine className="h-8 w-8" />
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{result.name}</h4>
                      {result.scientificName && <p className="text-sm text-muted-foreground italic">{result.scientificName}</p>}
                    </div>
                    <Badge variant="outline" className="ml-auto">Tree</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {varieties.length > 0 && (
            <div>
              <h3 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2">
                <Leaf className="h-6 w-6 text-primary" /> Varieties
              </h3>
              <div className="divide-y border rounded-xl overflow-hidden bg-card">
                {varieties.map(result => (
                  <Link key={result.id} href={`/trees/${result.treeSlug}/varieties/${result.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{result.name}</h4>
                      <p className="text-sm text-muted-foreground">Cultivar</p>
                    </div>
                    <Badge variant="outline" className="ml-auto">Variety</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

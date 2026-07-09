import { useListTreesByCategory } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { TreePine, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CategoryDetailPage({ slug }: { slug: string }) {
  const { data: result, isLoading } = useListTreesByCategory(slug, { query: { enabled: !!slug } });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center text-sm text-muted-foreground mb-8">
        <Link href="/categories" className="hover:text-primary">Categories</Link>
        <ChevronRight className="h-4 w-4 mx-2" />
        <span className="capitalize text-foreground font-medium">{slug.replace(/-/g, ' ')}</span>
      </div>

      <div className="mb-12">
        <h1 className="text-4xl font-serif font-bold capitalize text-foreground mb-2">
          {slug.replace(/-/g, ' ')} Trees
        </h1>
        <p className="text-muted-foreground">
          Showing {result?.meta.total || 0} species in this category.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : result?.data.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <TreePine className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground">No trees found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {result?.data.map((tree) => (
            <Link key={tree.id} href={`/trees/${tree.slug}`}>
              <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-muted h-full flex flex-col cursor-pointer">
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
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {tree.commonName}
                  </h3>
                  <p className="text-xs text-muted-foreground italic mb-4">
                    {tree.scientificName}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                    {tree.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

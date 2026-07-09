import { useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Tags } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories();

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="mx-auto w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Tags className="h-6 w-6" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Plant Categories</h1>
        <p className="text-muted-foreground">Browse our encyclopedia and marketplace by botanical classification.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories?.map((cat) => (
            <Link key={cat.id} href={`/categories/${cat.slug}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group border-muted">
                <CardContent className="p-8 flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-muted-foreground">
                    <Leaf className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-2 px-3 py-1 bg-muted rounded-full inline-block">
                      {cat.treeCount || 0} species
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

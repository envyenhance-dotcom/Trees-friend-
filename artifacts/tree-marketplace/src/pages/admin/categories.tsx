import { useListCategories, useCreateCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Tags } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminCategories() {
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createCategory.mutate({ data: { name, slug } }, {
      onSuccess: () => {
        setName("");
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Categories</h1>
        <p className="text-muted-foreground mt-1">Manage botanical classifications</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Create Category</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Fruit Trees" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generated Slug</label>
                  <Input value={slug} disabled className="bg-muted" />
                </div>
                <Button type="submit" className="w-full" disabled={createCategory.isPending || !name.trim()}>
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12">Icon</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Slug</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Trees</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {isLoading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Loading categories...</td></tr>
                    ) : categories?.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center">No categories found.</td></tr>
                    ) : categories?.map((cat) => (
                      <tr key={cat.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle">
                          <div className="h-8 w-8 bg-primary/10 rounded flex items-center justify-center text-primary">
                            <Tags className="h-4 w-4" />
                          </div>
                        </td>
                        <td className="p-4 align-middle font-bold text-foreground">{cat.name}</td>
                        <td className="p-4 align-middle font-mono text-xs text-muted-foreground">{cat.slug}</td>
                        <td className="p-4 align-middle text-right">
                          <span className="inline-flex items-center justify-center bg-muted px-2 py-1 rounded-full text-xs font-medium">
                            {cat.treeCount || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

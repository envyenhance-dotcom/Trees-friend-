import { useListTrees } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, TreePine } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AdminTrees() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListTrees({ search: search || undefined, limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Encyclopedia: Trees</h1>
          <p className="text-muted-foreground mt-1">Manage core tree species data</p>
        </div>
        <Button className="shrink-0"><Plus className="h-4 w-4 mr-2" /> Add Species</Button>
      </div>

      <Card>
        <div className="p-4 border-b flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by common or scientific name..." 
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b bg-muted/50">
                <tr className="border-b transition-colors">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-12"></th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Species</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Family</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Climate</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : data?.data.map((tree) => (
                  <tr key={tree.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-2 align-middle">
                      <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                        {tree.heroImageUrl ? <img src={tree.heroImageUrl} className="h-full w-full object-cover" /> : <TreePine className="h-full w-full p-2 text-muted-foreground/30" />}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="font-bold text-foreground">{tree.commonName}</div>
                      <div className="text-xs text-muted-foreground italic">{tree.scientificName}</div>
                    </td>
                    <td className="p-4 align-middle">{tree.family || '-'}</td>
                    <td className="p-4 align-middle">
                      {tree.climate && <Badge variant="secondary" className="font-normal">{tree.climate}</Badge>}
                    </td>
                    <td className="p-4 align-middle">
                      <Button variant="ghost" size="sm">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

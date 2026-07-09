import { useGetTree } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TreePine, 
  MapPin, 
  Sun, 
  Droplets, 
  Thermometer, 
  Timer, 
  Ruler, 
  Sprout, 
  Calendar,
  Star,
  ChevronRight,
  Info
} from "lucide-react";

export default function TreeDetailPage({ slug }: { slug: string }) {
  const { data: tree, isLoading } = useGetTree(slug, {
    query: { enabled: !!slug }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 w-1/3 bg-muted rounded mb-4"></div>
        <div className="h-4 w-1/4 bg-muted rounded mb-8"></div>
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="h-[400px] bg-muted rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Tree not found</h2>
        <Button asChild><Link href="/trees">Back to Encyclopedia</Link></Button>
      </div>
    );
  }

  // Organize images by type
  const generalImages = tree.images?.filter(img => img.imageType === 'general' || img.imageType === 'mature_tree') || [];
  const leafImages = tree.images?.filter(img => img.imageType === 'leaf') || [];
  const fruitImages = tree.images?.filter(img => img.imageType === 'fruit' || img.imageType === 'flower') || [];
  const barkImages = tree.images?.filter(img => img.imageType === 'bark') || [];

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Hero Banner */}
      <div className="w-full bg-slate-900 text-white relative border-b border-primary/20">
        {tree.heroImageUrl && (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-slate-900/80 z-10 mix-blend-multiply" />
            <img src={tree.heroImageUrl} alt={tree.commonName} className="w-full h-full object-cover opacity-50 blur-[2px]" />
          </div>
        )}
        <div className="container mx-auto px-4 py-12 md:py-20 relative z-20">
          <div className="flex flex-wrap gap-2 mb-4">
            {tree.categories?.map(c => (
              <Badge key={c.id} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/10">
                {c.name}
              </Badge>
            ))}
            {tree.family && (
              <Badge variant="outline" className="text-white/80 border-white/20">Family: {tree.family}</Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-2">{tree.commonName}</h1>
          <p className="text-xl md:text-2xl text-emerald-200 italic font-serif mb-6">{tree.scientificName}</p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm">
            {tree.nativeRegion && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span>Native to {tree.nativeRegion}</span>
              </div>
            )}
            {tree.averageRating ? (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className={`h-4 w-4 ${star <= Math.round(tree.averageRating || 0) ? "text-amber-400 fill-amber-400" : "text-white/20"}`} />
                  ))}
                </div>
                <span className="ml-1 font-medium">{tree.averageRating.toFixed(1)}</span>
                <span className="text-white/60">({tree.reviewCount} reviews)</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column: Images & Desc */}
          <div className="lg:col-span-2 space-y-12">
            
            {tree.heroImageUrl && (
              <div className="rounded-2xl overflow-hidden border shadow-lg bg-card">
                <img src={tree.heroImageUrl} alt={tree.commonName} className="w-full h-auto max-h-[500px] object-cover" />
              </div>
            )}

            <div>
              <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2 text-foreground">
                <Info className="h-5 w-5 text-primary" /> Botanical Description
              </h2>
              <div className="prose prose-emerald max-w-none text-muted-foreground leading-relaxed">
                {tree.description ? (
                  <p className="whitespace-pre-wrap">{tree.description}</p>
                ) : (
                  <p className="italic text-muted-foreground/60">No detailed description available.</p>
                )}
              </div>
            </div>

            {/* Visual Identification Tabs */}
            {(leafImages.length > 0 || fruitImages.length > 0 || barkImages.length > 0 || generalImages.length > 0) && (
              <div>
                <h2 className="text-2xl font-serif font-bold mb-6 text-foreground">Visual Identification</h2>
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6 overflow-x-auto">
                    <TabsTrigger value="all" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2">All Images</TabsTrigger>
                    {generalImages.length > 0 && <TabsTrigger value="general" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2">Whole Tree</TabsTrigger>}
                    {leafImages.length > 0 && <TabsTrigger value="leaves" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2">Leaves</TabsTrigger>}
                    {fruitImages.length > 0 && <TabsTrigger value="fruit" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2">Flowers & Fruit</TabsTrigger>}
                    {barkImages.length > 0 && <TabsTrigger value="bark" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none border-b-2 border-transparent px-4 py-2">Bark</TabsTrigger>}
                  </TabsList>
                  
                  <TabsContent value="all" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {tree.images?.map((img) => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border">
                          <img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  {/* Other tab contents map similarly */}
                  <TabsContent value="general" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {generalImages.map(img => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border"><img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="leaves" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {leafImages.map(img => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border"><img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="fruit" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {fruitImages.map(img => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border"><img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="bark" className="mt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {barkImages.map(img => (
                        <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border"><img src={img.imageUrl} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" /></div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Right Column: Specs & Varieties */}
          <div className="space-y-8">
            <Card className="border-primary/10 shadow-md">
              <div className="bg-primary/5 px-6 py-4 border-b border-primary/10">
                <h3 className="font-serif font-bold text-lg text-primary">Cultivation Specs</h3>
              </div>
              <CardContent className="p-0">
                <dl className="divide-y divide-border">
                  {[
                    { icon: Sun, label: "Sunlight", value: tree.sunlight },
                    { icon: Droplets, label: "Water", value: tree.waterRequirement },
                    { icon: Thermometer, label: "Climate", value: tree.climate },
                    { icon: Sprout, label: "Soil", value: tree.soil },
                    { icon: Timer, label: "Growth Rate", value: tree.growthRate },
                    { icon: Ruler, label: "Mature Height", value: tree.height },
                    { icon: Calendar, label: "Lifespan", value: tree.lifespan },
                  ].map((item, i) => item.value && (
                    <div key={i} className="flex items-start gap-4 px-6 py-4">
                      <div className="mt-0.5 shrink-0 bg-primary/10 p-2 rounded text-primary">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-foreground">{item.label}</dt>
                        <dd className="text-sm text-muted-foreground mt-1 leading-tight">{item.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>

            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-muted/30">
                <h3 className="font-serif font-bold text-lg text-foreground">Available Varieties ({tree.varieties?.length || 0})</h3>
                <p className="text-xs text-muted-foreground mt-1">Specific cultivars of this tree</p>
              </div>
              
              <div className="divide-y max-h-[500px] overflow-y-auto">
                {tree.varieties?.length ? (
                  tree.varieties.map(variety => (
                    <Link key={variety.id} href={`/trees/${tree.slug}/varieties/${variety.id}`}>
                      <div className="px-6 py-4 hover:bg-muted/50 transition-colors flex items-center justify-between group cursor-pointer">
                        <div>
                          <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {variety.varietyName}
                          </div>
                          {variety.activeListingCount ? (
                            <Badge variant="outline" className="mt-2 text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200">
                              {variety.activeListingCount} Sellers
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground mt-2 block">Information only</span>
                          )}
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No specific varieties documented yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

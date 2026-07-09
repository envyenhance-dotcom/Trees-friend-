/**
 * Seed script: populates the database with sample categories, trees, varieties, and app settings.
 * Run with: pnpm --filter @workspace/api-server run seed
 */

import { db, categoriesTable, treesTable, treeVarietiesTable, treeCategoriesTable, treeImagesTable, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { DEFAULT_SETTINGS } from "./lib/settings";

async function seed() {
  console.log("🌱 Seeding database...");

  // -- Categories --
  const categoriesData = [
    { name: "Fruit Trees", slug: "fruit-trees" },
    { name: "Shade Trees", slug: "shade-trees" },
    { name: "Medicinal Plants", slug: "medicinal-plants" },
    { name: "Ornamental Trees", slug: "ornamental-trees" },
    { name: "Timber Trees", slug: "timber-trees" },
    { name: "Flowering Trees", slug: "flowering-trees" },
    { name: "Evergreen Trees", slug: "evergreen-trees" },
    { name: "Native Species", slug: "native-species" },
  ];

  const categories: Array<{ id: number; name: string; slug: string }> = [];
  for (const cat of categoriesData) {
    const existing = await db.select().from(categoriesTable).where(eq(categoriesTable.slug, cat.slug)).limit(1);
    if (existing.length > 0) {
      categories.push(existing[0]);
    } else {
      const [c] = await db.insert(categoriesTable).values(cat).returning();
      categories.push(c);
    }
  }
  console.log(`✓ ${categories.length} categories`);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // -- Trees --
  const treesData = [
    {
      slug: "mango",
      commonName: "Mango",
      scientificName: "Mangifera indica",
      family: "Anacardiaceae",
      nativeRegion: "South and Southeast Asia",
      description: "The mango is a juicy stone fruit produced from numerous species of tropical trees belonging to the genus Mangifera. Widely cultivated throughout the tropics and subtropics, the mango is the national fruit of India, Pakistan, and the Philippines.",
      climate: "Tropical and subtropical",
      soil: "Well-drained loamy soil, pH 5.5–7.5",
      waterRequirement: "Moderate",
      sunlight: "Full sun",
      growthRate: "Moderate to fast",
      height: "10–40 m",
      lifespan: "100+ years",
      floweringSeason: "December–April",
      fruitingSeason: "May–August",
      uses: "Food, timber, medicinal, shade",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mango_fruit.jpg/1200px-Mango_fruit.jpg",
      categories: ["fruit-trees", "shade-trees", "native-species"],
    },
    {
      slug: "jackfruit",
      commonName: "Jackfruit",
      scientificName: "Artocarpus heterophyllus",
      family: "Moraceae",
      nativeRegion: "Western Ghats, India",
      description: "Jackfruit is a large tropical tree fruit that can weigh up to 55 kg (120 lb) — the largest tree-borne fruit in the world. The national fruit of Bangladesh, it is commonly grown throughout tropical regions.",
      climate: "Tropical and subtropical",
      soil: "Well-drained alluvial or loamy soil",
      waterRequirement: "Moderate",
      sunlight: "Full sun",
      growthRate: "Fast",
      height: "8–25 m",
      lifespan: "60–100 years",
      floweringSeason: "January–April",
      fruitingSeason: "June–August",
      uses: "Food, timber, latex, medicinal",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Jackfruit_dsc08679.jpg/1200px-Jackfruit_dsc08679.jpg",
      categories: ["fruit-trees", "shade-trees", "native-species"],
    },
    {
      slug: "neem",
      commonName: "Neem",
      scientificName: "Azadirachta indica",
      family: "Meliaceae",
      nativeRegion: "Indian subcontinent",
      description: "Neem is a fast-growing tree known for its drought resistance and numerous medicinal properties. Every part of the tree — leaves, bark, seeds, and flowers — has been used in traditional Ayurvedic medicine for thousands of years.",
      climate: "Tropical and semi-arid",
      soil: "Any well-drained soil",
      waterRequirement: "Low (drought-tolerant)",
      sunlight: "Full sun",
      growthRate: "Fast",
      height: "15–20 m",
      lifespan: "150–200 years",
      floweringSeason: "March–May",
      fruitingSeason: "June–August",
      uses: "Medicinal, insecticide, timber, shade, oil",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Azadirachta_indica_leaves.jpg/1200px-Azadirachta_indica_leaves.jpg",
      categories: ["medicinal-plants", "shade-trees", "native-species"],
    },
    {
      slug: "krishnachura",
      commonName: "Krishnachura",
      scientificName: "Delonix regia",
      family: "Fabaceae",
      nativeRegion: "Madagascar",
      description: "Known as Flamboyant or Royal Poinciana, Krishnachura is celebrated for its spectacular flame-red blossoms. The national flower tree of Bangladesh, it transforms streets and parks into a brilliant spectacle each summer.",
      climate: "Tropical",
      soil: "Sandy or loamy, well-drained",
      waterRequirement: "Moderate",
      sunlight: "Full sun",
      growthRate: "Fast",
      height: "8–12 m",
      lifespan: "50+ years",
      floweringSeason: "April–July",
      fruitingSeason: "October–November",
      uses: "Ornamental, shade, avenue planting",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Flamboyant%2C_Madagascar.jpg/1200px-Flamboyant%2C_Madagascar.jpg",
      categories: ["flowering-trees", "ornamental-trees"],
    },
    {
      slug: "arjun-tree",
      commonName: "Arjun Tree",
      scientificName: "Terminalia arjuna",
      family: "Combretaceae",
      nativeRegion: "Indian subcontinent",
      description: "The Arjun tree is a large evergreen tree sacred in Hindu mythology and prized for its heart-protecting medicinal bark. It grows along river banks and provides excellent shade and timber.",
      climate: "Tropical and subtropical",
      soil: "Moist loamy soil near rivers",
      waterRequirement: "Moderate to high",
      sunlight: "Full sun",
      growthRate: "Moderate",
      height: "20–30 m",
      lifespan: "100+ years",
      floweringSeason: "April–June",
      fruitingSeason: "September–November",
      uses: "Medicinal (heart health), timber, shade, tannin",
      heroImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Terminalia_arjuna_-_Leaves.jpg/1200px-Terminalia_arjuna_-_Leaves.jpg",
      categories: ["medicinal-plants", "timber-trees", "evergreen-trees"],
    },
  ];

  const insertedTrees: Array<{ id: number; slug: string }> = [];
  for (const { categories: catSlugs, ...treeData } of treesData) {
    const existing = await db.select().from(treesTable).where(eq(treesTable.slug, treeData.slug)).limit(1);
    let tree: { id: number; slug: string };
    if (existing.length > 0) {
      tree = existing[0];
    } else {
      const [t] = await db.insert(treesTable).values(treeData).returning();
      tree = t;
    }
    insertedTrees.push(tree);

    // Link categories
    for (const catSlug of catSlugs) {
      const catId = catMap[catSlug];
      if (!catId) continue;
      try {
        await db.insert(treeCategoriesTable).values({ treeId: tree.id, categoryId: catId }).onConflictDoNothing();
      } catch {
        // Already linked
      }
    }
  }
  console.log(`✓ ${insertedTrees.length} trees`);

  // -- Varieties --
  const treeSlugToId = Object.fromEntries(insertedTrees.map((t) => [t.slug, t.id]));

  const varietiesData = [
    // Mango varieties
    { treeSlug: "mango", varietyName: "Himsagar", slug: "mango-himsagar", origin: "West Bengal, India", taste: "Exceptionally sweet, aromatic, fiberless", fruitSize: "Medium (200–300g)", treeSize: "Medium", yieldAmount: "High", diseaseResistance: "Moderate", harvestTime: "June–July", bestClimate: "Subtropical", advantages: "Premium quality, high demand, excellent shelf life", disadvantages: "Susceptible to mango hopper" },
    { treeSlug: "mango", varietyName: "Langra", slug: "mango-langra", origin: "Varanasi, India", taste: "Sweet-sour, rich, slightly fibrous", fruitSize: "Medium (250–350g)", treeSize: "Large", yieldAmount: "High", diseaseResistance: "Good", harvestTime: "July–August", bestClimate: "Tropical", advantages: "Long shelf life, high yield, widely popular", disadvantages: "Prone to fruit fly in humid conditions" },
    { treeSlug: "mango", varietyName: "Fazli", slug: "mango-fazli", origin: "Chapai Nawabganj, Bangladesh", taste: "Mildly sweet, slightly sour, fiberless", fruitSize: "Very large (500–1000g)", treeSize: "Large", yieldAmount: "Very high", diseaseResistance: "Good", harvestTime: "August–September", bestClimate: "Tropical", advantages: "Largest Bangladeshi mango, excellent export quality", disadvantages: "Late season, requires large space" },
    // Jackfruit varieties
    { treeSlug: "jackfruit", varietyName: "Khaja Kathal", slug: "jackfruit-khaja", origin: "Bangladesh", taste: "Crispy, moderately sweet", fruitSize: "Medium (5–10 kg)", treeSize: "Medium", yieldAmount: "High", diseaseResistance: "Good", harvestTime: "June–August", bestClimate: "Tropical", advantages: "Crunchier flesh, preferred for cooking", disadvantages: "Lower sweetness than Ghila varieties" },
    { treeSlug: "jackfruit", varietyName: "Ghila Kathal", slug: "jackfruit-ghila", origin: "Bangladesh", taste: "Soft, very sweet, juicy", fruitSize: "Large (10–20 kg)", treeSize: "Large", yieldAmount: "Moderate", diseaseResistance: "Moderate", harvestTime: "July–September", bestClimate: "Tropical", advantages: "Excellent eating quality, very sweet", disadvantages: "Shorter shelf life" },
    // Neem varieties
    { treeSlug: "neem", varietyName: "Melia Neem", slug: "neem-melia", origin: "South Asia", taste: "Extremely bitter (not edible)", fruitSize: "Small (1–2g)", treeSize: "Large", yieldAmount: "Very high", diseaseResistance: "Excellent", harvestTime: "July–September", bestClimate: "Tropical and semi-arid", advantages: "Superior medicinal properties, fast growth", disadvantages: "Very bitter, not suitable for consumption" },
  ];

  let varietyCount = 0;
  for (const { treeSlug, ...varData } of varietiesData) {
    const treeId = treeSlugToId[treeSlug];
    if (!treeId) continue;
    const existing = await db.select().from(treeVarietiesTable).where(eq(treeVarietiesTable.slug, varData.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(treeVarietiesTable).values({ treeId, ...varData }).onConflictDoNothing();
      varietyCount++;
    }
  }
  console.log(`✓ ${varietyCount} new varieties`);

  // -- App Settings --
  for (const setting of DEFAULT_SETTINGS) {
    const existing = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, setting.key)).limit(1);
    if (existing.length === 0) {
      await db.insert(appSettingsTable).values({
        key: setting.key,
        value: setting.value ?? null,
        isSecret: setting.isSecret,
        description: setting.description,
      });
    }
  }
  console.log(`✓ App settings initialized`);

  console.log("✅ Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

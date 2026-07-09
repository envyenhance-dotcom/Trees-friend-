import { pgTable, serial, text, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const treesTable = pgTable("trees", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  commonName: text("common_name").notNull(),
  scientificName: text("scientific_name").notNull(),
  family: text("family"),
  nativeRegion: text("native_region"),
  description: text("description"),
  climate: text("climate"),
  soil: text("soil"),
  waterRequirement: text("water_requirement"),
  sunlight: text("sunlight"),
  growthRate: text("growth_rate"),
  height: text("height"),
  lifespan: text("lifespan"),
  floweringSeason: text("flowering_season"),
  fruitingSeason: text("fruiting_season"),
  uses: text("uses"),
  heroImageUrl: text("hero_image_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const treeCategoriesTable = pgTable(
  "tree_categories",
  {
    treeId: integer("tree_id").notNull().references(() => treesTable.id, { onDelete: "cascade" }),
    categoryId: integer("category_id").notNull().references(() => categoriesTable.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.treeId, t.categoryId] })],
);

export const treeVarietiesTable = pgTable("tree_varieties", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").notNull().references(() => treesTable.id, { onDelete: "cascade" }),
  varietyName: text("variety_name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  origin: text("origin"),
  taste: text("taste"),
  fruitSize: text("fruit_size"),
  treeSize: text("tree_size"),
  yieldAmount: text("yield_amount"),
  diseaseResistance: text("disease_resistance"),
  harvestTime: text("harvest_time"),
  bestClimate: text("best_climate"),
  advantages: text("advantages"),
  disadvantages: text("disadvantages"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const treeImagesTable = pgTable("tree_images", {
  id: serial("id").primaryKey(),
  treeId: integer("tree_id").references(() => treesTable.id, { onDelete: "cascade" }),
  varietyId: integer("variety_id").references(() => treeVarietiesTable.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull().default("general"), // leaf|flower|fruit|bark|mature_tree|general
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const treesRelations = relations(treesTable, ({ many }) => ({
  categories: many(treeCategoriesTable),
  varieties: many(treeVarietiesTable),
  images: many(treeImagesTable),
}));

export const treeVarietiesRelations = relations(treeVarietiesTable, ({ one, many }) => ({
  tree: one(treesTable, { fields: [treeVarietiesTable.treeId], references: [treesTable.id] }),
  images: many(treeImagesTable),
}));

export const insertTreeSchema = createInsertSchema(treesTable).omit({ id: true, createdAt: true });
export type InsertTree = z.infer<typeof insertTreeSchema>;
export type Tree = typeof treesTable.$inferSelect;

export const insertVarietySchema = createInsertSchema(treeVarietiesTable).omit({ id: true, createdAt: true });
export type InsertVariety = z.infer<typeof insertVarietySchema>;
export type TreeVariety = typeof treeVarietiesTable.$inferSelect;

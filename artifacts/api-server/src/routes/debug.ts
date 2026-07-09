import { Router } from "express";
import { db, pool } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/db", async (_req, res) => {
  try {
    // Test raw pool connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    client.release();
    
    // Test drizzle query
    const categories = await db.select({ count: sql<number>`count(*)::int` }).from(db._schema.categoriesTable);
    
    res.json({
      db: "connected",
      time: result.rows[0],
      categoriesCount: categories[0]?.count || 0,
      database_url: process.env.DATABASE_URL ? "set" : "missing",
    });
  } catch (err: any) {
    res.json({
      error: err.message,
      stack: err.stack?.split('\n').slice(0, 5),
      code: (err as any).code,
      database_url: process.env.DATABASE_URL ? "set" : "missing",
    });
  }
});

export default router;

import { Router } from "express";
import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";
import { DEFAULT_SETTINGS } from "../lib/settings";

const router = Router();

// GET /api/settings
router.get("/", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const allSettings = await db.select().from(appSettingsTable);
    const settingMap = new Map(allSettings.map((s) => [s.key, s]));

    // Merge with defaults, masking secrets
    const result = DEFAULT_SETTINGS.map((def) => {
      const stored = settingMap.get(def.key);
      const value = stored?.value ?? null;
      return {
        key: def.key,
        value: def.isSecret && value ? `••••${value.slice(-4)}` : value,
        isSecret: def.isSecret,
        description: def.description ?? stored?.description ?? null,
      };
    });

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// PUT /api/settings
router.put("/", ...adminAuth, async (req: AuthRequest, res) => {
  try {
    const { settings } = req.body as { settings: Array<{ key: string; value: string }> };
    if (!Array.isArray(settings)) return res.status(400).json({ error: "settings array required" });

    for (const { key, value } of settings) {
      if (!key || value === undefined) continue;
      // Don't save masked values (user didn't change them)
      if (value.startsWith("••••")) continue;

      const existing = await db.select().from(appSettingsTable).where(eq(appSettingsTable.key, key)).limit(1);
      const def = DEFAULT_SETTINGS.find((d) => d.key === key);

      if (existing.length > 0) {
        await db.update(appSettingsTable).set({ value, updatedAt: new Date() }).where(eq(appSettingsTable.key, key));
      } else {
        await db.insert(appSettingsTable).values({
          key,
          value,
          isSecret: def?.isSecret ?? false,
          description: def?.description ?? null,
        });
      }
    }

    res.json({ message: "Settings saved successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;

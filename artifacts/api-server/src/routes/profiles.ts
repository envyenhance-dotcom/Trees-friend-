import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import type { AuthRequest } from "../lib/auth";

const router = Router();

/**
 * INITIAL_ADMIN_EMAILS — comma-separated list of email addresses that are
 * automatically promoted to "admin" role on first profile sync.
 *
 * Set this as a Replit Secret (env var) named INITIAL_ADMIN_EMAILS.
 * Example: INITIAL_ADMIN_EMAILS=alice@example.com,bob@example.com
 *
 * This is an industry-standard bootstrap mechanism. Once promoted, admins
 * can manage other roles from the Admin → Users panel. The env var is only
 * consulted during /sync — it does not override manual role changes.
 */
function getInitialAdminEmails(): Set<string> {
  const raw = process.env.INITIAL_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

// POST /api/profiles/sync — create or upsert profile from Clerk data
router.post("/sync", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { clerkUserId, email, displayName } = req.body as {
      clerkUserId: string;
      email?: string;
      displayName?: string;
    };

    if (!clerkUserId || clerkUserId !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const adminEmails = getInitialAdminEmails();
    const emailLower = (email ?? "").toLowerCase();
    const shouldBeAdmin = emailLower && adminEmails.has(emailLower);

    const existing = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const updates: Partial<typeof profilesTable.$inferInsert> = {};

      if (email) updates.email = email;
      // Only set displayName if not yet set (don't overwrite user customisations)
      if (displayName && !current.displayName) updates.displayName = displayName;
      // Promote to admin if in the bootstrap list and not already admin
      if (shouldBeAdmin && current.role !== "admin") updates.role = "admin";

      const [p] = await db
        .update(profilesTable)
        .set(updates)
        .where(eq(profilesTable.clerkUserId, clerkUserId))
        .returning();
      return res.json(p);
    }

    // New profile — assign role
    const [profile] = await db
      .insert(profilesTable)
      .values({
        clerkUserId,
        email,
        displayName,
        role: shouldBeAdmin ? "admin" : "buyer",
      })
      .returning();

    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to sync profile" });
  }
});

// GET /api/profiles/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, req.userId!))
      .limit(1);
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// PUT /api/profiles/me — update display name and store media
router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, logoUrl, bannerUrl } = req.body as {
      displayName?: string;
      logoUrl?: string;
      bannerUrl?: string;
    };
    const [profile] = await db
      .update(profilesTable)
      .set({ displayName, logoUrl, bannerUrl })
      .where(eq(profilesTable.clerkUserId, req.userId!))
      .returning();
    if (!profile) return res.status(404).json({ error: "Profile not found" });
    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// POST /api/profiles/become-seller — upgrade buyer to seller with business info
router.post("/become-seller", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { displayName, phone, city, address, businessDescription } = req.body as {
      displayName?: string;
      phone?: string;
      city?: string;
      address?: string;
      businessDescription?: string;
    };

    // Fetch current profile
    const [current] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkUserId, req.userId!))
      .limit(1);

    if (!current) return res.status(404).json({ error: "Profile not found" });

    // Admins don't need to "become" sellers — they already have access
    if (current.role === "admin") {
      return res.json(current);
    }

    const updates: Partial<typeof profilesTable.$inferInsert> = {
      role: "seller",
    };
    if (displayName) updates.displayName = displayName;
    if (phone) updates.phone = phone;
    if (city) updates.city = city;
    if (address) updates.address = address;
    if (businessDescription) updates.businessDescription = businessDescription;

    const [profile] = await db
      .update(profilesTable)
      .set(updates)
      .where(eq(profilesTable.clerkUserId, req.userId!))
      .returning();

    res.json(profile);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to upgrade account" });
  }
});

export default router;

import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
  profileId?: number;
  role?: string;
}

/** Extracts Clerk userId and attaches it. Returns 401 if not authenticated. */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

/** Loads the DB profile and attaches profileId + role. Must come after requireAuth. */
export const loadProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkUserId, req.userId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Profile not found. Please sync your profile." });
    return;
  }
  if (profile.isSuspended) {
    res.status(403).json({ error: "Your account has been suspended." });
    return;
  }
  req.profileId = profile.id;
  req.role = profile.role;
  next();
};

/** Requires profile to be loaded and role to be seller or admin */
export const requireSeller = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.role !== "seller" && req.role !== "admin") {
    res.status(403).json({ error: "Seller or admin access required" });
    return;
  }
  next();
};

/** Requires profile to be loaded and role to be admin */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

/** Combined: requireAuth + loadProfile */
export const auth = [requireAuth, loadProfile];
/** Combined: requireAuth + loadProfile + requireSeller */
export const sellerAuth = [requireAuth, loadProfile, requireSeller];
/** Combined: requireAuth + loadProfile + requireAdmin */
export const adminAuth = [requireAuth, loadProfile, requireAdmin];

import { db, appSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string | null>> {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(
      // Use OR logic: fetch all matching keys
      keys.length > 0
        ? eq(appSettingsTable.key, keys[0]) // overridden below
        : eq(appSettingsTable.key, "")
    );
  // Simple approach: fetch all and filter
  const all = await db.select().from(appSettingsTable);
  const result: Record<string, string | null> = {};
  for (const k of keys) {
    result[k] = all.find((r) => r.key === k)?.value ?? null;
  }
  return result;
}

export const SETTING_KEYS = {
  BKASH_APP_KEY: "BKASH_APP_KEY",
  BKASH_APP_SECRET: "BKASH_APP_SECRET",
  BKASH_USERNAME: "BKASH_USERNAME",
  BKASH_PASSWORD: "BKASH_PASSWORD",
  BKASH_BASE_URL: "BKASH_BASE_URL",
  RESEND_API_KEY: "RESEND_API_KEY",
  COURIER_ENCRYPTION_KEY: "COURIER_ENCRYPTION_KEY",
} as const;

export const DEFAULT_SETTINGS = [
  { key: SETTING_KEYS.BKASH_APP_KEY, value: null as null | string, isSecret: true, description: "bKash Merchant App Key" },
  { key: SETTING_KEYS.BKASH_APP_SECRET, value: null as null | string, isSecret: true, description: "bKash Merchant App Secret" },
  { key: SETTING_KEYS.BKASH_USERNAME, value: null as null | string, isSecret: true, description: "bKash Merchant Username" },
  { key: SETTING_KEYS.BKASH_PASSWORD, value: null as null | string, isSecret: true, description: "bKash Merchant Password" },
  { key: SETTING_KEYS.BKASH_BASE_URL, value: "https://tokenized.sandbox.bka.sh/v1.2.0-beta", isSecret: false, description: "bKash API Base URL (use sandbox for testing)" },
  { key: SETTING_KEYS.RESEND_API_KEY, value: null as null | string, isSecret: true, description: "Resend API Key for email notifications" },
  { key: SETTING_KEYS.COURIER_ENCRYPTION_KEY, value: null as null | string, isSecret: true, description: "32-char key to encrypt courier API credentials" },
];

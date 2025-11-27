// src/lib/helper.ts
import crypto from "crypto";

/**
 * Generate ID berbasis UUID
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Helper buat parse string image_urls dari DB.
 * Support:
 *  - '["http://...","http://..."]'      (JSON array)
 *  - '"http://..."'                     (JSON string)
 *  - 'http://...'                       (plain string)
 *  - 'http://a.jpg,http://b.jpg'       (comma separated)
 */
export function parseImageUrlsString(str: string): string[] {
  if (!str) return [];

  const trimmed = str.trim();

  // Coba parse sebagai JSON dulu
  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string");
    }

    if (typeof parsed === "string") {
      return [parsed];
    }
  } catch {
    // kalau gagal JSON.parse, kita fallback di bawah
  }

  // Fallback: anggap string biasa, bisa single URL atau comma-separated
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

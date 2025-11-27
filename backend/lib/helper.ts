/**
 * Helper buat parse string image_urls dari DB
 * Support:
 *  - '["http://...","http://..."]'      (JSON array)
 *  - '"http://..."'                     (JSON string)
 *  - 'http://...'                       (plain string)
 *  - 'http://a.jpg,http://b.jpg'       (comma separated)
 */
export function parseImageUrlsString(str: string): string[] {
  // Coba parse sebagai JSON dulu
  try {
    const parsed = JSON.parse(str);

    if (Array.isArray(parsed)) {
      return parsed.filter((x) => typeof x === "string");
    }

    if (typeof parsed === "string") {
      return [parsed];
    }
  } catch {
    // kalau gagal, jatuh ke fallback di bawah
  }

  // Fallback: anggap string biasa, bisa single URL atau comma-separated
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function generateId(): string {
  return crypto.randomUUID();
}

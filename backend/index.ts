import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

import { query } from "./lib/db";
import { NewsArticleDto, NewsCategory, NewsRow } from "./types";
import { generateId, parseImageUrlsString } from "./lib/helper";

const app = express();
const PORT = 4000;

/* -------------------------------------------------------------------------- */
/*                          KONFIGURASI UPLOAD MEDIA                          */
/* -------------------------------------------------------------------------- */

// Folder root untuk upload
const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const NEWS_UPLOAD_DIR = path.join(UPLOAD_ROOT, "news");

// Pastikan direktori upload ada
if (!fs.existsSync(NEWS_UPLOAD_DIR)) {
  fs.mkdirSync(NEWS_UPLOAD_DIR, { recursive: true });
}

// Konfigurasi storage untuk multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, NEWS_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname); // .jpg, .png, dll
    const base = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "-")
      .toLowerCase();
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${base}${ext}`);
  },
});

// Hanya izinkan file gambar
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diperbolehkan"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5MB per file
  },
});

// Serve file statis dari folder uploads
app.use("/uploads", express.static(UPLOAD_ROOT));

/* -------------------------------------------------------------------------- */
/*                                 MIDDLEWARE                                 */
/* -------------------------------------------------------------------------- */

app.use(cors());
app.use(
  express.json({
    limit: "20mb", // tetap, untuk payload JSON umum
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const ALLOWED_CATEGORIES: NewsCategory[] = [
  "company",
  "division",
  "industry",
  "press",
];

function mapNewsRow(row: NewsRow): NewsArticleDto {
  let imageUrls: string[] = [];

  const raw = row.image_urls as any;

  if (raw != null) {
    // 1) Kalau sudah array (kolom JSON sudah di-parse driver)
    if (Array.isArray(raw)) {
      imageUrls = raw.filter((x) => typeof x === "string");
    }
    // 2) Kalau Buffer (misalnya kolom TEXT/BLOB)
    else if (Buffer.isBuffer(raw)) {
      const str = raw.toString("utf-8").trim();
      imageUrls = parseImageUrlsString(str);
    }
    // 3) Kalau string (case paling umum)
    else if (typeof raw === "string") {
      const str = raw.trim();
      if (str) {
        imageUrls = parseImageUrlsString(str);
      }
    }
  }

  const dateSource = row.published_at ?? row.created_at ?? null;

  return {
    id: row.id,
    date: dateSource ? new Date(dateSource).toISOString() : null,
    category: row.category,
    title: {
      id: row.title_id,
      en: row.title_en ?? "",
      cn: row.title_cn ?? "",
    },
    content: {
      id: row.content_id,
      en: row.content_en ?? "",
      cn: row.content_cn ?? "",
    },
    imageUrls,
  };
}

/* -------------------------------------------------------------------------- */
/*                          ROUTES: UPLOAD MEDIA TERPISAH                     */
/* -------------------------------------------------------------------------- */

/**
 * POST /api/news/upload-image
 * Upload 1 file gambar
 * Form-data:
 *   file: (file gambar)
 *
 * Response:
 *   { url: "http://host/uploads/news/xxx.jpg" }
 */
app.post(
  "/api/news/upload-image",
  upload.single("file"),
  (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ error: "File gambar (field: file) wajib diunggah" });
      }

      const fileUrl = `${req.protocol}://${req.get("host")}/uploads/news/${
        req.file.filename
      }`;

      return res.status(201).json({ url: fileUrl });
    } catch (err: any) {
      return res
        .status(500)
        .json({ error: err.message || "Gagal upload gambar" });
    }
  }
);

/**
 * POST /api/news/upload-images
 * Upload multiple gambar sekaligus
 * Form-data:
 *   files: (multiple file gambar)
 *
 * Response:
 *   { urls: ["http://host/uploads/news/xxx1.jpg", ...] }
 */
app.post(
  "/api/news/upload-images",
  upload.array("files", 10),
  (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[] | undefined;

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "Minimal 1 file gambar (field: files) wajib diunggah",
        });
      }

      const urls = files.map(
        (f) => `${req.protocol}://${req.get("host")}/uploads/news/${f.filename}`
      );

      return res.status(201).json({ urls });
    } catch (err: any) {
      console.error(err);
      return res
        .status(500)
        .json({ error: err.message || "Gagal upload gambar" });
    }
  }
);

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/news
 * List berita dengan pagination
 * Query:
 *   ?page=1&limit=10
 */
app.get("/api/news", async (req: Request, res: Response) => {
  try {
    // --- pagination params ---
    const rawPage = req.query.page?.toString() ?? "1";
    const rawLimit = req.query.limit?.toString() ?? "10";

    let page = parseInt(rawPage, 10);
    let limit = parseInt(rawLimit, 10);

    if (Number.isNaN(page) || page < 1) page = 1;
    if (Number.isNaN(limit) || limit < 1) limit = 10;
    if (limit > 50) limit = 50; // hard cap biar ga jebol

    const offset = (page - 1) * limit;

    // --- total count ---
    interface CountRow {
      total: number;
    }

    const countRows = await query<CountRow>(
      "SELECT COUNT(*) AS total FROM news"
    );
    const countRow = countRows[0];
    const total = countRow ? Number(countRow.total) : 0;
    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

    // --- data query ---
    const rows = await query<NewsRow>(
      `
      SELECT
        id,
        title_id,
        title_en,
        title_cn,
        content_id,
        content_en,
        content_cn,
        category,
        image_urls,
        published_at,
        created_at,
        updated_at
      FROM news
      ORDER BY COALESCE(published_at, created_at) DESC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const data = rows.map(mapNewsRow);

    res.json({
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
      data,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * GET /api/news/:id
 * Ambil detail 1 news
 */
app.get("/api/news/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rows = await query<NewsRow>(
      `
      SELECT
        id,
        title_id,
        title_en,
        title_cn,
        content_id,
        content_en,
        content_cn,
        category,
        image_urls,
        published_at,
        created_at,
        updated_at
      FROM news
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "News not found" });
    }

    res.json({ data: mapNewsRow(row) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * POST /api/news
 * Create berita baru
 *
 * Sekarang diasumsikan:
 *  - imageUrls berisi array URL (hasil dari upload-image / upload-images)
 *  - BUKAN lagi base64 dari frontend
 */
app.post("/api/news", async (req: Request, res: Response) => {
  try {
    const { title, content, category, imageUrls, date } = req.body || {};

    if (!title?.id || !content?.id || !category) {
      return res
        .status(400)
        .json({ error: "title.id, content.id, dan category wajib diisi" });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const id = generateId();
    const publishedAt = date ? new Date(date) : new Date();
    const images = Array.isArray(imageUrls)
      ? imageUrls.filter((x: any) => typeof x === "string")
      : [];

    await query(
      `
      INSERT INTO news (
        id,
        title_id, title_en, title_cn,
        content_id, content_en, content_cn,
        category,
        image_urls,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        title.id,
        title.en ?? "",
        title.cn ?? "",
        content.id,
        content.en ?? "",
        content.cn ?? "",
        category,
        JSON.stringify(images),
        publishedAt,
      ]
    );

    const dto: NewsArticleDto = {
      id,
      date: publishedAt.toISOString(),
      category,
      title: {
        id: title.id,
        en: title.en ?? "",
        cn: title.cn ?? "",
      },
      content: {
        id: content.id,
        en: content.en ?? "",
        cn: content.cn ?? "",
      },
      imageUrls: images,
    };

    res.status(201).json({ data: dto });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * PUT /api/news/:id
 * Update berita
 */
app.put("/api/news/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, imageUrls, date } = req.body || {};

    if (!title?.id || !content?.id || !category) {
      return res
        .status(400)
        .json({ error: "title.id, content.id, dan category wajib diisi" });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Invalid category" });
    }

    const publishedAt = date ? new Date(date) : null;
    const images = Array.isArray(imageUrls)
      ? imageUrls.filter((x: any) => typeof x === "string")
      : [];

    const params: any[] = [
      title.id,
      title.en ?? "",
      title.cn ?? "",
      content.id,
      content.en ?? "",
      content.cn ?? "",
      category,
      JSON.stringify(images),
    ];

    let sql = `
      UPDATE news
      SET
        title_id = ?,
        title_en = ?,
        title_cn = ?,
        content_id = ?,
        content_en = ?,
        content_cn = ?,
        category = ?,
        image_urls = ?
    `;

    if (publishedAt) {
      sql += `, published_at = ? `;
      params.push(publishedAt);
    }

    sql += `WHERE id = ?`;
    params.push(id);

    await query<any>(sql, params);

    const rows = await query<NewsRow>(
      `
      SELECT
        id,
        title_id,
        title_en,
        title_cn,
        content_id,
        content_en,
        content_cn,
        category,
        image_urls,
        published_at,
        created_at,
        updated_at
      FROM news
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "News not found" });
    }

    res.json({ data: mapNewsRow(row) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * DELETE /api/news/:id
 * Hapus berita
 */
app.delete("/api/news/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query<any>("DELETE FROM news WHERE id = ?", [id]);

    // cek lagi apakah masih ada
    const rows = await query<NewsRow>(
      "SELECT id FROM news WHERE id = ? LIMIT 1",
      [id]
    );
    const row = rows[0];
    if (row) {
      return res.status(500).json({ error: "Failed to delete news" });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * GET /api/db-test
 * Cek koneksi DB
 */
app.get("/api/db-test", async (_: Request, res: Response) => {
  try {
    const tables = await query<any>("SHOW TABLES");
    res.json({ ok: true, tables });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

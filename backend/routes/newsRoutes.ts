import { Request, Response, Router } from 'express';
import { query } from '../lib/db';
import { generateId, parseImageUrlsString } from '../lib/helper';
import { NewsArticleDto, NewsCategory, NewsRow } from '../types';

// ====== TAMBAHAN UNTUK UPLOAD GAMBAR ======
import fs from 'fs';
import multer from 'multer';
import path from 'path';

const router = Router();

const ALLOWED_CATEGORIES: NewsCategory[] = ['company', 'division', 'industry', 'press'];

// ====== CONFIG UPLOAD GAMBAR NEWS ======
const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads'); // ../uploads
const NEWS_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'news'); // ../uploads/news

// Pastikan folder ada
if (!fs.existsSync(NEWS_UPLOAD_DIR)) {
  fs.mkdirSync(NEWS_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (__, _, cb) => {
    cb(null, NEWS_UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base || 'image'}-${unique}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar (image/*)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10,
  },
});

// ====== MAPPER NEWS (VERSI LAMA, MULTI BAHASA) ======
function mapNewsRow(row: NewsRow): NewsArticleDto {
  let imageUrls: string[] = [];

  const raw = row.image_urls as any;

  if (raw != null) {
    if (Array.isArray(raw)) {
      imageUrls = raw.filter((x) => typeof x === 'string');
    } else if (Buffer.isBuffer(raw)) {
      const str = raw.toString('utf-8').trim();
      imageUrls = parseImageUrlsString(str);
    } else if (typeof raw === 'string') {
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
      en: row.title_en ?? '',
      cn: row.title_cn ?? '',
    },
    content: {
      id: row.content_id,
      en: row.content_en ?? '',
      cn: row.content_cn ?? '',
    },
    imageUrls,
  };
}

/**
 * POST /api/news/upload-images
 * Upload multiple image file untuk berita.
 * Field form-data: files (multiple)
 *
 * Response:
 *  { urls: string[] }
 *  Contoh: { "urls": ["/uploads/news/image-123.png", ...] }
 */
router.post('/upload-images', upload.array('files', 10), (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang di-upload' });
    }

    // URL relatif untuk dipakai FE
    const urls = files.map((file) => `/uploads/news/${file.filename}`);

    return res.json({ urls });
  } catch (err: any) {
    console.error('Upload images error:', err);
    return res.status(500).json({ error: err.message || 'Gagal upload gambar' });
  }
});

/**
 * GET /api/news
 * List berita dengan pagination
 * Query:
 *   ?page=1&limit=10
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // --- pagination params ---
    const rawPage = req.query.page?.toString() ?? '1';
    const rawLimit = req.query.limit?.toString() ?? '10';

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

    const countRows = await query<CountRow>('SELECT COUNT(*) AS total FROM news');
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
      [limit, offset],
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
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * GET /api/news/:id
 * Ambil detail 1 news
 */
router.get('/:id', async (req: Request, res: Response) => {
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
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ data: mapNewsRow(row) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * POST /api/news
 * Create berita baru
 *
 * Diasumsikan:
 *  - imageUrls berisi array URL (hasil dari upload-image / upload-images)
 *  - BUKAN lagi base64 dari frontend
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, content, category, imageUrls, date } = req.body || {};

    if (!title?.id || !content?.id || !category) {
      return res.status(400).json({ error: 'title.id, content.id, dan category wajib diisi' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const id = generateId();
    const publishedAt = date ? new Date(date) : new Date();
    const images = Array.isArray(imageUrls)
      ? imageUrls.filter((x: any) => typeof x === 'string')
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
        title.en ?? '',
        title.cn ?? '',
        content.id,
        content.en ?? '',
        content.cn ?? '',
        category,
        JSON.stringify(images),
        publishedAt,
      ],
    );

    const dto: NewsArticleDto = {
      id,
      date: publishedAt.toISOString(),
      category,
      title: {
        id: title.id,
        en: title.en ?? '',
        cn: title.cn ?? '',
      },
      content: {
        id: content.id,
        en: content.en ?? '',
        cn: content.cn ?? '',
      },
      imageUrls: images,
    };

    res.status(201).json({ data: dto });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * PUT /api/news/:id
 * Update berita
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, category, imageUrls, date } = req.body || {};

    if (!title?.id || !content?.id || !category) {
      return res.status(400).json({ error: 'title.id, content.id, dan category wajib diisi' });
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const publishedAt = date ? new Date(date) : null;
    const images = Array.isArray(imageUrls)
      ? imageUrls.filter((x: any) => typeof x === 'string')
      : [];

    const params: any[] = [
      title.id,
      title.en ?? '',
      title.cn ?? '',
      content.id,
      content.en ?? '',
      content.cn ?? '',
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
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ data: mapNewsRow(row) });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * DELETE /api/news/:id
 * Hapus berita
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query<any>('DELETE FROM news WHERE id = ?', [id]);

    // cek lagi apakah masih ada
    const rows = await query<NewsRow>('SELECT id FROM news WHERE id = ? LIMIT 1', [id]);
    const row = rows[0];
    if (row) {
      return res.status(500).json({ error: 'Failed to delete news' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

export default router;

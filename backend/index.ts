// index.ts (atau server.ts)
import cors from 'cors';
import crypto from 'crypto';
import express, { Request, Response } from 'express';
import { query } from './lib/db';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

type NewsCategory = 'company' | 'division' | 'industry' | 'press';

interface NewsRow {
  id: string;
  title_id: string;
  title_en: string | null;
  title_cn: string | null;
  content_id: string;
  content_en: string | null;
  content_cn: string | null;
  category: NewsCategory;
  image_urls: string | null; // JSON string di DB
  published_at: Date | string | null;
  created_at?: Date | string;
  updated_at?: Date | string;
}

interface NewsArticleDto {
  id: string;
  date: string | null; // ISO string
  category: NewsCategory;
  title: {
    id: string;
    en: string;
    cn: string;
  };
  content: {
    id: string;
    en: string;
    cn: string;
  };
  imageUrls: string[];
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

const ALLOWED_CATEGORIES: NewsCategory[] = ['company', 'division', 'industry', 'press'];

function mapNewsRow(row: NewsRow): NewsArticleDto {
  let imageUrls: string[] = [];

  if (row.image_urls) {
    try {
      const parsed = JSON.parse(row.image_urls);
      if (Array.isArray(parsed)) {
        imageUrls = parsed.filter((x) => typeof x === 'string');
      }
    } catch {
      // kalau gagal parse, biarin kosong
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

function generateId(): string {
  return crypto.randomUUID();
}

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/news
 * List berita dengan pagination
 * Query:
 *   ?page=1&limit=10
 */
app.get('/api/news', async (req: Request, res: Response) => {
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
app.get('/api/news/:id', async (req: Request, res: Response) => {
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
 */
app.post('/api/news', async (req: Request, res: Response) => {
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
app.put('/api/news/:id', async (req: Request, res: Response) => {
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
app.delete('/api/news/:id', async (req: Request, res: Response) => {
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

/**
 * GET /api/db-test
 * Cek koneksi DB
 */
app.get('/api/db-test', async (_: Request, res: Response) => {
  try {
    const tables = await query<any>('SHOW TABLES');
    res.json({ ok: true, tables });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});

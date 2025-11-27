// src/routes/partnerRoutes.ts
import { Request, Response, Router } from 'express';
import { query } from '../lib/db';
import { generateId } from '../lib/helper';

// ====== TAMBAHAN UNTUK UPLOAD GAMBAR LOGO ======
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { PartnerDto, PartnerRow } from '../types';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                         CONFIG UPLOAD LOGO PARTNER                         */
/* -------------------------------------------------------------------------- */

const UPLOAD_BASE_DIR = path.join(__dirname, '..', 'uploads'); // ../uploads
const PARTNER_UPLOAD_DIR = path.join(UPLOAD_BASE_DIR, 'partners'); // ../uploads/partners

// Pastikan folder ada
if (!fs.existsSync(PARTNER_UPLOAD_DIR)) {
  fs.mkdirSync(PARTNER_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (__, _, cb) => {
    cb(null, PARTNER_UPLOAD_DIR);
  },
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base || 'logo'}-${unique}${ext}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
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
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
});

/**
 * POST /api/partners/upload-logo
 * Upload 1 file logo partner.
 *
 * Form-data:
 *  - file: <image>
 *
 * Response:
 *  { url: string, path: string }
 *  Contoh:
 *    {
 *      "url": "http://localhost:4000/uploads/partners/logo-123.png",
 *      "path": "/uploads/partners/logo-123.png"
 *    }
 */
router.post('/upload-logo', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File logo wajib di-upload' });
    }

    const publicPath = `/uploads/partners/${req.file.filename}`;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${baseUrl}${publicPath}`;

    return res.json({
      url: fullUrl,
      path: publicPath,
    });
  } catch (err: any) {
    console.error('Upload logo partner error:', err);
    return res.status(500).json({ error: err.message || 'Gagal upload logo' });
  }
});

/* -------------------------------------------------------------------------- */
/*                          Helper mapping row -> DTO                         */
/* -------------------------------------------------------------------------- */

function mapPartnerRow(row: PartnerRow): PartnerDto {
  return {
    id: row.id,
    name: row.name,
    logoUrl: row.logo_url,
  };
}

/* -------------------------------------------------------------------------- */
/*                               PARTNERS ROUTES                              */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/partners
 * Ambil semua partner (tanpa pagination dulu)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await query<PartnerRow>(
      `
      SELECT
        id,
        name,
        logo_url,
        created_at,
        updated_at
      FROM partners
      ORDER BY created_at DESC
      `,
    );

    const data = rows.map(mapPartnerRow);
    res.json({ data });
  } catch (err: any) {
    console.error('Error GET /api/partners:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * GET /api/partners/:id
 * Ambil detail 1 partner
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rows = await query<PartnerRow>(
      `
      SELECT
        id,
        name,
        logo_url,
        created_at,
        updated_at
      FROM partners
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({ data: mapPartnerRow(row) });
  } catch (err: any) {
    console.error('Error GET /api/partners/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * POST /api/partners
 *
 * Body:
 * {
 *   name: string;
 *   logoUrl: string;   // hasil dari /api/partners/upload-logo
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, logoUrl } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name wajib diisi' });
    }
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
      return res.status(400).json({ error: 'logoUrl wajib diisi' });
    }

    const id = generateId();

    await query(
      `
      INSERT INTO partners (
        id,
        name,
        logo_url
      )
      VALUES (?, ?, ?)
      `,
      [id, name.trim(), logoUrl.trim()],
    );

    const dto: PartnerDto = {
      id,
      name: name.trim(),
      logoUrl: logoUrl.trim(),
    };

    res.status(201).json({ data: dto });
  } catch (err: any) {
    console.error('Error POST /api/partners:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * PUT /api/partners/:id
 *
 * Body sama seperti POST
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, logoUrl } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name wajib diisi' });
    }
    if (!logoUrl || typeof logoUrl !== 'string' || !logoUrl.trim()) {
      return res.status(400).json({ error: 'logoUrl wajib diisi' });
    }

    await query(
      `
      UPDATE partners
      SET
        name = ?,
        logo_url = ?
      WHERE id = ?
      `,
      [name.trim(), logoUrl.trim(), id],
    );

    const rows = await query<PartnerRow>(
      `
      SELECT
        id,
        name,
        logo_url,
        created_at,
        updated_at
      FROM partners
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({ data: mapPartnerRow(row) });
  } catch (err: any) {
    console.error('Error PUT /api/partners/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * DELETE /api/partners/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM partners WHERE id = ?', [id]);

    const rows = await query<{ id: string }>('SELECT id FROM partners WHERE id = ? LIMIT 1', [id]);

    if (rows[0]) {
      return res.status(500).json({ error: 'Failed to delete partner' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error DELETE /api/partners/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

export default router;

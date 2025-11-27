// src/routes/teamRoutes.ts
import { Request, Response, Router } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

import { query } from '../lib/db';
import { generateId } from '../lib/helper';
import { TeamMemberDto, TeamMemberRow } from '../types';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                         Konfigurasi upload gambar                          */
/* -------------------------------------------------------------------------- */

// Folder penyimpanan file untuk foto team
const TEAM_UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'team');

// Pastikan folder exists
if (!fs.existsSync(TEAM_UPLOAD_DIR)) {
  fs.mkdirSync(TEAM_UPLOAD_DIR, { recursive: true });
}

// Storage multer: simpan file ke disk
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEAM_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    const ts = Date.now();
    cb(null, `${base}-${ts}${ext}`);
  },
});

// Filter: hanya ijinkan file image/*
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('File harus berupa gambar'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5MB
  },
});

/**
 * POST /api/team/upload-image
 * Upload 1 gambar anggota tim
 *
 * FormData:
 *   - file: <gambar>
 *
 * Response:
 *   {
 *     "url": "http://localhost:4000/uploads/team/namafile-123456.jpg",
 *     "path": "/uploads/team/namafile-123456.jpg"
 *   }
 */
router.post('/upload-image', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File gambar wajib diunggah' });
    }

    // path publik yang di-serve oleh Express
    const publicPath = `/uploads/team/${req.file.filename}`;

    // base URL backend, misal http://localhost:4000
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${baseUrl}${publicPath}`;

    return res.json({
      url: fullUrl, // ini yang bisa langsung dipakai di <img src="...">
      path: publicPath,
    });
  } catch (err: any) {
    console.error('Error upload image team:', err);
    return res.status(500).json({ error: err.message || 'Upload gambar gagal' });
  }
});

/* -------------------------------------------------------------------------- */
/*                          Helper mapping row -> DTO                         */
/* -------------------------------------------------------------------------- */

function mapTeamRow(row: TeamMemberRow): TeamMemberDto {
  return {
    id: row.id,
    name: row.name,
    title: {
      id: row.title_id,
      en: '', // DB cuma simpan 1 bahasa → kosongkan en/cn
      cn: '',
    },
    bio: {
      id: row.bio_id,
      en: '',
      cn: '',
    },
    imageUrl: row.image_url,
    linkedinUrl: row.linkedin_url ?? '',
  };
}

/* -------------------------------------------------------------------------- */
/*                             TEAM MEMBERS ROUTES                            */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/team
 * Ambil semua anggota team (tanpa pagination dulu)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const rows = await query<TeamMemberRow>(
      `
      SELECT
        id,
        name,
        title_id,
        bio_id,
        image_url,
        linkedin_url,
        created_at,
        updated_at
      FROM team_members
      ORDER BY created_at DESC
      `,
    );

    const data = rows.map(mapTeamRow);
    res.json({ data });
  } catch (err: any) {
    console.error('Error GET /api/team:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * GET /api/team/:id
 * Ambil detail 1 anggota team
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rows = await query<TeamMemberRow>(
      `
      SELECT
        id,
        name,
        title_id,
        bio_id,
        image_url,
        linkedin_url,
        created_at,
        updated_at
      FROM team_members
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({ data: mapTeamRow(row) });
  } catch (err: any) {
    console.error('Error GET /api/team/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * POST /api/team
 *
 * Body (Omit<TeamMember, "id">):
 * {
 *   name: string;
 *   title: { id: string; en?: string; cn?: string };
 *   bio: { id: string; en?: string; cn?: string };
 *   imageUrl: string;        // hasil dari /api/team/upload-image
 *   linkedinUrl?: string;
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, title, bio, imageUrl, linkedinUrl } = req.body || {};

    // Validasi basic
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name wajib diisi' });
    }
    if (!title?.id || typeof title.id !== 'string' || !title.id.trim()) {
      return res.status(400).json({ error: 'title.id wajib diisi' });
    }
    if (!bio?.id || typeof bio.id !== 'string' || !bio.id.trim()) {
      return res.status(400).json({ error: 'bio.id wajib diisi' });
    }
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({ error: 'imageUrl wajib diisi' });
    }

    const id = generateId();

    await query(
      `
      INSERT INTO team_members (
        id,
        name,
        title_id,
        bio_id,
        image_url,
        linkedin_url
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id, name.trim(), title.id.trim(), bio.id.trim(), imageUrl.trim(), linkedinUrl || null],
    );

    const dto: TeamMemberDto = {
      id,
      name: name.trim(),
      title: {
        id: title.id.trim(),
        en: title.en ?? '',
        cn: title.cn ?? '',
      },
      bio: {
        id: bio.id.trim(),
        en: bio.en ?? '',
        cn: bio.cn ?? '',
      },
      imageUrl: imageUrl.trim(),
      linkedinUrl: linkedinUrl || '',
    };

    res.status(201).json({ data: dto });
  } catch (err: any) {
    console.error('Error POST /api/team:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * PUT /api/team/:id
 *
 * Body sama seperti POST
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, title, bio, imageUrl, linkedinUrl } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name wajib diisi' });
    }
    if (!title?.id || typeof title.id !== 'string' || !title.id.trim()) {
      return res.status(400).json({ error: 'title.id wajib diisi' });
    }
    if (!bio?.id || typeof bio.id !== 'string' || !bio.id.trim()) {
      return res.status(400).json({ error: 'bio.id wajib diisi' });
    }
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return res.status(400).json({ error: 'imageUrl wajib diisi' });
    }

    await query(
      `
      UPDATE team_members
      SET
        name = ?,
        title_id = ?,
        bio_id = ?,
        image_url = ?,
        linkedin_url = ?
      WHERE id = ?
      `,
      [name.trim(), title.id.trim(), bio.id.trim(), imageUrl.trim(), linkedinUrl || null, id],
    );

    const rows = await query<TeamMemberRow>(
      `
      SELECT
        id,
        name,
        title_id,
        bio_id,
        image_url,
        linkedin_url,
        created_at,
        updated_at
      FROM team_members
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json({ data: mapTeamRow(row) });
  } catch (err: any) {
    console.error('Error PUT /api/team/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * DELETE /api/team/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM team_members WHERE id = ?', [id]);

    const rows = await query<{ id: string }>('SELECT id FROM team_members WHERE id = ? LIMIT 1', [
      id,
    ]);

    if (rows[0]) {
      return res.status(500).json({ error: 'Failed to delete team member' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error DELETE /api/team/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

export default router;

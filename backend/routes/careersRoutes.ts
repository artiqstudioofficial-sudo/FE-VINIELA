// src/routes/careersRoutes.ts
import { Request, Response, Router } from 'express';
import { query } from '../lib/db';
import { generateId } from '../lib/helper';
import {
  JobApplicationDto,
  JobApplicationRow,
  JobListingDto,
  JobListingRow,
  JobType,
} from '../types';

// ==== TAMBAHAN UNTUK UPLOAD RESUME ====
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { UPLOAD_ROOT } from '../config/upload';

const router = Router();

/* -------------------------------------------------------------------------- */
/*                         CONFIG UPLOAD FILE RESUME                          */
/* -------------------------------------------------------------------------- */

const RESUME_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'resumes');

if (!fs.existsSync(RESUME_UPLOAD_DIR)) {
  fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });
}

const resumeStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, RESUME_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${base || 'resume'}-${unique}${ext}`);
  },
});

const resumeFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  // boleh .pdf, .doc, .docx
  if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword'
  ) {
    cb(null, true);
  } else {
    cb(new Error('File resume harus berupa PDF atau DOC/DOCX'));
  }
};

const uploadResume = multer({
  storage: resumeStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/* -------------------------------------------------------------------------- */
/*                          Helper mapping row -> DTO                         */
/* -------------------------------------------------------------------------- */

function mapJobRow(row: JobListingRow): JobListingDto {
  const dateSource = row.published_at ?? row.created_at ?? null;

  return {
    id: row.id,
    title: { id: row.title_id },
    location: { id: row.location_id },
    type: row.job_type,
    description: { id: row.description_id },
    responsibilities: { id: row.responsibilities_id },
    qualifications: { id: row.qualifications_id },
    date: dateSource ? new Date(dateSource).toISOString() : null,
  };
}

function mapApplicationRow(row: JobApplicationRow): JobApplicationDto {
  return {
    id: row.id,
    jobId: row.job_id,
    applicantName: row.applicant_name,
    name: row.name,
    email: row.email,
    phone: row.phone,
    resume: row.resume_url,
    resumeFileName: row.resume_filename,
    coverLetter: row.cover_letter ?? '',
    date: new Date(row.applied_at).toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*                             JOB LISTINGS ROUTES                            */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/careers/jobs
 * Ambil semua job (tanpa pagination dulu)
 */
router.get('/jobs', async (_req: Request, res: Response) => {
  try {
    const rows = await query<JobListingRow>(
      `
      SELECT
        id,
        title_id,
        location_id,
        job_type,
        description_id,
        responsibilities_id,
        qualifications_id,
        published_at,
        created_at,
        updated_at
      FROM job_listings
      ORDER BY COALESCE(published_at, created_at) DESC
      `,
    );

    const data = rows.map(mapJobRow);
    res.json({ data });
  } catch (err: any) {
    console.error('Error get /api/careers/jobs:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * GET /api/careers/jobs/:id
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rows = await query<JobListingRow>(
      `
      SELECT
        id,
        title_id,
        location_id,
        job_type,
        description_id,
        responsibilities_id,
        qualifications_id,
        published_at,
        created_at,
        updated_at
      FROM job_listings
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ data: mapJobRow(row) });
  } catch (err: any) {
    console.error('Error get /api/careers/jobs/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * POST /api/careers/jobs
 */
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const { title, location, type, description, responsibilities, qualifications, date } =
      req.body || {};

    if (!title?.id || !location?.id) {
      return res.status(400).json({ error: 'title.id dan location.id wajib diisi' });
    }

    const allowedTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    if (!description?.id || !responsibilities?.id || !qualifications?.id) {
      return res.status(400).json({
        error: 'description.id, responsibilities.id, dan qualifications.id wajib diisi',
      });
    }

    const id = generateId();
    const publishedAt = date ? new Date(date) : new Date();

    await query(
      `
      INSERT INTO job_listings (
        id,
        title_id,
        location_id,
        job_type,
        description_id,
        responsibilities_id,
        qualifications_id,
        published_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        title.id,
        location.id,
        type,
        description.id,
        responsibilities.id,
        qualifications.id,
        publishedAt,
      ],
    );

    const dto: JobListingDto = {
      id,
      title: { id: title.id },
      location: { id: location.id },
      type,
      description: { id: description.id },
      responsibilities: { id: responsibilities.id },
      qualifications: { id: qualifications.id },
      date: publishedAt.toISOString(),
    };

    res.status(201).json({ data: dto });
  } catch (err: any) {
    console.error('Error POST /api/careers/jobs:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * PUT /api/careers/jobs/:id
 */
router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, location, type, description, responsibilities, qualifications, date } =
      req.body || {};

    if (!title?.id || !location?.id) {
      return res.status(400).json({ error: 'title.id dan location.id wajib diisi' });
    }

    const allowedTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    if (!description?.id || !responsibilities?.id || !qualifications?.id) {
      return res.status(400).json({
        error: 'description.id, responsibilities.id, dan qualifications.id wajib diisi',
      });
    }

    const publishedAt = date ? new Date(date) : null;

    const params: any[] = [
      title.id,
      location.id,
      type,
      description.id,
      responsibilities.id,
      qualifications.id,
    ];

    let sql = `
      UPDATE job_listings
      SET
        title_id = ?,
        location_id = ?,
        job_type = ?,
        description_id = ?,
        responsibilities_id = ?,
        qualifications_id = ?
    `;

    if (publishedAt) {
      sql += `, published_at = ? `;
      params.push(publishedAt);
    }

    sql += `WHERE id = ?`;
    params.push(id);

    await query(sql, params);

    const rows = await query<JobListingRow>(
      `
      SELECT
        id,
        title_id,
        location_id,
        job_type,
        description_id,
        responsibilities_id,
        qualifications_id,
        published_at,
        created_at,
        updated_at
      FROM job_listings
      WHERE id = ?
      LIMIT 1
      `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ data: mapJobRow(row) });
  } catch (err: any) {
    console.error('Error PUT /api/careers/jobs/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * DELETE /api/careers/jobs/:id
 */
router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query('DELETE FROM job_listings WHERE id = ?', [id]);

    const rows = await query<{ id: string }>('SELECT id FROM job_listings WHERE id = ? LIMIT 1', [
      id,
    ]);
    if (rows[0]) {
      return res.status(500).json({ error: 'Failed to delete job' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error DELETE /api/careers/jobs/:id:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/* -------------------------------------------------------------------------- */
/*                        JOB APPLICATIONS ROUTES                             */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/careers/applications
 */
router.get('/applications', async (_req, res) => {
  try {
    const rows = await query<JobApplicationRow>(
      `
      SELECT
        a.id,
        a.job_id,
        jl.title_id AS job_title,
        a.name,
        a.email,
        a.phone,
        a.resume_url,
        a.resume_filename,
        a.cover_letter,
        a.applied_at,
        a.created_at,
        a.updated_at,
        a.applicant_name
      FROM job_applications a
      LEFT JOIN job_listings jl ON jl.id = a.job_id
      ORDER BY a.applied_at DESC
      `,
    );

    res.json({ data: rows.map(mapApplicationRow) });
  } catch (err: any) {
    console.error('Error GET /api/careers/applications:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

/**
 * POST /api/careers/applications
 * Body (multipart/form-data):
 *  - fields: jobId, name, email, phone, coverLetter (optional)
 *  - file:   resume (PDF/DOC/DOCX)
 */
router.post('/applications', uploadResume.single('resume'), async (req: Request, res: Response) => {
  try {
    const { jobId, name, email, phone, coverLetter } = req.body || {};
    const file = req.file;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId wajib diisi' });
    }
    if (!name) {
      return res.status(400).json({ error: 'name wajib diisi' });
    }
    if (!email) {
      return res.status(400).json({ error: 'email wajib diisi' });
    }
    if (!phone) {
      return res.status(400).json({ error: 'phone wajib diisi' });
    }
    if (!file) {
      return res.status(400).json({ error: 'File resume wajib di-upload' });
    }

    const id = generateId();
    const appliedAt = new Date();

    const resumeUrl = `/uploads/resumes/${file.filename}`;
    const resumeFilename = file.originalname;

    await query(
      `
        INSERT INTO job_applications (
          id,
          job_id,
          name,
          email,
          phone,
          resume_url,
          resume_filename,
          cover_letter,
          applied_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [id, jobId, name, email, phone, resumeUrl, resumeFilename, coverLetter || null, appliedAt],
    );

    // ambil lagi utk konsisten dengan mapper
    const rows = await query<JobApplicationRow>(
      `
        SELECT
          id,
          job_id,
          applicant_name,
          name,
          email,
          phone,
          resume_url,
          resume_filename,
          cover_letter,
          applied_at,
          created_at,
          updated_at
        FROM job_applications
        WHERE id = ?
        LIMIT 1
        `,
      [id],
    );

    const row = rows[0];
    if (!row) {
      return res.status(500).json({ error: 'Gagal membaca data aplikasi setelah insert' });
    }

    res.status(201).json({ data: mapApplicationRow(row) });
  } catch (err: any) {
    console.error('Error POST /api/careers/applications:', err);
    res.status(500).json({ error: err.message || 'DB error' });
  }
});

export default router;

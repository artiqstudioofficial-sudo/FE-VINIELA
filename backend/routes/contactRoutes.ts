import { Request, Response, Router } from "express";
import { query } from "../lib/db";
import { generateId } from "../lib/helper";
import { ContactMessageDto, ContactMessageRow } from "../types";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                          Helper mapping row -> DTO                         */
/* -------------------------------------------------------------------------- */

function mapContactRow(row: ContactMessageRow): ContactMessageDto {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    // FE pakai msg.date → kita ambil dari created_at
    date: new Date(row.created_at).toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*                             CONTACT MESSAGES API                           */
/* -------------------------------------------------------------------------- */

/**
 * GET /api/contact-messages
 * Ambil semua pesan contact (tanpa pagination dulu)
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const rows = await query<ContactMessageRow>(
      `
      SELECT
        id,
        name,
        email,
        subject,
        message,
        created_at,
        updated_at
      FROM contact_messages
      ORDER BY created_at DESC
      `
    );

    const data = rows.map(mapContactRow);
    res.json({ data });
  } catch (err: any) {
    console.error("Error GET /api/contact-messages:", err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * GET /api/contact-messages/:id
 * Ambil detail 1 pesan contact
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const rows = await query<ContactMessageRow>(
      `
      SELECT
        id,
        name,
        email,
        subject,
        message,
        created_at,
        updated_at
      FROM contact_messages
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "Contact message not found" });
    }

    res.json({ data: mapContactRow(row) });
  } catch (err: any) {
    console.error("Error GET /api/contact-messages/:id:", err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * POST /api/contact-messages
 * Body (JSON):
 * {
 *   name: string;
 *   email: string;
 *   subject: string;
 *   message: string;
 * }
 *
 * Digunakan oleh form "Contact Us" di FE.
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name wajib diisi" });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "email wajib diisi" });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "subject wajib diisi" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message wajib diisi" });
    }

    const id = generateId();
    const now = new Date();

    await query(
      `
      INSERT INTO contact_messages (
        id,
        name,
        email,
        subject,
        message,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [id, name.trim(), email.trim(), subject.trim(), message.trim(), now, now]
    );

    // ambil lagi supaya konsisten dengan mapper
    const rows = await query<ContactMessageRow>(
      `
      SELECT
        id,
        name,
        email,
        subject,
        message,
        created_at,
        updated_at
      FROM contact_messages
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return res
        .status(500)
        .json({ error: "Gagal membaca data contact message setelah insert" });
    }

    res.status(201).json({ data: mapContactRow(row) });
  } catch (err: any) {
    console.error("Error POST /api/contact-messages:", err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * PUT /api/contact-messages/:id
 * (opsional, kalau mau bisa edit dari admin)
 * Body sama seperti POST.
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, subject, message } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name wajib diisi" });
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "email wajib diisi" });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "subject wajib diisi" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message wajib diisi" });
    }

    const now = new Date();

    await query(
      `
      UPDATE contact_messages
      SET
        name = ?,
        email = ?,
        subject = ?,
        message = ?,
        updated_at = ?
      WHERE id = ?
      `,
      [name.trim(), email.trim(), subject.trim(), message.trim(), now, id]
    );

    const rows = await query<ContactMessageRow>(
      `
      SELECT
        id,
        name,
        email,
        subject,
        message,
        created_at,
        updated_at
      FROM contact_messages
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const row = rows[0];
    if (!row) {
      return res.status(404).json({ error: "Contact message not found" });
    }

    res.json({ data: mapContactRow(row) });
  } catch (err: any) {
    console.error("Error PUT /api/contact-messages/:id:", err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

/**
 * DELETE /api/contact-messages/:id
 * Hapus pesan contact
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM contact_messages WHERE id = ?", [id]);

    const rows = await query<{ id: string }>(
      "SELECT id FROM contact_messages WHERE id = ? LIMIT 1",
      [id]
    );
    if (rows[0]) {
      return res
        .status(500)
        .json({ error: "Failed to delete contact message" });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Error DELETE /api/contact-messages/:id:", err);
    res.status(500).json({ error: err.message || "DB error" });
  }
});

export default router;

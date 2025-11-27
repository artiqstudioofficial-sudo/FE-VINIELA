// src/routes/uploadRoutes.ts
import { Router, Request, Response } from "express";
import { upload } from "../config/upload";

const router = Router();

/**
 * POST /api/news/upload-image
 * Upload 1 file gambar
 * Form-data:
 *   file: (file gambar)
 *
 * Response:
 *   { url: "http://host/uploads/news/xxx.jpg" }
 */
router.post(
  "/upload-image",
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
router.post(
  "/upload-images",
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

export default router;

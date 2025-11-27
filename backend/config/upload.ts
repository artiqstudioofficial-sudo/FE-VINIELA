// src/config/upload.ts
import path from "path";
import fs from "fs";
import multer from "multer";

// Folder root untuk upload
export const UPLOAD_ROOT = path.join(__dirname, "..", "..", "uploads");
export const NEWS_UPLOAD_DIR = path.join(UPLOAD_ROOT, "news");

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

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // max 5MB per file
  },
});

// src/index.ts
import cors from "cors";
import express, { Request, Response } from "express";
import path from "path";

import { query } from "./lib/db";
import { UPLOAD_ROOT } from "./config/upload";
import newsRoutes from "./routes/newsRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import careersRoutes from "./routes/careersRoutes";

const app = express();
const PORT = 4000;

/* -------------------------------------------------------------------------- */
/*                               STATIC UPLOADS                               */
/* -------------------------------------------------------------------------- */

// Serve file statis dari folder uploads
app.use("/uploads", express.static(UPLOAD_ROOT));

/* -------------------------------------------------------------------------- */
/*                                 MIDDLEWARE                                 */
/* -------------------------------------------------------------------------- */

app.use(cors());
app.use(
  express.json({
    limit: "20mb",
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

// routes upload media (mounted di /api/news)
app.use("/api/news", uploadRoutes);

// routes news CRUD
app.use("/api/news", newsRoutes);

// routes careers CRUD
app.use("/api/careers", careersRoutes);

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

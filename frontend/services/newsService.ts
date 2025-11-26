// src/services/newsService.ts
import { NewsArticle, NewsCategory } from "../types";

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE ||
  process.env.VITE_API_BASE ||
  "http://localhost:4000";

export type NewsFormPayload = {
  title: { id: string; en: string; cn: string };
  content: { id: string; en: string; cn: string };
  imageUrls: string[];
  category: NewsCategory;
};

export type PaginatedNewsResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  data: NewsArticle[];
};

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

// GET /api/news?page=&limit=
export async function listNews(
  page: number = 1,
  limit: number = 50
): Promise<PaginatedNewsResponse> {
  const url = new URL("/api/news", API_BASE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  return handleJson<PaginatedNewsResponse>(res);
}

// GET /api/news/:id
export async function getNewsById(id: string): Promise<NewsArticle> {
  const res = await fetch(`${API_BASE}/api/news/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const body = await handleJson<{ data: NewsArticle }>(res);
  return body.data;
}

// POST /api/news
export async function createNews(
  payload: NewsFormPayload
): Promise<NewsArticle> {
  alert("test");
  const res = await fetch(`${API_BASE}/api/news`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await handleJson<{ data: NewsArticle }>(res);
  return body.data;
}

// PUT /api/news/:id
export async function updateNews(
  id: string,
  payload: NewsFormPayload
): Promise<NewsArticle> {
  const res = await fetch(`${API_BASE}/api/news/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await handleJson<{ data: NewsArticle }>(res);
  return body.data;
}

// DELETE /api/news/:id
export async function deleteNews(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/news/${id}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  await handleJson(res); // akan throw kalau gagal
}

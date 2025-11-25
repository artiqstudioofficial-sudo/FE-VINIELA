export type NewsCategory = "company" | "division" | "industry" | "press";

export interface NewsRow {
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

export interface NewsArticleDto {
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

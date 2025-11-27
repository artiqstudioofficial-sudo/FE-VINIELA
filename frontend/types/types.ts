/* -------------------------------------------------------------------------- */
/*                                  COMMON                                    */
/* -------------------------------------------------------------------------- */

export type Language = "id" | "en" | "cn";
export type NewsCategory = "company" | "division" | "industry" | "press";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

/* -------------------------------------------------------------------------- */
/*                                    NEWS                                    */
/* -------------------------------------------------------------------------- */

export interface NewsArticle {
  id: string;
  // multi-bahasa (id / en / cn)
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
  category: NewsCategory;
  // sesuai DTO backend: field "date"
  date: string | null;
}

export interface NewsFormPayload {
  title: {
    id: string;
    en?: string;
    cn?: string;
  };
  content: {
    id: string;
    en?: string;
    cn?: string;
  };
  imageUrls: string[];
  category: NewsCategory;
  // opsional kalau mau kirim tanggal publish dari FE
  date?: string | null;
}

export interface PaginatedNewsResponse {
  data: NewsArticle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/* -------------------------------------------------------------------------- */
/*                                   CAREERS                                  */
/* -------------------------------------------------------------------------- */

export interface JobListing {
  id: string;
  // hanya pakai bahasa Indonesia (id) saja
  title: {
    id: string;
  };
  location: {
    id: string;
  };
  type: JobType;
  description: {
    id: string; // HTML string
  };
  responsibilities: {
    id: string; // HTML string
  };
  qualifications: {
    id: string; // HTML string
  };
  // tanggal posting (ISO string dari backend)
  date: string | null;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string; // <== tambahkan name (sesuai backend)
  email: string;
  phone: string;
  resume: string; // resume_url di DB
  resumeFileName: string; // resume_filename di DB
  coverLetter: string | null; // bukan optional, tapi bisa null
  date: string; // ISO string applied_at
}

/* -------------------------------------------------------------------------- */
/*                                    TEAM                                    */
/* -------------------------------------------------------------------------- */

export interface TeamMember {
  id: string;
  name: string;
  title: string; // 1 bahasa (public site)
  bio: string; // 1 bahasa
  imageUrl: string;
  linkedinUrl?: string;
}

/* -------------------------------------------------------------------------- */
/*                                   PARTNER                                  */
/* -------------------------------------------------------------------------- */

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

/* -------------------------------------------------------------------------- */
/*                                   CONTACT                                  */
/* -------------------------------------------------------------------------- */

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

/* -------------------------------------------------------------------------- */
/*                                   NEWS                                     */
/* -------------------------------------------------------------------------- */

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
/* -------------------------------------------------------------------------- */
/*                               CAREERS / JOBS                               */
/* -------------------------------------------------------------------------- */

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

/* ------------------------------- Job Listing ------------------------------- */

export interface JobListingRow {
  id: string;
  title_id: string;
  location_id: string;
  job_type: JobType;
  description_id: string;
  responsibilities_id: string;
  qualifications_id: string;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface JobListingDto {
  id: string;
  title: { id: string };
  location: { id: string };
  type: JobType;
  description: { id: string };
  responsibilities: { id: string };
  qualifications: { id: string };
  date: string | null; // ISO string
}

/* ---------------------------- Job Applications ---------------------------- */

export interface JobApplicationRow {
  id: string;
  job_id: string;
  applicant_name: string | null; // kolom lama, boleh null
  name: string | null; // kolom baru
  email: string;
  phone: string;
  resume_url: string;
  resume_filename: string;
  cover_letter: string | null;
  applied_at: Date | string; // dari tabel
  created_at: Date | string;
  updated_at: Date | string;
}

export interface JobApplicationDto {
  id: string;
  jobId: string;
  applicantName: string | null;
  name: string | null;
  email: string;
  phone: string;
  resume: string;
  resumeFileName: string;
  coverLetter: string | null; // BUKAN optional, tapi bisa null
  date: string; // ISO string
}

// types.ts

export type NewsCategory = "company" | "division" | "industry" | "press";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

// --- NEWS ---

export interface NewsArticle {
  id: string;
  title: string; // dulu { id, en, cn }
  content: string; // dulu { id, en, cn }
  imageUrls: string[];
  category: NewsCategory;
  createdAt: string; // optional, terserah kamu
  updatedAt?: string;
}

export interface NewsFormPayload {
  title: string;
  content: string;
  imageUrls: string[];
  category: NewsCategory;
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

// --- CAREERS ---

export interface JobListing {
  id: string;
  title: string; // 1 bahasa
  location: string; // 1 bahasa
  type: JobType;
  description: string; // HTML string
  responsibilities: string; // HTML string
  qualifications: string; // HTML string
  date: string; // tanggal posting
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  name: string;
  email: string;
  phone: string;
  resume: string;
  resumeFileName: string;
  coverLetter?: string;
  date: string;
}

// --- TEAM ---

export interface TeamMember {
  id: string;
  name: string;
  title: string; // 1 bahasa
  bio: string; // 1 bahasa
  imageUrl: string;
  linkedinUrl?: string;
}

// --- PARTNER ---

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

// --- CONTACT ---

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

// FIX: Import React types to resolve 'Cannot find namespace React' error.
import type * as React from 'react';

export type Language = 'id' | 'en' | 'cn';
export type NewsCategory = 'company' | 'division' | 'industry' | 'press';
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Internship';

export interface NewsArticle {
  id: string;
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
  date: string;
  imageUrls: string[];
  category: NewsCategory;
}

export interface Division {
  name: string;
  slug: string;
  Icon: React.FC<{ className?: string }>;
  description: string;
  url: string;
}

export interface JobListing {
  id: string;
  title: {
    id: string; // hanya Bahasa Indonesia
  };
  location: {
    id: string; // hanya Bahasa Indonesia
  };
  type: JobType;
  description: {
    id: string; // hanya Bahasa Indonesia
  };
  responsibilities: {
    id: string; // hanya Bahasa Indonesia
  };
  qualifications: {
    id: string; // hanya Bahasa Indonesia
  };
  date: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  applicantName: string | null; // kolom lama, nullable
  name: string | null; // kolom baru, nullable
  email: string;
  phone: string;
  resume: string; // URL file resume dari backend (/uploads/resumes/xxx.pdf)
  resumeFileName: string;
  coverLetter: string | null; // nullable, bukan optional
  date: string; // ISO string
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

export interface Comment {
  id: string;
  articleId: string;
  author: string;
  email: string;
  text: string;
  date: string;
  avatar: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: {
    id: string;
    en: string;
    cn: string;
  };
  bio: {
    id: string;
    en: string;
    cn: string;
  };
  imageUrl: string;
  linkedinUrl?: string;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
}

// FIX: Add Project type definition to resolve import error in projectService.ts.
export interface Project {
  id: string;
  divisionSlug: string;
  title: {
    id: string;
    en: string;
    cn: string;
  };
  description: {
    id: string;
    en: string;
    cn: string;
  };
  imageUrl: string;
  date: string;
}

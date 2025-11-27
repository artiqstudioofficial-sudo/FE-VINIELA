import { JobListing, JobApplication } from "../types";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

// endpoint jobs (SUDAH DIBEDAKAN JELAS KE /jobs)
const JOBS_API = `${API_BASE}/api/careers/jobs`;
// endpoint applications
const APPLICATIONS_API = `${API_BASE}/api/careers/applications`;

/* -------------------------------------------------------------------------- */
/*                              Helper fetch JSON                             */
/* -------------------------------------------------------------------------- */

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body && (body as any).error) {
        message = (body as any).error;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/*                              Jobs (Job Listings)                           */
/* -------------------------------------------------------------------------- */

interface JobsResponse {
  data: JobListing[];
}

/**
 * Ambil daftar job listings.
 * Sekarang via API: GET /api/careers/jobs
 */
export const getJobListings = async (): Promise<JobListing[]> => {
  const resp = await fetchJson<JobsResponse>(JOBS_API);
  return resp.data;
};

/**
 * Ambil satu job berdasarkan ID
 * GET /api/careers/jobs/:id
 */
export const getJobListingById = async (
  id: string
): Promise<JobListing | undefined> => {
  try {
    const resp = await fetchJson<{ data: JobListing }>(`${JOBS_API}/${id}`);
    return resp.data;
  } catch (err) {
    console.error("Failed to fetch job by id", err);
    return undefined;
  }
};

/**
 * Simpan semua job (helper kalau mau bulk-create)
 * Di sini tetap pakai addJobListing satu per satu
 */
export const saveJobListings = async (
  jobs: Omit<JobListing, "id" | "date">[]
): Promise<JobListing[]> => {
  const createdJobs: JobListing[] = [];
  for (const job of jobs) {
    const created = await addJobListing(job);
    createdJobs.push(created);
  }
  return createdJobs;
};

/**
 * Tambah job baru
 * POST /api/careers/jobs
 */
export const addJobListing = async (
  job: Omit<JobListing, "id" | "date">
): Promise<JobListing> => {
  const payload = {
    title: job.title, // { id: string }
    location: job.location, // { id: string }
    type: job.type,
    description: job.description, // { id: string }
    responsibilities: job.responsibilities, // { id: string }
    qualifications: job.qualifications, // { id: string }
  };

  const resp = await fetchJson<{ data: JobListing }>(JOBS_API, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return resp.data;
};

/**
 * Update job listing
 * PUT /api/careers/jobs/:id
 */
export const updateJobListing = async (
  updatedJob: JobListing
): Promise<JobListing> => {
  const payload = {
    title: updatedJob.title,
    location: updatedJob.location,
    type: updatedJob.type,
    description: updatedJob.description,
    responsibilities: updatedJob.responsibilities,
    qualifications: updatedJob.qualifications,
    date: updatedJob.date,
  };

  const resp = await fetchJson<{ data: JobListing }>(
    `${JOBS_API}/${updatedJob.id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );

  return resp.data;
};

/**
 * Hapus job listing
 * DELETE /api/careers/jobs/:id
 */
export const deleteJobListing = async (jobId: string): Promise<void> => {
  await fetchJson<{ ok: boolean }>(`${JOBS_API}/${jobId}`, {
    method: "DELETE",
  });
};

/* -------------------------------------------------------------------------- */
/*                              Job Applications                              */
/* -------------------------------------------------------------------------- */

interface ApplicationsResponse {
  data: JobApplication[];
}

/**
 * Ambil semua lamaran kerja
 * GET /api/careers/applications
 */
export const getApplications = async (): Promise<JobApplication[]> => {
  const resp = await fetchJson<ApplicationsResponse>(APPLICATIONS_API);
  return resp.data;
};

/**
 * Simpan semua applications (opsional, helper bulk)
 */
export const saveApplications = async (
  applications: Omit<JobApplication, "id" | "date">[]
): Promise<JobApplication[]> => {
  const created: JobApplication[] = [];
  for (const app of applications) {
    const newApp = await addApplication(app);
    created.push(newApp);
  }
  return created;
};

/**
 * Tambah satu lamaran kerja
 * POST /api/careers/applications
 */
export const addApplication = async (
  application: Omit<JobApplication, "id" | "date">
): Promise<JobApplication> => {
  const resp = await fetchJson<{ data: JobApplication }>(APPLICATIONS_API, {
    method: "POST",
    body: JSON.stringify(application),
  });

  return resp.data;
};

/**
 * Hapus lamaran kerja
 * DELETE /api/careers/applications/:id
 */
export const deleteApplication = async (
  applicationId: string
): Promise<void> => {
  await fetchJson<{ ok: boolean }>(`${APPLICATIONS_API}/${applicationId}`, {
    method: "DELETE",
  });
};

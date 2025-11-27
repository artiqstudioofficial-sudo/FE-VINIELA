import React, { FormEvent, useEffect, useMemo, useState } from "react";

import { useTranslations } from "../../contexts/i18n";

import RichTextEditor from "../../components/RichTextEditor";
import ConfirmationModal from "../../components/ConfirmationModal";

import * as careersService from "../../services/careersService";

import { JobApplication, JobListing, JobType } from "../../types";

type ToastFn = (message: string, type?: "success" | "error") => void;

interface CareersManagementViewProps {
  showToast: ToastFn;
}

const jobTypes: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

// Hanya pakai bahasa Indonesia (id) saja
const emptyJobListing: Omit<JobListing, "id" | "date"> = {
  title: { id: "" },
  location: { id: "" },
  type: "Full-time",
  description: { id: "" },
  responsibilities: { id: "" },
  qualifications: { id: "" },
};

type SortKey = "date" | "name";
type SortDirection = "asc" | "desc";

const CareersManagementView: React.FC<CareersManagementViewProps> = ({
  showToast,
}) => {
  const { t } = useTranslations();

  const [activeCareersSubTab, setActiveCareersSubTab] = useState<
    "manage" | "view"
  >("manage");

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);

  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [jobFormData, setJobFormData] =
    useState<Omit<JobListing, "id" | "date">>(emptyJobListing);

  const [selectedJobForApps, setSelectedJobForApps] = useState<string>("all");

  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [appSortConfig, setAppSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({
    key: "date",
    direction: "desc",
  });

  // helper untuk load data dari API
  const loadJobsAndApplications = async () => {
    try {
      const [jobsData, appsData] = await Promise.all([
        careersService.getJobListings(),
        careersService.getApplications(),
      ]);
      setJobs(jobsData);
      setApplications(appsData);
    } catch (error) {
      console.error("Gagal memuat data karir:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal memuat data karir dari server",
        "error"
      );
    }
  };

  useEffect(() => {
    loadJobsAndApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetJobForm = () => {
    setEditingJob(null);
    setJobFormData(emptyJobListing);
  };

  const handleJobFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (editingJob) {
        await careersService.updateJobListing({
          ...editingJob,
          ...jobFormData,
        });
        showToast(t.admin.toast.jobUpdated);
      } else {
        await careersService.addJobListing(jobFormData);
        showToast(t.admin.toast.jobCreated);
      }

      // reload jobs dari API
      const jobsData = await careersService.getJobListings();
      setJobs(jobsData);
      resetJobForm();
    } catch (error) {
      console.error("Gagal menyimpan job:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data lowongan ke server",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditJob = (job: JobListing) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      location: job.location,
      type: job.type,
      description: job.description,
      responsibilities: job.responsibilities,
      qualifications: job.qualifications,
    });
    window.scrollTo(0, 0);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      await careersService.deleteJobListing(jobToDelete);
      const jobsData = await careersService.getJobListings();
      setJobs(jobsData);
      if (editingJob?.id === jobToDelete) resetJobForm();
      showToast(t.admin.toast.jobDeleted ?? "Job deleted");
    } catch (error) {
      console.error("Gagal menghapus job:", error);
      showToast(
        error instanceof Error
          ? error.message
          : "Gagal menghapus data lowongan di server",
        "error"
      );
    } finally {
      setJobToDelete(null);
    }
  };

  const sortedApplications = useMemo(() => {
    const filtered = applications.filter(
      (app) => selectedJobForApps === "all" || app.jobId === selectedJobForApps
    );
    return [...filtered].sort((a, b) => {
      if (appSortConfig.key === "name") {
        return appSortConfig.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return appSortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    });
  }, [applications, selectedJobForApps, appSortConfig]);

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split("-") as [SortKey, SortDirection];
    setAppSortConfig({ key, direction });
  };

  return (
    <>
      <ConfirmationModal
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDeleteJob}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteJob}
      />

      <div className="animate-fade-in-up">
        <div className="flex justify-center border-b border-gray-300 mb-8">
          <button
            onClick={() => setActiveCareersSubTab("manage")}
            className={`sub-tab-button ${
              activeCareersSubTab === "manage" ? "sub-tab-active" : ""
            }`}
          >
            {t.admin.manageJobs}
          </button>
          <button
            onClick={() => setActiveCareersSubTab("view")}
            className={`sub-tab-button ${
              activeCareersSubTab === "view" ? "sub-tab-active" : ""
            }`}
          >
            {t.admin.viewApplications}
          </button>
        </div>

        {activeCareersSubTab === "manage" ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form Jobs */}
            <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
                {editingJob ? t.admin.editJob : t.admin.formTitleJobs}
              </h2>
              <form onSubmit={handleJobFormSubmit} className="space-y-6">
                {/* Job Title (ID saja) */}
                <section>
                  <h3 className="form-section-title">{t.admin.jobTitle}</h3>
                  <input
                    type="text"
                    placeholder={t.admin.titleIdPlaceholder}
                    value={jobFormData.title.id}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        title: { id: e.target.value },
                      }))
                    }
                    className="form-input"
                    required
                  />
                </section>

                {/* Location (ID saja) */}
                <section>
                  <h3 className="form-section-title">{t.admin.location}</h3>
                  <input
                    type="text"
                    placeholder={t.admin.locationIdPlaceholder}
                    value={jobFormData.location.id}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        location: { id: e.target.value },
                      }))
                    }
                    className="form-input"
                    required
                  />
                </section>

                {/* Job Type */}
                <section>
                  <h3 className="form-section-title">{t.admin.jobType}</h3>
                  <select
                    value={jobFormData.type}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        type: e.target.value as JobType,
                      }))
                    }
                    className="form-input"
                  >
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {t.admin.jobTypes[type]}
                      </option>
                    ))}
                  </select>
                </section>

                {/* Description (ID saja) */}
                <section>
                  <h3 className="form-section-title">{t.admin.description}</h3>
                  <RichTextEditor
                    placeholder={t.admin.descriptionIdPlaceholder}
                    value={jobFormData.description.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        description: {
                          id: val,
                        },
                      }))
                    }
                  />
                </section>

                {/* Responsibilities (ID saja) */}
                <section>
                  <h3 className="form-section-title">
                    {t.admin.responsibilities}
                  </h3>
                  <RichTextEditor
                    placeholder={t.admin.responsibilitiesIdPlaceholder}
                    value={jobFormData.responsibilities.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        responsibilities: {
                          id: val,
                        },
                      }))
                    }
                  />
                </section>

                {/* Qualifications (ID saja) */}
                <section>
                  <h3 className="form-section-title">
                    {t.admin.qualifications}
                  </h3>
                  <RichTextEditor
                    placeholder={t.admin.qualificationsIdPlaceholder}
                    value={jobFormData.qualifications.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        qualifications: {
                          id: val,
                        },
                      }))
                    }
                  />
                </section>

                <div className="flex justify-end items-center space-x-3">
                  {editingJob && (
                    <button
                      type="button"
                      onClick={resetJobForm}
                      className="btn-secondary"
                    >
                      {t.admin.cancelButton}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving && (
                      <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />
                    )}
                    {isSaving
                      ? t.admin.savingButton
                      : editingJob
                      ? t.admin.updateJob
                      : t.admin.createJob}
                  </button>
                </div>
              </form>
            </div>

            {/* List Jobs */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-lg sticky top-28">
                <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
                  {t.admin.currentJobs}
                </h2>
                <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                  {jobs.length > 0 ? (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-viniela-silver/50 p-4 rounded-lg"
                      >
                        <h3 className="font-semibold text-viniela-dark">
                          {job.title.id}
                        </h3>
                        <p className="text-sm text-viniela-gray mt-1">
                          {t.admin.jobTypes[job.type]} &bull; {job.location.id}
                        </p>
                        <div className="flex justify-end space-x-2 mt-3">
                          <button
                            onClick={() => handleEditJob(job)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {t.admin.edit}
                          </button>
                          <button
                            onClick={() => setJobToDelete(job.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            {t.admin.delete}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-viniela-gray text-center py-8">
                      {t.admin.noJobs}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // View Applications
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="flex flex-wrap gap-4 mb-6 items-end">
              <div className="flex-grow max-w-xs">
                <label className="form-label">{t.admin.applicationsFor}</label>
                <select
                  value={selectedJobForApps}
                  onChange={(e) => setSelectedJobForApps(e.target.value)}
                  className="form-input"
                >
                  <option value="all">{t.admin.allJobs}</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-grow max-w-xs">
                <label className="form-label">{t.admin.sort}</label>
                <select
                  value={`${appSortConfig.key}-${appSortConfig.direction}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="form-input"
                >
                  <option value="date-desc">{t.admin.sortByDateNewest}</option>
                  <option value="date-asc">{t.admin.sortByDateOldest}</option>
                  <option value="name-asc">{t.admin.sortByNameAZ}</option>
                  <option value="name-desc">{t.admin.sortByNameZA}</option>
                </select>
              </div>
            </div>
            {sortedApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.admin.applicantName}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.admin.jobTitle}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.admin.contact}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t.admin.appliedOn}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {app.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {app.jobTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {app.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {app.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <a
                            href={app.resume}
                            download={app.resumeFileName}
                            className="text-blue-600 hover:text-blue-900"
                            title={t.admin.downloadResume}
                          >
                            <i className="fa-solid fa-file-arrow-down fa-lg"></i>
                          </a>
                          {app.coverLetter && (
                            <button
                              onClick={() => alert(app.coverLetter)}
                              className="text-gray-600 hover:text-gray-900"
                              title={t.admin.viewCoverLetter}
                            >
                              <i className="fa-solid fa-envelope-open-text fa-lg"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <i className="fa-regular fa-folder-open fa-3x text-gray-300 mb-4"></i>
                <p className="text-gray-500">{t.admin.noApplications}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CareersManagementView;

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import * as careersService from '../services/careersService';
import { JobListing } from '../types';

const CareersDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslations();

  const [job, setJob] = useState<JobListing | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* --------------------------- Load job dari API --------------------------- */
  useEffect(() => {
    window.scrollTo(0, 0);

    if (!id) return;

    const loadJob = async () => {
      try {
        setIsLoadingJob(true);
        const foundJob = await careersService.getJobListingById(id);
        setJob(foundJob || null);
      } catch (err) {
        console.error('Gagal memuat detail job:', err);
        alert(err instanceof Error ? err.message : 'Gagal memuat detail lowongan dari server');
      } finally {
        setIsLoadingJob(false);
      }
    };

    loadJob();
  }, [id]);

  /* ----------------------------- Form handlers ---------------------------- */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setResume(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !resume) return;

    // Payload text → akan dibungkus FormData di careersService.addApplication
    const payload = {
      jobId: job.id,
      name: formState.name,
      email: formState.email,
      phone: formState.phone,
      coverLetter: formState.coverLetter || '',
    };

    try {
      setIsSubmitting(true);
      await careersService.addApplication(payload, resume);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Gagal mengirim lamaran:', err);
      alert(err instanceof Error ? err.message : 'Gagal mengirim lamaran pekerjaan ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------- UI states ------------------------------ */

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-6 py-20 min-h-[60vh] flex flex-col justify-center items-center text-center animate-fade-in-up">
        <i
          className="fa-solid fa-check-circle text-green-500 fa-4x w-16 h-16 mb-6"
          aria-hidden="true"
        ></i>
        <h1 className="text-4xl font-bold text-viniela-dark">
          {t.careersDetail.applicationSuccessTitle}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-viniela-gray">
          {t.careersDetail.applicationSuccessMessage}
        </p>
        <Link
          to="/careers"
          className="mt-8 px-6 py-3 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all"
        >
          {t.careersDetail.backToCareers}
        </Link>
      </div>
    );
  }

  if (isLoadingJob) {
    return (
      <div className="container mx-auto px-6 py-20 text-center min-h-[50vh]">
        {t.careers.loading || 'Memuat detail lowongan...'}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-6 py-20 text-center min-h-[50vh]">
        {t.careersDetail.notFound}
      </div>
    );
  }

  /* ------------------------------- Main view ------------------------------ */

  return (
    <div className="bg-white animate-fade-in-up">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link
          to="/careers"
          className="inline-flex items-center text-viniela-gray hover:text-viniela-gold transition-colors mb-8 group font-semibold"
        >
          <i
            className="fa-solid fa-chevron-left mr-2 transform group-hover:-translate-x-1 transition-transform"
            aria-hidden="true"
          ></i>
          {t.careersDetail.backToCareers}
        </Link>

        <header className="mb-10 text-center border-b pb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-viniela-dark leading-tight">
            {job.title.id}
          </h1>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-viniela-gray mt-4">
            <span className="flex items-center text-lg">
              <i className="fa-solid fa-briefcase w-5 h-5 mr-2" aria-hidden="true"></i>
              {t.admin.jobTypes[job.type]}
            </span>
            <span className="flex items-center text-lg">
              <i className="fa-solid fa-location-dot w-5 h-5 mr-2" aria-hidden="true"></i>
              {job.location.id}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <article className="lg:col-span-2 space-y-10">
            {/* Job Description Section */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 bg-viniela-gold/10 text-viniela-gold rounded-lg p-3">
                  <i className="fa-solid fa-file-lines fa-fw fa-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-viniela-dark">
                  {t.careersDetail.jobDescription}
                </h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-viniela-gray pl-16"
                dangerouslySetInnerHTML={{ __html: job.description.id }}
              />
            </section>

            {/* Responsibilities Section */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 bg-viniela-gold/10 text-viniela-gold rounded-lg p-3">
                  <i className="fa-solid fa-list-check fa-fw fa-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-viniela-dark">
                  {t.careersDetail.responsibilities}
                </h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-viniela-gray pl-16"
                dangerouslySetInnerHTML={{ __html: job.responsibilities.id }}
              />
            </section>

            {/* Qualifications Section */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 bg-viniela-gold/10 text-viniela-gold rounded-lg p-3">
                  <i className="fa-solid fa-graduation-cap fa-fw fa-xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-viniela-dark">
                  {t.careersDetail.qualifications}
                </h2>
              </div>
              <div
                className="prose prose-lg max-w-none text-viniela-gray pl-16"
                dangerouslySetInnerHTML={{ __html: job.qualifications.id }}
              />
            </section>
          </article>

          <aside className="lg:col-span-1">
            <div className="bg-viniela-silver p-6 rounded-xl shadow-md sticky top-28">
              <h3 className="text-2xl font-bold text-viniela-dark mb-4">
                {t.careersDetail.applicationForm}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">{t.careersDetail.fullName}</label>
                  <input
                    type="text"
                    name="name"
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t.careersDetail.email}</label>
                  <input
                    type="email"
                    name="email"
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t.careersDetail.phone}</label>
                  <input
                    type="tel"
                    name="phone"
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">{t.careersDetail.resume}</label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-viniela-gold/10 file:text-viniela-gold hover:file:bg-viniela-gold/20"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t.careersDetail.fileInfo}</p>
                </div>
                <div>
                  <label className="form-label">{t.careersDetail.coverLetter}</label>
                  <textarea
                    name="coverLetter"
                    rows={4}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
                <button type="submit" className="w-full btn-primary mt-4" disabled={isSubmitting}>
                  {isSubmitting
                    ? t.careersDetail.submitting || 'Mengirim lamaran...'
                    : t.careersDetail.submitApplication}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
      <style>{`
        .form-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #4d4d4d; }
        .form-input { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; }
        .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #c09a58; box-shadow: 0 0 0 2px #c09a58; }
        .btn-primary { padding: 0.75rem 1.5rem; background-color: #c09a58; color: white; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.2s; border: none; cursor: pointer; }
        .btn-primary:hover { background-color: #b08b49; }
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        .prose ul > li::before { background-color: #c09a58; }
        .prose ol > li::before { color: #c09a58; font-weight: bold; }
      `}</style>
    </div>
  );
};

export default CareersDetailPage;

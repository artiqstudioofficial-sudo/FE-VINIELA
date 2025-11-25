import { GoogleGenAI, Type } from '@google/genai';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ConfirmationModal from '../components/ConfirmationModal';
import ImageUploader from '../components/ImageUploader';
import NewsPreviewModal from '../components/NewsPreviewModal';
import RichTextEditor from '../components/RichTextEditor';
import Toast from '../components/Toast';
import { useTranslations } from '../contexts/i18n';

import * as careersService from '../services/careersService';
import * as contactService from '../services/contactService';
import {
  createNews,
  deleteNews as deleteNewsApi,
  listNews,
  updateNews as updateNewsApi,
  type NewsFormPayload,
  type PaginatedNewsResponse,
} from '../services/newsService';
import * as partnerService from '../services/partnerService';
import * as teamService from '../services/teamService';

import {
  ContactMessage,
  JobApplication,
  JobListing,
  JobType,
  Language,
  NewsArticle,
  NewsCategory,
  Partner,
  TeamMember,
} from '../types';

// AI Instance for translation
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Constants
const newsCategories: NewsCategory[] = ['company', 'division', 'industry', 'press'];
const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

const emptyNewsArticle: NewsFormPayload = {
  title: { id: '', en: '', cn: '' },
  content: { id: '', en: '', cn: '' },
  imageUrls: [],
  category: 'company',
};

const emptyJobListing: Omit<JobListing, 'id' | 'date'> = {
  title: { id: '', en: '', cn: '' },
  location: { id: '', en: '', cn: '' },
  type: 'Full-time',
  description: { id: '', en: '', cn: '' },
  responsibilities: { id: '', en: '', cn: '' },
  qualifications: { id: '', en: '', cn: '' },
};

const emptyTeamMember: Omit<TeamMember, 'id'> = {
  name: '',
  title: { id: '', en: '', cn: '' },
  bio: { id: '', en: '', cn: '' },
  imageUrl: '',
  linkedinUrl: '',
};

const emptyPartner: Omit<Partner, 'id'> = {
  name: '',
  logoUrl: '',
};

type View = 'dashboard' | 'news' | 'careers' | 'team' | 'partners' | 'contact';
type ToastState = { show: boolean; message: string; type: 'success' | 'error' };

// --- SVG Chart Components ---

const SVGPieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({
  data,
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const slices = data.map((item) => {
    const startPercent = cumulativePercent;
    const slicePercent = item.value / total;
    cumulativePercent += slicePercent;
    const endPercent = cumulativePercent;

    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

    if (total === item.value) {
      return {
        path: 'M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0',
        color: item.color,
        percent: slicePercent,
        label: item.label,
        value: item.value,
      };
    }

    const pathData = [
      `M 0 0`,
      `L ${startX} ${startY}`,
      `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      `Z`,
    ].join(' ');

    return {
      path: pathData,
      color: item.color,
      percent: slicePercent,
      label: item.label,
      value: item.value,
    };
  });

  if (total === 0)
    return <div className="text-gray-400 text-sm text-center py-10">No data available</div>;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
      <div className="relative w-48 h-48">
        <svg viewBox="-1.1 -1.1 2.2 2.2" className="w-full h-full transform -rotate-90">
          {slices.map((slice, i) => (
            <path
              key={i}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-90 transition-opacity cursor-pointer stroke-white stroke-[0.02]"
            >
              <title>{`${slice.label}: ${slice.value} (${(slice.percent * 100).toFixed(
                1,
              )}%)`}</title>
            </path>
          ))}
          <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="block text-3xl font-bold text-viniela-dark">{total}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">Total</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-w-[150px]">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm group cursor-default">
            <span
              className="w-3 h-3 rounded-full shadow-sm group-hover:scale-125 transition-transform"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex justify-between w-full text-gray-600">
              <span>{item.label}</span>
              <span className="font-bold text-viniela-dark ml-3">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SVGBarChart: React.FC<{ data: { label: string; value: number }[]; color: string }> = ({
  data,
  color,
}) => {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barHeight = 24;
  const gap = 12;
  const totalHeight = data.length * (barHeight + gap);
  const labelWidth = 120;

  if (data.length === 0)
    return <div className="text-gray-400 text-sm text-center py-10">No data available</div>;

  return (
    <div className="w-full overflow-x-auto">
      <svg width="100%" height={totalHeight} className="min-w-[300px] font-sans text-xs">
        {data.map((item, i) => {
          const barWidthPercent = (item.value / maxVal) * 100;
          const y = i * (barHeight + gap);
          return (
            <g key={i} className="group">
              <rect
                x={labelWidth}
                y={y}
                width={`calc(100% - ${labelWidth + 40}px)`}
                height={barHeight}
                rx="4"
                fill="#f3f4f6"
              />
              <rect
                x={labelWidth}
                y={y}
                width={`${barWidthPercent * 0.8}%`}
                height={barHeight}
                rx="4"
                fill={color}
                className="transition-all duration-1000 ease-out origin-left hover:opacity-80"
              >
                <animate
                  attributeName="width"
                  from="0"
                  to={`${barWidthPercent * 0.8}%`}
                  dur="0.8s"
                  fill="freeze"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1"
                />
              </rect>
              <text
                x="0"
                y={y + barHeight / 1.5}
                fill="#4b5563"
                className="font-medium"
                style={{ textOverflow: 'ellipsis' }}
              >
                {item.label.length > 18 ? item.label.substring(0, 18) + '...' : item.label}
              </text>
              <text
                x={`calc(${labelWidth}px + ${barWidthPercent * 0.8}% + 10px)`}
                y={y + barHeight / 1.5}
                fill="#1a1a1a"
                fontWeight="bold"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const AdminPage: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeLangTab, setActiveLangTab] = useState<Language>('id');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  // News State
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsMeta, setNewsMeta] = useState<PaginatedNewsResponse['meta'] | null>(null);
  const [newsPage, setNewsPage] = useState(1);
  const NEWS_LIMIT = 20;

  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [newsFormData, setNewsFormData] = useState<NewsFormPayload>(emptyNewsArticle);
  const [newsFormErrors, setNewsFormErrors] = useState<{ [key: string]: string }>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState({ title: false, content: false });
  const [isSaving, setIsSaving] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);

  // Careers State
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [jobFormData, setJobFormData] = useState(emptyJobListing);
  const [selectedJobForApps, setSelectedJobForApps] = useState<string>('all');
  const [activeCareersSubTab, setActiveCareersSubTab] = useState<'manage' | 'view'>('manage');
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  type SortKey = 'date' | 'name';
  type SortDirection = 'asc' | 'desc';
  const [appSortConfig, setAppSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({
    key: 'date',
    direction: 'desc',
  });

  // Team State
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [teamFormData, setTeamFormData] = useState(emptyTeamMember);
  const [teamFormErrors, setTeamFormErrors] = useState<{ [key: string]: string }>({});
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Partner State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [partnerFormData, setPartnerFormData] = useState(emptyPartner);
  const [partnerFormErrors, setPartnerFormErrors] = useState<{ [key: string]: string }>({});
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);

  // Contact State
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('viniela-auth');
    navigate('/login');
  };

  // --- Validation ---
  const validateField = (name: string, value: string, group: 'news' | 'team' | 'partner') => {
    let error = '';
    if (!value || value.trim() === '') {
      error = t.admin.validation.required;
    } else if (name === 'linkedinUrl' && value.trim() !== '') {
      try {
        new URL(value);
      } catch (_) {
        error = t.admin.validation.url;
      }
    }

    if (group === 'news') setNewsFormErrors((prev) => ({ ...prev, [name]: error }));
    else if (group === 'team') setTeamFormErrors((prev) => ({ ...prev, [name]: error }));
    else if (group === 'partner') setPartnerFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  // --- Load News from API ---
  const loadNews = useCallback(
    async (page: number = 1) => {
      try {
        const res = await listNews(page, NEWS_LIMIT);
        setNews(res.data);
        setNewsMeta(res.meta);
        setNewsPage(res.meta.page);
      } catch (err) {
        console.error('Failed to load news:', err);
        showToast(err instanceof Error ? err.message : 'Gagal memuat berita dari server', 'error');
      }
    },
    [showToast],
  );

  // --- News Form Change (fix union spread issue) ---
  const handleNewsFormChange = useCallback(
    (field: string, value: any) => {
      const fieldName = field.replace(/\.(id|en|cn)$/, '');
      validateField(fieldName, typeof value === 'string' ? value : '', 'news');

      setNewsFormData((prev) => {
        const keys = field.split('.');
        if (keys.length === 2) {
          const [objKey, langKey] = keys as [keyof NewsFormPayload, string];
          const prevAny = prev as any;
          const nested = prevAny[objKey] || {};
          return {
            ...prev,
            [objKey]: {
              ...nested,
              [langKey]: value,
            },
          };
        }
        return {
          ...prev,
          [field]: value,
        } as NewsFormPayload;
      });
    },
    [t.admin.validation.required],
  );

  const processAndAddImages = useCallback((files: FileList) => {
    for (const file of Array.from(files)) {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNewsFormData((prev) => ({
            ...prev,
            imageUrls: [...prev.imageUrls, e.target?.result as string],
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files) {
        processAndAddImages(e.dataTransfer.files);
      }
    },
    [processAndAddImages],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processAndAddImages(e.target.files);
    }
  };

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setNewsFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleTranslate = async (field: 'title' | 'content') => {
    const sourceText = newsFormData[field].id;
    if (!sourceText) return;
    setIsTranslating((prev) => ({ ...prev, [field]: true }));
    try {
      const isHtml = field === 'content';
      const prompt = isHtml
        ? `Translate the text content within the following HTML from Indonesian to English and Chinese. Preserve the HTML structure and tags. Indonesian HTML: "${sourceText}" Provide the response in a valid JSON format with keys "en" for English and "cn" for Chinese.`
        : `Translate the following Indonesian text to English and Chinese. Indonesian text: "${sourceText}" Provide the response in a valid JSON format with keys "en" for English and "cn" for Chinese.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: { en: { type: Type.STRING }, cn: { type: Type.STRING } },
            required: ['en', 'cn'],
          },
        },
      });

      // const translatedText = JSON.parse(response.text());
      // handleNewsFormChange(`${field}.en`, translatedText.en);
      // handleNewsFormChange(`${field}.cn`, translatedText.cn);
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating((prev) => ({ ...prev, [field]: false }));
    }
  };

  const resetNewsForm = useCallback(() => {
    setEditingNews(null);
    setNewsFormData(emptyNewsArticle);
    setNewsFormErrors({});
  }, []);

  const handleNewsFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};
    if (!newsFormData.title.id) errors.title = t.admin.validation.required;
    setNewsFormErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    setIsSaving(true);
    try {
      const payload: NewsFormPayload = {
        title: newsFormData.title,
        content: newsFormData.content,
        imageUrls: newsFormData.imageUrls,
        category: newsFormData.category,
      };

      if (editingNews) {
        const updated = await updateNewsApi(editingNews.id, payload);
        setNews((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        showToast(t.admin.toast.newsUpdated);
      } else {
        const created = await createNews(payload);
        setNews((prev) => [created, ...prev]);
        showToast(t.admin.toast.newsCreated);
      }

      resetNewsForm();
    } catch (err) {
      console.error('Failed to save news:', err);
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan berita ke server', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditNews = (article: NewsArticle) => {
    setEditingNews(article);
    setNewsFormData({
      title: article.title,
      content: article.content,
      imageUrls: article.imageUrls,
      category: article.category,
    });
    setNewsFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeleteNews = async () => {
    if (!newsToDelete) return;

    try {
      await deleteNewsApi(newsToDelete);
      setNews((prev) => prev.filter((n) => n.id !== newsToDelete));
      if (editingNews?.id === newsToDelete) resetNewsForm();
    } catch (err) {
      console.error('Failed to delete news:', err);
      showToast(err instanceof Error ? err.message : 'Gagal menghapus berita di server', 'error');
    } finally {
      setNewsToDelete(null);
    }
  };

  // --- Careers Management Logic ---
  const resetJobForm = useCallback(() => {
    setEditingJob(null);
    setJobFormData(emptyJobListing);
  }, []);

  const handleJobFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      if (editingJob) {
        careersService.updateJobListing({ ...editingJob, ...jobFormData });
        showToast(t.admin.toast.jobUpdated);
      } else {
        careersService.addJobListing(jobFormData);
        showToast(t.admin.toast.jobCreated);
      }
      setJobs(careersService.getJobListings());
      resetJobForm();
      setIsSaving(false);
    }, 500);
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

  const confirmDeleteJob = () => {
    if (jobToDelete) {
      careersService.deleteJobListing(jobToDelete);
      setJobs(careersService.getJobListings());
      if (editingJob?.id === jobToDelete) resetJobForm();
      setJobToDelete(null);
    }
  };

  const sortedApplications = useMemo(() => {
    const filtered = applications.filter(
      (app) => selectedJobForApps === 'all' || app.jobId === selectedJobForApps,
    );
    return [...filtered].sort((a, b) => {
      if (appSortConfig.key === 'name') {
        return appSortConfig.direction === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return appSortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [applications, selectedJobForApps, appSortConfig]);

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split('-') as [SortKey, SortDirection];
    setAppSortConfig({ key, direction });
  };

  // --- Team Management Logic ---
  const resetTeamForm = useCallback(() => {
    setEditingTeamMember(null);
    setTeamFormData(emptyTeamMember);
    setTeamFormErrors({});
  }, []);

  const handleTeamFormChange = useCallback(
    (field: string, value: any) => {
      const fieldName = field.replace(/\.(id|en|cn)$/, '');
      validateField(fieldName, typeof value === 'string' ? value : '', 'team');
      setTeamFormData((prev) => {
        const keys = field.split('.');
        if (keys.length === 2) {
          const [fieldKey, langKey] = keys as [keyof typeof prev, string];
          const nestedObject = prev[fieldKey] as any;
          return { ...prev, [fieldKey]: { ...nestedObject, [langKey]: value } };
        }
        return { ...prev, [field]: value };
      });
    },
    [t.admin.validation.required, t.admin.validation.url],
  );

  const handleTeamFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!teamFormData.name) errors.name = t.admin.validation.required;
    if (!teamFormData.title.id) errors.title = t.admin.validation.required;
    if (teamFormData.linkedinUrl) {
      try {
        new URL(teamFormData.linkedinUrl);
      } catch (_) {
        errors.linkedinUrl = t.admin.validation.url;
      }
    }
    setTeamFormErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    setIsSaving(true);
    setTimeout(() => {
      if (editingTeamMember) {
        teamService.updateTeamMember({ ...editingTeamMember, ...teamFormData });
        showToast(t.admin.toast.memberUpdated);
      } else {
        teamService.addTeamMember(teamFormData);
        showToast(t.admin.toast.memberCreated);
      }
      setTeamMembers(teamService.getTeamMembers());
      resetTeamForm();
      setIsSaving(false);
    }, 500);
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamFormData({
      name: member.name,
      title: member.title,
      bio: member.bio,
      imageUrl: member.imageUrl,
      linkedinUrl: member.linkedinUrl || '',
    });
    setTeamFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeleteTeamMember = () => {
    if (teamToDelete) {
      teamService.deleteTeamMember(teamToDelete);
      setTeamMembers(teamService.getTeamMembers());
      if (editingTeamMember?.id === teamToDelete) resetTeamForm();
      setTeamToDelete(null);
    }
  };

  // --- Partner Management Logic ---
  const resetPartnerForm = useCallback(() => {
    setEditingPartner(null);
    setPartnerFormData(emptyPartner);
    setPartnerFormErrors({});
  }, []);

  const handlePartnerFormChange = useCallback(
    (field: string, value: string) => {
      validateField(field, value, 'partner');
      setPartnerFormData((prev) => ({ ...prev, [field]: value }));
    },
    [t.admin.validation.required],
  );

  const handlePartnerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { [key: string]: string } = {};
    if (!partnerFormData.name) errors.name = t.admin.validation.required;
    if (!partnerFormData.logoUrl) errors.logoUrl = t.admin.validation.required;
    setPartnerFormErrors(errors);
    if (Object.values(errors).some((e) => e)) return;

    setIsSaving(true);
    setTimeout(() => {
      if (editingPartner) {
        partnerService.updatePartner({ ...editingPartner, ...partnerFormData });
        showToast(t.admin.toast.partnerUpdated);
      } else {
        partnerService.addPartner(partnerFormData);
        showToast(t.admin.toast.partnerCreated);
      }
      setPartners(partnerService.getPartners());
      resetPartnerForm();
      setIsSaving(false);
    }, 500);
  };

  const handleEditPartner = (partner: Partner) => {
    setEditingPartner(partner);
    setPartnerFormData({
      name: partner.name,
      logoUrl: partner.logoUrl,
    });
    setPartnerFormErrors({});
    window.scrollTo(0, 0);
  };

  const confirmDeletePartner = () => {
    if (partnerToDelete) {
      partnerService.deletePartner(partnerToDelete);
      setPartners(partnerService.getPartners());
      if (editingPartner?.id === partnerToDelete) resetPartnerForm();
      setPartnerToDelete(null);
    }
  };

  // --- Contact Management Logic ---
  const confirmDeleteMessage = () => {
    if (messageToDelete) {
      contactService.deleteContactMessage(messageToDelete);
      setContactMessages(contactService.getContactMessages());
      setMessageToDelete(null);
    }
  };

  // --- Lang Tabs ---
  const LangTabs = () => (
    <div className="border-b border-gray-200 mb-4">
      <nav className="-mb-px flex space-x-4" aria-label="Tabs">
        {(['id', 'en', 'cn'] as Language[]).map((lang) => (
          <button
            key={lang}
            type="button" // ⬅⬅ PENTING: jangan biarkan default "submit"
            onClick={() => setActiveLangTab(lang)}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeLangTab === lang
                ? 'border-viniela-gold text-viniela-gold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </nav>
    </div>
  );

  // --- Navigation ---
  const navItems = useMemo(
    () => [
      { id: 'dashboard', label: t.admin.dashboardTitle, icon: 'fa-solid fa-chart-pie' },
      { id: 'news', label: t.admin.newsManagement, icon: 'fa-solid fa-newspaper' },
      { id: 'careers', label: t.admin.careersManagement, icon: 'fa-solid fa-briefcase' },
      { id: 'team', label: t.admin.teamManagement, icon: 'fa-solid fa-users' },
      { id: 'partners', label: t.admin.partnerManagement, icon: 'fa-solid fa-handshake' },
      { id: 'contact', label: t.admin.contactManagement, icon: 'fa-solid fa-envelope' },
    ],
    [t],
  );

  const pageTitle = useMemo(() => {
    return navItems.find((item) => item.id === activeView)?.label || 'Admin Panel';
  }, [activeView, navItems]);

  const isNewsFormValid = useMemo(() => {
    return Object.values(newsFormErrors).every((error) => !error) && newsFormData.title.id;
  }, [newsFormErrors, newsFormData.title.id]);

  const isTeamFormValid = useMemo(() => {
    return (
      Object.values(teamFormErrors).every((error) => !error) &&
      teamFormData.name &&
      teamFormData.title.id
    );
  }, [teamFormErrors, teamFormData.name, teamFormData.title.id]);

  const isPartnerFormValid = useMemo(() => {
    return (
      Object.values(partnerFormErrors).every((error) => !error) &&
      partnerFormData.name &&
      partnerFormData.logoUrl
    );
  }, [partnerFormErrors, partnerFormData.name, partnerFormData.logoUrl]);

  // --- Dashboard Render ---
  const renderDashboard = () => {
    const newsByCategory = newsCategories
      .map((cat) => ({
        label: t.admin.categories[cat],
        value: news.filter((n) => n.category === cat).length,
        color:
          cat === 'company'
            ? '#c09a58'
            : cat === 'division'
            ? '#374151'
            : cat === 'industry'
            ? '#6b7280'
            : '#9ca3af',
      }))
      .filter((d) => d.value > 0);

    const applicationsByJob = jobs
      .map((job) => ({
        label: job.title.id,
        value: applications.filter((app) => app.jobId === job.id).length,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const stats = [
      {
        label: t.admin.totalNews,
        value: news.length,
        icon: 'fa-newspaper',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      {
        label: t.admin.totalApplications,
        value: applications.length,
        icon: 'fa-file-alt',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
      },
      {
        label: t.admin.totalMessages,
        value: contactMessages.length,
        icon: 'fa-inbox',
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
      {
        label: t.admin.totalTeamMembers,
        value: teamMembers.length,
        icon: 'fa-users',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
      },
    ];

    return (
      <div className="animate-fade-in-up space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-5 border border-gray-100"
            >
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl shadow-sm`}>
                <i
                  className={`fa-solid ${stat.icon} fa-lg w-6 h-6 flex items-center justify-center`}
                ></i>
              </div>
              <div>
                <p className="text-3xl font-bold text-viniela-dark tracking-tight">{stat.value}</p>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full">
            <h3 className="text-lg font-bold text-viniela-dark mb-6 flex items-center gap-2">
              <i className="fa-solid fa-chart-pie text-viniela-gold"></i> News Distribution
            </h3>
            <div className="flex-grow flex items-center justify-center">
              <SVGPieChart data={newsByCategory} />
            </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col h-full">
            <h3 className="text-lg font-bold text-viniela-dark mb-6 flex items-center gap-2">
              <i className="fa-solid fa-chart-bar text-viniela-gold"></i> Top Job Applications
            </h3>
            <div className="flex-grow flex items-center">
              <SVGBarChart data={applicationsByJob} color="#c09a58" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderNewsManagement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in-up">
      <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
          {editingNews ? t.admin.editNews : t.admin.formTitle}
        </h2>
        <form onSubmit={handleNewsFormSubmit} className="space-y-6">
          <section>
            <div className="flex justify-between items-center mb-1">
              <h3 className="form-section-title">{t.admin.titleLabel}</h3>
              <button
                type="button"
                onClick={() => handleTranslate('title')}
                disabled={isTranslating.title || !newsFormData.title.id}
                className="translate-btn"
              >
                {isTranslating.title ? (
                  <i className="fa-solid fa-spinner fa-spin w-4 h-4" />
                ) : (
                  <i className="fa-solid fa-language w-4 h-4" />
                )}
                <span>{isTranslating.title ? t.admin.translating : t.admin.translateFromId}</span>
              </button>
            </div>
            <LangTabs />
            <div className="space-y-4">
              {activeLangTab === 'id' && (
                <input
                  type="text"
                  placeholder={t.admin.titleIdPlaceholder}
                  value={newsFormData.title.id}
                  onChange={(e) => handleNewsFormChange('title.id', e.target.value)}
                  className={`form-input ${newsFormErrors.title ? 'border-red-500' : ''}`}
                />
              )}
              {activeLangTab === 'en' && (
                <input
                  type="text"
                  placeholder={t.admin.titleEnPlaceholder}
                  value={newsFormData.title.en}
                  onChange={(e) => handleNewsFormChange('title.en', e.target.value)}
                  className="form-input"
                />
              )}
              {activeLangTab === 'cn' && (
                <input
                  type="text"
                  placeholder={t.admin.titleCnPlaceholder}
                  value={newsFormData.title.cn}
                  onChange={(e) => handleNewsFormChange('title.cn', e.target.value)}
                  className="form-input"
                />
              )}
              {newsFormErrors.title && activeLangTab === 'id' && (
                <p className="form-error">{newsFormErrors.title}</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="form-section-title">{t.admin.categoryLabel}</h3>
            <select
              value={newsFormData.category}
              onChange={(e) => handleNewsFormChange('category', e.target.value as NewsCategory)}
              className="form-input"
            >
              {newsCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {t.admin.categories[cat]}
                </option>
              ))}
            </select>
          </section>
          <section>
            <h3 className="form-section-title">{t.admin.imageLabel}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
              {newsFormData.imageUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={url}
                    alt={`upload preview ${index}`}
                    className="w-full h-full object-cover rounded-md shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t.imageUploader.remove}
                  >
                    <i className="fa-solid fa-xmark text-xs w-3 h-3" aria-hidden="true"></i>
                  </button>
                </div>
              ))}
            </div>
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-gray-300 bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center text-center text-viniela-gray">
                <i className="fa-solid fa-cloud-arrow-up fa-2x w-8 h-8 mb-2" aria-hidden="true"></i>
                <p className="text-sm">
                  <span className="font-semibold">{t.imageUploader.uploadCTA}</span>{' '}
                  {t.imageUploader.dragAndDrop}
                </p>
                <p className="text-xs">{t.imageUploader.fileTypes}</p>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
              />
            </label>
          </section>
          <section>
            <div className="flex justify-between items-center mb-1">
              <h3 className="form-section-title">{t.admin.contentLabel}</h3>
              <button
                type="button"
                onClick={() => handleTranslate('content')}
                disabled={isTranslating.content || !newsFormData.content.id}
                className="translate-btn"
              >
                {isTranslating.content ? (
                  <i className="fa-solid fa-spinner fa-spin w-4 h-4" />
                ) : (
                  <i className="fa-solid fa-language w-4 h-4" />
                )}
                <span>{isTranslating.content ? t.admin.translating : t.admin.translateFromId}</span>
              </button>
            </div>
            <LangTabs />
            <div className="space-y-4">
              {activeLangTab === 'id' && (
                <RichTextEditor
                  placeholder={t.admin.contentIdPlaceholder}
                  value={newsFormData.content.id}
                  onChange={(html) => handleNewsFormChange('content.id', html)}
                />
              )}
              {activeLangTab === 'en' && (
                <RichTextEditor
                  placeholder={t.admin.contentEnPlaceholder}
                  value={newsFormData.content.en}
                  onChange={(html) => handleNewsFormChange('content.en', html)}
                />
              )}
              {activeLangTab === 'cn' && (
                <RichTextEditor
                  placeholder={t.admin.contentCnPlaceholder}
                  value={newsFormData.content.cn}
                  onChange={(html) => handleNewsFormChange('content.cn', html)}
                />
              )}
            </div>
          </section>
          <div className="flex justify-end items-center space-x-3 pt-4">
            <button type="button" onClick={() => setIsPreviewOpen(true)} className="btn-secondary">
              {t.admin.preview}
            </button>
            {editingNews && (
              <button type="button" onClick={resetNewsForm} className="btn-secondary">
                {t.admin.cancelButton}
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={isSaving || !isNewsFormValid}>
              {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
              {isSaving
                ? t.admin.savingButton
                : editingNews
                ? t.admin.updateButton
                : t.admin.createButton}
            </button>
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-lg sticky top-28">
          <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
            {t.admin.currentNews}
          </h2>
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
            {news.length > 0 ? (
              news.map((article) => (
                <div
                  key={article.id}
                  className="bg-viniela-silver/50 p-3 rounded-lg flex items-start space-x-4"
                >
                  {article.imageUrls[0] && (
                    <img
                      src={article.imageUrls[0]}
                      alt={article.title.en}
                      className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                      loading="lazy"
                    />
                  )}
                  <div className="flex-grow">
                    <span className="text-xs font-semibold uppercase tracking-wider text-viniela-gold bg-viniela-gold/10 px-2 py-0.5 rounded-full">
                      {t.admin.categories[article.category]}
                    </span>
                    <h3 className="font-semibold text-viniela-dark line-clamp-2 mt-1 text-sm">
                      {article.title[t.langName.toLowerCase() as Language] || article.title.en}
                    </h3>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleEditNews(article)}
                        className="admin-action-btn bg-blue-500 hover:bg-blue-600"
                      >
                        <i className="fa-solid fa-pencil"></i>
                      </button>
                      <button
                        onClick={() => setNewsToDelete(article.id)}
                        className="admin-action-btn bg-red-500 hover:bg-red-600"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-viniela-gray text-center py-8">{t.admin.noNews}</p>
            )}
          </div>

          {newsMeta && newsMeta.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <button
                type="button"
                disabled={newsPage <= 1}
                onClick={() => loadNews(newsPage - 1)}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                « Prev
              </button>
              <span>
                Page {newsMeta.page} / {newsMeta.totalPages}
              </span>
              <button
                type="button"
                disabled={newsPage >= newsMeta.totalPages}
                onClick={() => loadNews(newsPage + 1)}
                className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next »
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCareersManagement = () => (
    <div className="animate-fade-in-up">
      <div className="flex justify-center border-b border-gray-300 mb-8">
        <button
          onClick={() => setActiveCareersSubTab('manage')}
          className={`sub-tab-button ${activeCareersSubTab === 'manage' ? 'sub-tab-active' : ''}`}
        >
          {t.admin.manageJobs}
        </button>
        <button
          onClick={() => setActiveCareersSubTab('view')}
          className={`sub-tab-button ${activeCareersSubTab === 'view' ? 'sub-tab-active' : ''}`}
        >
          {t.admin.viewApplications}
        </button>
      </div>
      {activeCareersSubTab === 'manage' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
              {editingJob ? t.admin.editJob : t.admin.formTitleJobs}
            </h2>
            <form onSubmit={handleJobFormSubmit} className="space-y-6">
              <section>
                <h3 className="form-section-title">{t.admin.jobTitle}</h3>
                <LangTabs />
                {activeLangTab === 'id' && (
                  <input
                    type="text"
                    placeholder={t.admin.titleIdPlaceholder}
                    value={jobFormData.title.id}
                    onChange={(e) =>
                      setJobFormData((p) => ({ ...p, title: { ...p.title, id: e.target.value } }))
                    }
                    className="form-input"
                    required
                  />
                )}
                {activeLangTab === 'en' && (
                  <input
                    type="text"
                    placeholder={t.admin.titleEnPlaceholder}
                    value={jobFormData.title.en}
                    onChange={(e) =>
                      setJobFormData((p) => ({ ...p, title: { ...p.title, en: e.target.value } }))
                    }
                    className="form-input"
                    required
                  />
                )}
                {activeLangTab === 'cn' && (
                  <input
                    type="text"
                    placeholder={t.admin.titleCnPlaceholder}
                    value={jobFormData.title.cn}
                    onChange={(e) =>
                      setJobFormData((p) => ({ ...p, title: { ...p.title, cn: e.target.value } }))
                    }
                    className="form-input"
                    required
                  />
                )}
              </section>
              <section>
                <h3 className="form-section-title">{t.admin.location}</h3>
                <LangTabs />
                {activeLangTab === 'id' && (
                  <input
                    type="text"
                    placeholder={t.admin.locationIdPlaceholder}
                    value={jobFormData.location.id}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        location: { ...p.location, id: e.target.value },
                      }))
                    }
                    className="form-input"
                    required
                  />
                )}
                {activeLangTab === 'en' && (
                  <input
                    type="text"
                    placeholder={t.admin.locationEnPlaceholder}
                    value={jobFormData.location.en}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        location: { ...p.location, en: e.target.value },
                      }))
                    }
                    className="form-input"
                    required
                  />
                )}
                {activeLangTab === 'cn' && (
                  <input
                    type="text"
                    placeholder={t.admin.locationCnPlaceholder}
                    value={jobFormData.location.cn}
                    onChange={(e) =>
                      setJobFormData((p) => ({
                        ...p,
                        location: { ...p.location, cn: e.target.value },
                      }))
                    }
                    className="form-input"
                    required
                  />
                )}
              </section>
              <section>
                <h3 className="form-section-title">{t.admin.jobType}</h3>
                <select
                  value={jobFormData.type}
                  onChange={(e) =>
                    setJobFormData((p) => ({ ...p, type: e.target.value as JobType }))
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
              <section>
                <h3 className="form-section-title">{t.admin.description}</h3>
                <LangTabs />
                {activeLangTab === 'id' && (
                  <RichTextEditor
                    placeholder={t.admin.descriptionIdPlaceholder}
                    value={jobFormData.description.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({ ...p, description: { ...p.description, id: val } }))
                    }
                  />
                )}
                {activeLangTab === 'en' && (
                  <RichTextEditor
                    placeholder={t.admin.descriptionEnPlaceholder}
                    value={jobFormData.description.en}
                    onChange={(val) =>
                      setJobFormData((p) => ({ ...p, description: { ...p.description, en: val } }))
                    }
                  />
                )}
                {activeLangTab === 'cn' && (
                  <RichTextEditor
                    placeholder={t.admin.descriptionCnPlaceholder}
                    value={jobFormData.description.cn}
                    onChange={(val) =>
                      setJobFormData((p) => ({ ...p, description: { ...p.description, cn: val } }))
                    }
                  />
                )}
              </section>
              <section>
                <h3 className="form-section-title">{t.admin.responsibilities}</h3>
                <LangTabs />
                {activeLangTab === 'id' && (
                  <RichTextEditor
                    placeholder={t.admin.responsibilitiesIdPlaceholder}
                    value={jobFormData.responsibilities.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        responsibilities: { ...p.responsibilities, id: val },
                      }))
                    }
                  />
                )}
                {activeLangTab === 'en' && (
                  <RichTextEditor
                    placeholder={t.admin.responsibilitiesEnPlaceholder}
                    value={jobFormData.responsibilities.en}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        responsibilities: { ...p.responsibilities, en: val },
                      }))
                    }
                  />
                )}
                {activeLangTab === 'cn' && (
                  <RichTextEditor
                    placeholder={t.admin.responsibilitiesCnPlaceholder}
                    value={jobFormData.responsibilities.cn}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        responsibilities: { ...p.responsibilities, cn: val },
                      }))
                    }
                  />
                )}
              </section>
              <section>
                <h3 className="form-section-title">{t.admin.qualifications}</h3>
                <LangTabs />
                {activeLangTab === 'id' && (
                  <RichTextEditor
                    placeholder={t.admin.qualificationsIdPlaceholder}
                    value={jobFormData.qualifications.id}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        qualifications: { ...p.qualifications, id: val },
                      }))
                    }
                  />
                )}
                {activeLangTab === 'en' && (
                  <RichTextEditor
                    placeholder={t.admin.qualificationsEnPlaceholder}
                    value={jobFormData.qualifications.en}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        qualifications: { ...p.qualifications, en: val },
                      }))
                    }
                  />
                )}
                {activeLangTab === 'cn' && (
                  <RichTextEditor
                    placeholder={t.admin.qualificationsCnPlaceholder}
                    value={jobFormData.qualifications.cn}
                    onChange={(val) =>
                      setJobFormData((p) => ({
                        ...p,
                        qualifications: { ...p.qualifications, cn: val },
                      }))
                    }
                  />
                )}
              </section>
              <div className="flex justify-end items-center space-x-3">
                {editingJob && (
                  <button type="button" onClick={resetJobForm} className="btn-secondary">
                    {t.admin.cancelButton}
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
                  {isSaving
                    ? t.admin.savingButton
                    : editingJob
                    ? t.admin.updateJob
                    : t.admin.createJob}
                </button>
              </div>
            </form>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-lg sticky top-28">
              <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
                {t.admin.currentJobs}
              </h2>
              <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job.id} className="bg-viniela-silver/50 p-4 rounded-lg">
                      <h3 className="font-semibold text-viniela-dark">
                        {job.title[t.langName.toLowerCase() as Language] || job.title.en}
                      </h3>
                      <p className="text-sm text-viniela-gray mt-1">
                        {t.admin.jobTypes[job.type]} &bull; {job.location.en}
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
                  <p className="text-viniela-gray text-center py-8">{t.admin.noJobs}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
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
                    {job.title.en}
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
                        <div className="text-sm font-medium text-gray-900">{app.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{app.jobTitle}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{app.email}</div>
                        <div className="text-sm text-gray-500">{app.phone}</div>
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
  );

  const renderTeamManagement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
          {editingTeamMember ? t.admin.editMember : t.admin.formTitleTeam}
        </h2>
        <form onSubmit={handleTeamFormSubmit} className="space-y-5">
          <div>
            <label className="form-label">{t.admin.nameLabel}</label>
            <input
              type="text"
              value={teamFormData.name}
              onChange={(e) => handleTeamFormChange('name', e.target.value)}
              className={`form-input ${teamFormErrors.name ? 'border-red-500' : ''}`}
              placeholder={t.admin.namePlaceholder}
            />
            {teamFormErrors.name && <p className="form-error">{teamFormErrors.name}</p>}
          </div>
          <div>
            <label className="form-label">{t.admin.jobTitle}</label>
            <LangTabs />
            {activeLangTab === 'id' && (
              <input
                type="text"
                value={teamFormData.title.id}
                onChange={(e) => handleTeamFormChange('title.id', e.target.value)}
                className="form-input"
                placeholder={t.admin.titleIdPlaceholder}
              />
            )}
            {activeLangTab === 'en' && (
              <input
                type="text"
                value={teamFormData.title.en}
                onChange={(e) => handleTeamFormChange('title.en', e.target.value)}
                className="form-input"
                placeholder={t.admin.titleEnPlaceholder}
              />
            )}
            {activeLangTab === 'cn' && (
              <input
                type="text"
                value={teamFormData.title.cn}
                onChange={(e) => handleTeamFormChange('title.cn', e.target.value)}
                className="form-input"
                placeholder={t.admin.titleCnPlaceholder}
              />
            )}
            {teamFormErrors.title && <p className="form-error">{teamFormErrors.title}</p>}
          </div>
          <div>
            <label className="form-label">{t.admin.bioLabel}</label>
            <LangTabs />
            {activeLangTab === 'id' && (
              <textarea
                value={teamFormData.bio.id}
                onChange={(e) => handleTeamFormChange('bio.id', e.target.value)}
                className="form-input h-24"
                placeholder={t.admin.bioIdPlaceholder}
              />
            )}
            {activeLangTab === 'en' && (
              <textarea
                value={teamFormData.bio.en}
                onChange={(e) => handleTeamFormChange('bio.en', e.target.value)}
                className="form-input h-24"
                placeholder={t.admin.bioEnPlaceholder}
              />
            )}
            {activeLangTab === 'cn' && (
              <textarea
                value={teamFormData.bio.cn}
                onChange={(e) => handleTeamFormChange('bio.cn', e.target.value)}
                className="form-input h-24"
                placeholder={t.admin.bioCnPlaceholder}
              />
            )}
          </div>
          <div>
            <label className="form-label">{t.admin.imageLabel}</label>
            <ImageUploader
              value={teamFormData.imageUrl}
              onChange={(val) => handleTeamFormChange('imageUrl', val)}
            />
          </div>
          <div>
            <label className="form-label">
              {t.admin.linkedinUrlLabel}{' '}
              <span className="text-gray-400 text-xs">{t.admin.optional}</span>
            </label>
            <input
              type="url"
              value={teamFormData.linkedinUrl}
              onChange={(e) => handleTeamFormChange('linkedinUrl', e.target.value)}
              className={`form-input ${teamFormErrors.linkedinUrl ? 'border-red-500' : ''}`}
              placeholder={t.admin.linkedinUrlPlaceholder}
            />
            {teamFormErrors.linkedinUrl && (
              <p className="form-error">{teamFormErrors.linkedinUrl}</p>
            )}
          </div>
          <div className="flex justify-end items-center space-x-3 pt-4">
            {editingTeamMember && (
              <button type="button" onClick={resetTeamForm} className="btn-secondary">
                {t.admin.cancelButton}
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={isSaving || !isTeamFormValid}>
              {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
              {isSaving
                ? t.admin.savingButton
                : editingTeamMember
                ? t.admin.updateMemberButton
                : t.admin.createMemberButton}
            </button>
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
            {t.admin.currentMembers}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-viniela-silver/50 p-4 rounded-lg flex items-center gap-4"
                >
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-viniela-dark truncate">{member.name}</h3>
                    <p className="text-xs text-viniela-gray truncate">{member.title.en}</p>
                    <div className="flex space-x-2 mt-2">
                      <button
                        onClick={() => handleEditTeamMember(member)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-100 px-2 py-1 rounded"
                      >
                        {t.admin.edit}
                      </button>
                      <button
                        onClick={() => setTeamToDelete(member.id)}
                        className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-100 px-2 py-1 rounded"
                      >
                        {t.admin.delete}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-2 text-center text-viniela-gray py-8">
                {t.admin.noTeamMembers}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPartnerManagement = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
          {editingPartner ? t.admin.editPartner : t.admin.formTitlePartners}
        </h2>
        <form onSubmit={handlePartnerFormSubmit} className="space-y-5">
          <div>
            <label className="form-label">{t.admin.partnerNameLabel}</label>
            <input
              type="text"
              value={partnerFormData.name}
              onChange={(e) => handlePartnerFormChange('name', e.target.value)}
              className={`form-input ${partnerFormErrors.name ? 'border-red-500' : ''}`}
              placeholder={t.admin.partnerNamePlaceholder}
            />
            {partnerFormErrors.name && <p className="form-error">{partnerFormErrors.name}</p>}
          </div>
          <div>
            <label className="form-label">{t.admin.logoLabel}</label>
            <ImageUploader
              value={partnerFormData.logoUrl}
              onChange={(val) => handlePartnerFormChange('logoUrl', val)}
            />
            {partnerFormErrors.logoUrl && <p className="form-error">{partnerFormErrors.logoUrl}</p>}
          </div>
          <div className="flex justify-end items-center space-x-3 pt-4">
            {editingPartner && (
              <button type="button" onClick={resetPartnerForm} className="btn-secondary">
                {t.admin.cancelButton}
              </button>
            )}
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving || !isPartnerFormValid}
            >
              {isSaving && <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />}
              {isSaving
                ? t.admin.savingButton
                : editingPartner
                ? t.admin.updatePartnerButton
                : t.admin.createPartnerButton}
            </button>
          </div>
        </form>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-viniela-dark border-b pb-3">
            {t.admin.currentPartners}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {partners.length > 0 ? (
              partners.map((partner) => (
                <div
                  key={partner.id}
                  className="bg-viniela-silver/50 p-4 rounded-lg flex flex-col items-center relative group"
                >
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="h-12 object-contain mb-2"
                  />
                  <p className="text-xs text-center font-medium text-viniela-gray">
                    {partner.name}
                  </p>
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-2">
                    <button
                      onClick={() => handleEditPartner(partner)}
                      className="p-2 bg-white rounded-full text-blue-600 hover:text-blue-800"
                    >
                      <i className="fa-solid fa-pencil"></i>
                    </button>
                    <button
                      onClick={() => setPartnerToDelete(partner.id)}
                      className="p-2 bg-white rounded-full text-red-600 hover:text-red-800"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-viniela-gray py-8">
                {t.admin.noPartners}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContactManagement = () => (
    <div className="bg-white p-8 rounded-xl shadow-lg animate-fade-in-up">
      <div className="overflow-x-auto">
        {contactMessages.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.sender}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.subject}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.admin.receivedOn}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contactMessages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <tr
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{msg.name}</div>
                      <div className="text-sm text-gray-500">{msg.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{msg.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(msg.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMessageToDelete(msg.id);
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors p-2 hover:bg-red-50 rounded-full"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                  {expandedMessageId === msg.id && (
                    <tr className="bg-gray-50 animate-fade-in">
                      <td colSpan={4} className="px-6 py-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-200">
                          {msg.message}
                        </p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <i className="fa-regular fa-envelope-open fa-3x text-gray-300 mb-4"></i>
            <p className="text-gray-500">{t.admin.noMessages}</p>
          </div>
        )}
      </div>
    </div>
  );

  // --- Initial Load ---
  useEffect(() => {
    loadNews(1);
    setJobs(careersService.getJobListings());
    setApplications(careersService.getApplications());
    setContactMessages(contactService.getContactMessages());
    setTeamMembers(teamService.getTeamMembers());
    setPartners(partnerService.getPartners());
  }, [loadNews]);

  return (
    <div className="min-h-screen bg-viniela-silver flex font-sans">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <ConfirmationModal
        isOpen={!!newsToDelete}
        onClose={() => setNewsToDelete(null)}
        onConfirm={confirmDeleteNews}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteNews}
      />
      <ConfirmationModal
        isOpen={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={confirmDeleteJob}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteJob}
      />
      <ConfirmationModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={confirmDeleteTeamMember}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteMember}
      />
      <ConfirmationModal
        isOpen={!!partnerToDelete}
        onClose={() => setPartnerToDelete(null)}
        onConfirm={confirmDeletePartner}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeletePartner}
      />
      <ConfirmationModal
        isOpen={!!messageToDelete}
        onClose={() => setMessageToDelete(null)}
        onConfirm={confirmDeleteMessage}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteMessage}
      />

      <NewsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        articleData={newsFormData}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-viniela-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-700 bg-black/20">
          <h1 className="text-2xl font-bold tracking-wider text-viniela-gold">ADMIN PANEL</h1>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as View);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeView === item.id
                  ? 'bg-viniela-gold text-white shadow-lg'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <i
                className={`${item.icon} w-6 text-center mr-3 transition-transform group-hover:scale-110`}
              ></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-sign-out-alt w-6 text-center mr-3"></i>
            <span className="font-medium">{t.admin.logout}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 h-20 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500 hover:text-viniela-dark"
            >
              <i className="fa-solid fa-bars fa-xl"></i>
            </button>
            <h2 className="text-2xl font-bold text-viniela-dark">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-500">Welcome, Admin</span>
            <div className="w-10 h-10 bg-viniela-gold rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-gray-100">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'news' && renderNewsManagement()}
            {activeView === 'careers' && renderCareersManagement()}
            {activeView === 'team' && renderTeamManagement()}
            {activeView === 'partners' && renderPartnerManagement()}
            {activeView === 'contact' && renderContactManagement()}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <style>{`
        .form-section-title { font-weight: 600; color: #1a1a1a; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .form-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.6rem 1rem; transition: all 0.2s; }
        .form-input:focus { border-color: #c09a58; outline: none; box-shadow: 0 0 0 3px rgba(192, 154, 88, 0.1); }
        .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.35rem; }
        .form-error { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }
        .translate-btn { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #c09a58; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 9999px; background-color: #fffbf0; transition: background 0.2s; }
        .translate-btn:hover:not(:disabled) { background-color: #fef3c7; }
        .translate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background-color: #c09a58; color: white; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-primary:hover:not(:disabled) { background-color: #b08b49; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-secondary { background-color: #f3f4f6; color: #4b5563; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; }
        .btn-secondary:hover { background-color: #e5e7eb; color: #1a1a1a; }
        .admin-action-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s; }
        .sub-tab-button { padding: 0.5rem 1.5rem; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .sub-tab-active { color: #c09a58; border-bottom-color: #c09a58; }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminPage;

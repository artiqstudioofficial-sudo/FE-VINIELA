import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import { GoogleGenAI, Type } from "@google/genai";

import { useTranslations } from "../../contexts/i18n";

import ConfirmationModal from "../../components/ConfirmationModal";
import ImageUploader from "../../components/ImageUploader";
import NewsPreviewModal from "../../components/NewsPreviewModal";
import RichTextEditor from "../../components/RichTextEditor";

import {
  createNews,
  deleteNews as deleteNewsApi,
  listNews,
  updateNews as updateNewsApi,
  type NewsFormPayload,
  type PaginatedNewsResponse,
} from "../../services/newsService";

import { NewsArticle, NewsCategory, Language } from "../../types";
import LangTabs from "./LangTabs";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const newsCategories: NewsCategory[] = [
  "company",
  "division",
  "industry",
  "press",
];

const emptyNewsArticle: NewsFormPayload = {
  title: { id: "", en: "", cn: "" },
  content: { id: "", en: "", cn: "" },
  imageUrls: [],
  category: "company",
};

type ToastFn = (message: string, type?: "success" | "error") => void;

interface NewsManagementViewProps {
  showToast: ToastFn;
}

const NewsManagementView: React.FC<NewsManagementViewProps> = ({
  showToast,
}) => {
  const { t } = useTranslations();

  const [activeLangTab, setActiveLangTab] = useState<Language>("id");

  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsMeta, setNewsMeta] = useState<
    PaginatedNewsResponse["meta"] | null
  >(null);
  const [newsPage, setNewsPage] = useState(1);
  const NEWS_LIMIT = 20;

  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [newsFormData, setNewsFormData] =
    useState<NewsFormPayload>(emptyNewsArticle);
  const [newsFormErrors, setNewsFormErrors] = useState<{
    [key: string]: string;
  }>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState({
    title: false,
    content: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newsToDelete, setNewsToDelete] = useState<string | null>(null);

  const validateField = useCallback(
    (name: string, value: string) => {
      let error = "";
      if (!value || value.trim() === "") {
        error = t.admin.validation.required;
      }

      setNewsFormErrors((prev) => ({ ...prev, [name]: error }));
    },
    [t.admin.validation.required]
  );

  const loadNews = useCallback(
    async (page: number = 1) => {
      try {
        const res = await listNews(page, NEWS_LIMIT);
        setNews(res.data);
        setNewsMeta(res.meta);
        setNewsPage(res.meta.page);
      } catch (err) {
        console.error("Failed to load news:", err);
        showToast(
          err instanceof Error
            ? err.message
            : "Gagal memuat berita dari server",
          "error"
        );
      }
    },
    [NEWS_LIMIT, showToast]
  );

  useEffect(() => {
    loadNews(1);
  }, [loadNews]);

  const handleNewsFormChange = useCallback(
    (field: string, value: any) => {
      const fieldName = field.replace(/\.(id|en|cn)$/, "");
      validateField(fieldName, typeof value === "string" ? value : "");

      setNewsFormData((prev) => {
        const keys = field.split(".");
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
    [validateField]
  );

  const processAndAddImages = useCallback((files: FileList) => {
    for (const file of Array.from(files)) {
      if (file && file.type.startsWith("image/")) {
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
    [processAndAddImages]
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

  const handleTranslate = async (field: "title" | "content") => {
    const sourceText = newsFormData[field].id;
    if (!sourceText) return;
    setIsTranslating((prev) => ({ ...prev, [field]: true }));
    try {
      const isHtml = field === "content";
      const prompt = isHtml
        ? `Translate the text content within the following HTML from Indonesian to English and Chinese. Preserve the HTML structure and tags. Indonesian HTML: "${sourceText}" Provide the response in a valid JSON format with keys "en" for English and "cn" for Chinese.`
        : `Translate the following Indonesian text to English and Chinese. Indonesian text: "${sourceText}" Provide the response in a valid JSON format with keys "en" for English and "cn" for Chinese.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              en: { type: Type.STRING },
              cn: { type: Type.STRING },
            },
            required: ["en", "cn"],
          },
        },
      });

      // NOTE: tergantung bentuk response SDK-nya
      // const translatedText = JSON.parse(response.text());
      // handleNewsFormChange(`${field}.en`, translatedText.en);
      // handleNewsFormChange(`${field}.cn`, translatedText.cn);
    } catch (error) {
      console.error("Translation failed:", error);
      showToast("Failed to translate text", "error");
    } finally {
      setIsTranslating((prev) => ({ ...prev, [field]: false }));
    }
  };

  const resetNewsForm = useCallback(() => {
    setEditingNews(null);
    setNewsFormData(emptyNewsArticle);
    setNewsFormErrors({});
  }, []);

  const handleNewsFormSubmit = async (e: FormEvent) => {
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
      console.error("Failed to save news:", err);
      showToast(
        err instanceof Error ? err.message : "Gagal menyimpan berita ke server",
        "error"
      );
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
      showToast(t.admin.toast.newsDeleted);
    } catch (err) {
      console.error("Failed to delete news:", err);
      showToast(
        err instanceof Error ? err.message : "Gagal menghapus berita di server",
        "error"
      );
    } finally {
      setNewsToDelete(null);
    }
  };

  const isNewsFormValid = useMemo(() => {
    return (
      Object.values(newsFormErrors).every((error) => !error) &&
      newsFormData.title.id
    );
  }, [newsFormErrors, newsFormData.title.id]);

  return (
    <>
      <ConfirmationModal
        isOpen={!!newsToDelete}
        onClose={() => setNewsToDelete(null)}
        onConfirm={confirmDeleteNews}
        title={t.admin.deleteModalTitle}
        message={t.admin.confirmDeleteNews}
      />

      <NewsPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        articleData={newsFormData}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in-up">
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
            {editingNews ? t.admin.editNews : t.admin.formTitle}
          </h2>
          <form onSubmit={handleNewsFormSubmit} className="space-y-6">
            {/* Title */}
            <section>
              <div className="flex justify-between items-center mb-1">
                <h3 className="form-section-title">{t.admin.titleLabel}</h3>
                <button
                  type="button"
                  onClick={() => handleTranslate("title")}
                  disabled={isTranslating.title || !newsFormData.title.id}
                  className="translate-btn"
                >
                  {isTranslating.title ? (
                    <i className="fa-solid fa-spinner fa-spin w-4 h-4" />
                  ) : (
                    <i className="fa-solid fa-language w-4 h-4" />
                  )}
                  <span>
                    {isTranslating.title
                      ? t.admin.translating
                      : t.admin.translateFromId}
                  </span>
                </button>
              </div>
              <LangTabs
                activeLang={activeLangTab}
                onChange={setActiveLangTab}
              />
              <div className="space-y-4">
                {activeLangTab === "id" && (
                  <input
                    type="text"
                    placeholder={t.admin.titleIdPlaceholder}
                    value={newsFormData.title.id}
                    onChange={(e) =>
                      handleNewsFormChange("title.id", e.target.value)
                    }
                    className={`form-input ${
                      newsFormErrors.title ? "border-red-500" : ""
                    }`}
                  />
                )}
                {activeLangTab === "en" && (
                  <input
                    type="text"
                    placeholder={t.admin.titleEnPlaceholder}
                    value={newsFormData.title.en}
                    onChange={(e) =>
                      handleNewsFormChange("title.en", e.target.value)
                    }
                    className="form-input"
                  />
                )}
                {activeLangTab === "cn" && (
                  <input
                    type="text"
                    placeholder={t.admin.titleCnPlaceholder}
                    value={newsFormData.title.cn}
                    onChange={(e) =>
                      handleNewsFormChange("title.cn", e.target.value)
                    }
                    className="form-input"
                  />
                )}
                {newsFormErrors.title && activeLangTab === "id" && (
                  <p className="form-error">{newsFormErrors.title}</p>
                )}
              </div>
            </section>

            {/* Category */}
            <section>
              <h3 className="form-section-title">{t.admin.categoryLabel}</h3>
              <select
                value={newsFormData.category}
                onChange={(e) =>
                  handleNewsFormChange(
                    "category",
                    e.target.value as NewsCategory
                  )
                }
                className="form-input"
              >
                {newsCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {t.admin.categories[cat]}
                  </option>
                ))}
              </select>
            </section>

            {/* Images */}
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
                      <i
                        className="fa-solid fa-xmark text-xs w-3 h-3"
                        aria-hidden="true"
                      ></i>
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
                  <i
                    className="fa-solid fa-cloud-arrow-up fa-2x w-8 h-8 mb-2"
                    aria-hidden="true"
                  ></i>
                  <p className="text-sm">
                    <span className="font-semibold">
                      {t.imageUploader.uploadCTA}
                    </span>{" "}
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

            {/* Content */}
            <section>
              <div className="flex justify-between items-center mb-1">
                <h3 className="form-section-title">{t.admin.contentLabel}</h3>
                <button
                  type="button"
                  onClick={() => handleTranslate("content")}
                  disabled={isTranslating.content || !newsFormData.content.id}
                  className="translate-btn"
                >
                  {isTranslating.content ? (
                    <i className="fa-solid fa-spinner fa-spin w-4 h-4" />
                  ) : (
                    <i className="fa-solid fa-language w-4 h-4" />
                  )}
                  <span>
                    {isTranslating.content
                      ? t.admin.translating
                      : t.admin.translateFromId}
                  </span>
                </button>
              </div>
              <LangTabs
                activeLang={activeLangTab}
                onChange={setActiveLangTab}
              />
              <div className="space-y-4">
                {activeLangTab === "id" && (
                  <RichTextEditor
                    placeholder={t.admin.contentIdPlaceholder}
                    value={newsFormData.content.id}
                    onChange={(html) =>
                      handleNewsFormChange("content.id", html)
                    }
                  />
                )}
                {activeLangTab === "en" && (
                  <RichTextEditor
                    placeholder={t.admin.contentEnPlaceholder}
                    value={newsFormData.content.en}
                    onChange={(html) =>
                      handleNewsFormChange("content.en", html)
                    }
                  />
                )}
                {activeLangTab === "cn" && (
                  <RichTextEditor
                    placeholder={t.admin.contentCnPlaceholder}
                    value={newsFormData.content.cn}
                    onChange={(html) =>
                      handleNewsFormChange("content.cn", html)
                    }
                  />
                )}
              </div>
            </section>

            <div className="flex justify-end items-center space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="btn-secondary"
              >
                {t.admin.preview}
              </button>
              {editingNews && (
                <button
                  type="button"
                  onClick={resetNewsForm}
                  className="btn-secondary"
                >
                  {t.admin.cancelButton}
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || !isNewsFormValid}
              >
                {isSaving && (
                  <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />
                )}
                {isSaving
                  ? t.admin.savingButton
                  : editingNews
                  ? t.admin.updateButton
                  : t.admin.createButton}
              </button>
            </div>
          </form>
        </div>

        {/* List news side */}
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
                        {article.title[t.langName.toLowerCase() as Language] ||
                          article.title.en}
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
                <p className="text-viniela-gray text-center py-8">
                  {t.admin.noNews}
                </p>
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
    </>
  );
};

export default NewsManagementView;

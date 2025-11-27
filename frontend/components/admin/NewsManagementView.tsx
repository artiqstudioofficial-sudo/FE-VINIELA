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

const ai = new GoogleGenAI({
  apiKey: "AIzaSyB0BBG9LSqG_aIGzOD3Paka8psv-HqMczA",
});

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

// base URL backend untuk file gambar
const IMAGE_BASE_URL = "http://localhost:4000";

const resolveImageUrl = (url: string) => {
  if (!url) return "";
  // kalau sudah full URL, biarkan
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  // kalau relatif ("/uploads/..." atau "uploads/..."), prepend base URL
  return `${IMAGE_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

type ToastFn = (message: string, type?: "success" | "error") => void;

interface NewsManagementViewProps {
  showToast: ToastFn;
}

const NewsManagementView: React.FC<NewsManagementViewProps> = ({
  showToast,
}) => {
  const { t } = useTranslations();

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

  const [isUploadingImages, setIsUploadingImages] = useState(false);

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
        console.error("Gagal memuat berita:", err);
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

  /**
   * Upload multiple gambar ke backend dan balikin array URL.
   */
  const uploadImagesToServer = useCallback(
    async (files: FileList | File[]): Promise<string[]> => {
      const fileArray: File[] = Array.isArray(files)
        ? files
        : Array.from(files as FileList);

      if (fileArray.length === 0) return [];

      const formData = new FormData();

      for (const file of fileArray) {
        if (file && file.type && file.type.startsWith("image/")) {
          formData.append("files", file);
        }
      }

      if (!formData.has("files")) {
        showToast("File yang dipilih bukan gambar", "error");
        return [];
      }

      try {
        setIsUploadingImages(true);

        const res = await fetch(
          "http://localhost:4000/api/news/upload-images",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          const errJson = await res.json().catch(() => null);
          const msg =
            errJson?.error || `Gagal upload gambar (status ${res.status})`;
          throw new Error(msg);
        }

        const data = await res.json();
        const urls: string[] = Array.isArray(data.urls)
          ? data.urls
          : Array.isArray(data.files)
          ? data.files
          : [];

        if (!urls.length) {
          showToast(
            "Upload berhasil, tapi tidak ada URL gambar dikembalikan",
            "error"
          );
        } else {
          showToast("Gambar berhasil diunggah", "success");
        }

        return urls;
      } catch (error) {
        console.error("Upload gambar gagal:", error);
        showToast("Gagal upload gambar", "error");
        return [];
      } finally {
        setIsUploadingImages(false);
      }
    },
    [showToast]
  );

  /**
   * Proses file (drag/drop atau pilih), upload, lalu simpan URL ke imageUrls
   */
  const processAndAddImages = useCallback(
    async (files: FileList | File[]) => {
      const urls = await uploadImagesToServer(files);
      if (!urls.length) return;

      setNewsFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls],
      }));
    },
    [uploadImagesToServer]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (isUploadingImages) return;
      if (e.dataTransfer.files) {
        processAndAddImages(e.dataTransfer.files);
      }
    },
    [processAndAddImages, isUploadingImages]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploadingImages) return;
    if (e.target.files) {
      processAndAddImages(e.target.files);
      e.target.value = ""; // reset supaya bisa pilih file yang sama lagi
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
        ? `Terjemahkan konten teks di dalam HTML berikut dari Bahasa Indonesia ke Bahasa Inggris dan Bahasa Mandarin. Pertahankan struktur dan tag HTML apa adanya. HTML Indonesia: "${sourceText}". Berikan respons dalam format JSON yang valid dengan key "en" untuk Bahasa Inggris dan "cn" untuk Bahasa Mandarin.`
        : `Terjemahkan teks Bahasa Indonesia berikut ke Bahasa Inggris dan Bahasa Mandarin. Teks Indonesia: "${sourceText}". Berikan respons dalam format JSON yang valid dengan key "en" untuk Bahasa Inggris dan "cn" untuk Bahasa Mandarin.`;

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

      // NOTE: sesuaikan dengan bentuk response SDK
      // const translatedText = JSON.parse(response.text());
      // handleNewsFormChange(`${field}.en`, translatedText.en);
      // handleNewsFormChange(`${field}.cn`, translatedText.cn);
    } catch (error) {
      console.error("Gagal menerjemahkan:", error);
      showToast("Gagal menerjemahkan teks", "error");
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

    if (isUploadingImages) {
      showToast("Tunggu sampai upload gambar selesai", "error");
      return;
    }

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
      console.error("Gagal menyimpan berita:", err);
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
      console.error("Gagal menghapus berita:", err);
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
        {/* FORM BERITA */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-viniela-dark border-b pb-4">
            {editingNews ? t.admin.editNews : t.admin.formTitle}
          </h2>
          <form onSubmit={handleNewsFormSubmit} className="space-y-6">
            {/* Judul */}
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
              <div className="space-y-2">
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
                {newsFormErrors.title && (
                  <p className="form-error">{newsFormErrors.title}</p>
                )}
              </div>
            </section>

            {/* Kategori */}
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

            {/* Gambar */}
            <section>
              <h3 className="form-section-title">{t.admin.imageLabel}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
                {newsFormData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={resolveImageUrl(url)}
                      alt={`pratinjau upload ${index}`}
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
                className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingImages
                    ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-70"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center text-viniela-gray">
                  <i
                    className="fa-solid fa-cloud-arrow-up fa-2x w-8 h-8 mb-2"
                    aria-hidden="true"
                  ></i>
                  <p className="text-sm">
                    <span className="font-semibold">
                      {isUploadingImages
                        ? t.imageUploader.uploading || "Mengunggah gambar..."
                        : t.imageUploader.uploadCTA}
                    </span>{" "}
                    {!isUploadingImages && t.imageUploader.dragAndDrop}
                  </p>
                  <p className="text-xs">{t.imageUploader.fileTypes}</p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingImages}
                />
              </label>
            </section>

            {/* Konten */}
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
              <RichTextEditor
                placeholder={t.admin.contentIdPlaceholder}
                value={newsFormData.content.id}
                onChange={(html) => handleNewsFormChange("content.id", html)}
              />
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
                disabled={isSaving || !isNewsFormValid || isUploadingImages}
              >
                {(isSaving || isUploadingImages) && (
                  <i className="fa-solid fa-spinner fa-spin w-5 h-5 mr-2" />
                )}
                {isUploadingImages
                  ? "Menunggu upload gambar..."
                  : isSaving
                  ? t.admin.savingButton
                  : editingNews
                  ? t.admin.updateButton
                  : t.admin.createButton}
              </button>
            </div>
          </form>
        </div>

        {/* DAFTAR BERITA / "Artikel saat ini" */}
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
                    {/* Gambar utama artikel */}
                    {article.imageUrls[0] && (
                      <img
                        src={resolveImageUrl(article.imageUrls[0])}
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
                          article.title.en ||
                          article.title.id}
                      </h3>

                      {/* Tambahan: deretan gambar lain untuk artikel ini */}
                      {article.imageUrls.length > 1 && (
                        <div className="flex mt-2 space-x-2 overflow-x-auto pb-1">
                          {article.imageUrls.slice(1, 4).map((url, idx) => (
                            <img
                              key={idx}
                              src={resolveImageUrl(url)}
                              alt={`gambar tambahan ${idx + 1}`}
                              className="w-10 h-10 rounded object-cover flex-shrink-0 border border-white shadow-sm"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}

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
                  « Sebelumnya
                </button>
                <span>
                  Halaman {newsMeta.page} / {newsMeta.totalPages}
                </span>
                <button
                  type="button"
                  disabled={newsPage >= newsMeta.totalPages}
                  onClick={() => loadNews(newsPage + 1)}
                  className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya »
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

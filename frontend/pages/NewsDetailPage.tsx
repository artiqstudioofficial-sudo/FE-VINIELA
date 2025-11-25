import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ShareButton from '../components/ShareButton';
import Sidebar from '../components/Sidebar';
import { useTranslations } from '../contexts/i18n';
import * as commentService from '../services/commentService';
import { getNewsById } from '../services/newsService';
import { Comment, NewsArticle } from '../types';

const GalleryModal: React.FC<{
  images: string[];
  selectedIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}> = ({ images, selectedIndex, onClose, onNavigate }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate((selectedIndex + 1) % images.length);
      if (e.key === 'ArrowLeft') onNavigate((selectedIndex - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [selectedIndex, images.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white text-3xl z-10 hover:opacity-75"
        onClick={onClose}
        aria-label="Close gallery"
      >
        <i className="fa-solid fa-xmark"></i>
      </button>

      <button
        className="absolute left-0 md:left-4 text-white text-4xl z-10 p-4 hover:opacity-75"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate((selectedIndex - 1 + images.length) % images.length);
        }}
        aria-label="Previous image"
      >
        &#10094;
      </button>

      <img
        src={images[selectedIndex]}
        alt={`Gallery image ${selectedIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      <button
        className="absolute right-0 md:right-4 text-white text-4xl z-10 p-4 hover:opacity-75"
        onClick={(e) => {
          e.stopPropagation();
          onNavigate((selectedIndex + 1) % images.length);
        }}
        aria-label="Next image"
      >
        &#10095;
      </button>
    </div>
  );
};

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslations();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentForm, setCommentForm] = useState({ name: '', email: '', message: '' });
  const [isCommentSubmitted, setIsCommentSubmitted] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // === Load article dari API + comments dari local service ===
  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const load = async () => {
      try {
        const data = await getNewsById(id); // async ke backend
        if (!isMounted) return;
        setArticle(data);
        setComments(commentService.getComments(id));
      } catch (err) {
        console.error('Failed to load article:', err);
        if (isMounted) {
          setArticle(null);
          setComments([]);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // === SEO / meta tags ===
  useEffect(() => {
    const defaultDescription =
      'A clean and modern corporate website for VINIELA Group, featuring company information, divisions, news, and a content management system for news articles. The site is multi-lingual and fully responsive.';

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (!metaDescriptionTag) {
      metaDescriptionTag = document.createElement('meta');
      metaDescriptionTag.setAttribute('name', 'description');
      document.head.appendChild(metaDescriptionTag);
    }

    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsTag) {
      metaKeywordsTag = document.createElement('meta');
      metaKeywordsTag.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywordsTag);
    }

    if (article) {
      const titleForLang = article.title[language] || article.title.en;
      const contentForLang = article.content[language] || article.content.en;

      const pageTitle = `${titleForLang} | VINIELA Group`;
      document.title = pageTitle;

      const plainContent = contentForLang
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const pageDescription =
        plainContent.length > 160 ? `${plainContent.substring(0, 157)}...` : plainContent;
      metaDescriptionTag.setAttribute('content', pageDescription);

      const keywords = [
        'VINIELA Group',
        t.admin.categories[article.category],
        ...titleForLang.split(' ').slice(0, 5),
      ].join(', ');
      metaKeywordsTag.setAttribute('content', keywords);

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: titleForLang,
        image: article.imageUrls,
        datePublished: new Date(article.date).toISOString(),
        author: { '@type': 'Organization', name: 'VINIELA Group' },
        publisher: { '@type': 'Organization', name: 'VINIELA Group' },
        description: pageDescription,
      };

      const scriptId = 'news-article-json-ld';
      document.getElementById(scriptId)?.remove();
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.innerHTML = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      document.title = 'VINIELA Group';
      document.getElementById('news-article-json-ld')?.remove();
      if (metaDescriptionTag) {
        metaDescriptionTag.setAttribute('content', defaultDescription);
      }
      if (metaKeywordsTag) {
        metaKeywordsTag.setAttribute('content', '');
      }
    };
  }, [article, language, t.admin.categories]);

  const handleCommentFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setCommentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (id && commentForm.name && commentForm.message) {
      const newComment = commentService.addComment({
        articleId: id,
        author: commentForm.name,
        email: commentForm.email,
        text: commentForm.message,
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentForm({ name: '', email: '', message: '' });
      setIsCommentSubmitted(true);
      setTimeout(() => setIsCommentSubmitted(false), 3000);
    }
  };

  const openGallery = (index: number) => {
    setSelectedImageIndex(index);
    setIsGalleryOpen(true);
  };

  if (!article) {
    return (
      <div className="container mx-auto px-6 py-20 text-center min-h-[50vh] flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">{t.newsDetail.notFound}</h1>
        <Link
          to="/news"
          className="mt-6 inline-block text-white bg-viniela-gold hover:bg-viniela-gold-dark px-6 py-2 rounded-lg transition-colors"
        >
          {t.newsDetail.backToNews}
        </Link>
      </div>
    );
  }

  const mockTags = t.newsDetail.mockTags;
  const categoryLabel = t.admin.categories[article.category];
  const titleForLang = article.title[language] || article.title.en;
  const contentForLang = article.content[language] || article.content.en;

  const mainImage =
    article.imageUrls && article.imageUrls.length > 0
      ? article.imageUrls[0]
      : 'https://picsum.photos/seed/placeholder/800/600';

  return (
    <div className="bg-white py-12 md:py-20 animate-fade-in-up">
      {isGalleryOpen && article.imageUrls && (
        <GalleryModal
          images={article.imageUrls}
          selectedIndex={selectedImageIndex}
          onClose={() => setIsGalleryOpen(false)}
          onNavigate={setSelectedImageIndex}
        />
      )}
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <main className="w-full lg:w-8/12 order-1 lg:order-2">
            <article>
              <button
                onClick={() => openGallery(0)}
                className="w-full block rounded-lg shadow-md overflow-hidden mb-6"
              >
                <img src={mainImage} alt={titleForLang} className="w-full h-auto object-cover" />
              </button>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-viniela-gray mb-4">
                <span className="inline-block px-3 py-1 bg-viniela-gold text-white font-semibold text-xs rounded uppercase">
                  {categoryLabel}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-user" aria-hidden="true"></i> {t.newsDetail.adminBy}
                </span>
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-comments" aria-hidden="true"></i>{' '}
                  {t.newsDetail.comments} ({comments.length})
                </span>
                <span className="flex items-center gap-2">
                  <i className="fa-solid fa-calendar-days" aria-hidden="true"></i>{' '}
                  {new Date(article.date).toLocaleDateString(
                    language === 'cn' ? 'zh-CN' : language,
                    { year: 'numeric', month: 'long', day: 'numeric' },
                  )}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-viniela-dark mb-4 leading-tight">
                {titleForLang}
              </h1>

              <div
                className="prose prose-lg max-w-none text-viniela-gray"
                dangerouslySetInnerHTML={{ __html: contentForLang }}
              />

              {/* Image Gallery Section */}
              {article.imageUrls.length > 1 && (
                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-viniela-dark mb-4 border-b pb-2">
                    Image Gallery
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {article.imageUrls.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => openGallery(index)}
                        className="aspect-square block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-viniela-gold"
                      >
                        <img
                          src={url}
                          alt={`Gallery thumbnail ${index + 1}`}
                          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-300"
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags & Share Footer */}
              <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-sm">
                <div className="flex flex-wrap items-center gap-4">
                  <h4 className="font-semibold text-viniela-dark flex-shrink-0">
                    {t.newsDetail.tags}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {mockTags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-viniela-silver rounded text-viniela-gray"
                      >
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="self-start sm:self-center">
                  <ShareButton title={titleForLang} url={window.location.href} />
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-viniela-dark mb-6 border-b pb-4">
                {t.newsDetail.comments} ({comments.length})
              </h2>
              <div className="space-y-6">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-4">
                      <img
                        src={comment.avatar}
                        alt={comment.author}
                        className="w-16 h-16 rounded-full flex-shrink-0"
                      />
                      <div className="flex-grow">
                        <h3 className="font-bold text-viniela-dark">{comment.author}</h3>
                        <p className="text-viniela-gray mt-1">{comment.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {new Date(comment.date).toLocaleString(
                              language === 'cn' ? 'zh-CN' : language,
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              },
                            )}
                          </p>
                          <button className="text-sm font-semibold text-viniela-gold hover:text-viniela-gold-dark">
                            {t.newsDetail.reply}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-viniela-gray text-center py-4">{t.newsDetail.noComments}</p>
                )}
              </div>
            </section>

            {/* Leave a Comment Form */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-viniela-dark mb-6 border-b pb-4">
                {t.newsDetail.leaveComment}
              </h2>
              <form
                onSubmit={handleCommentSubmit}
                className="p-8 bg-viniela-silver rounded-lg space-y-4"
              >
                {isCommentSubmitted && (
                  <div className="p-4 bg-green-100 text-green-800 border border-green-200 rounded-md text-center">
                    {t.newsDetail.commentSuccess}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    value={commentForm.name}
                    onChange={handleCommentFormChange}
                    placeholder={t.newsDetail.yourName}
                    className="form-input"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={commentForm.email}
                    onChange={handleCommentFormChange}
                    placeholder={t.newsDetail.yourEmail}
                    className="form-input"
                    required
                  />
                </div>
                <textarea
                  name="message"
                  value={commentForm.message}
                  onChange={handleCommentFormChange}
                  placeholder={t.newsDetail.writeMessage}
                  rows={5}
                  className="form-input"
                  required
                ></textarea>
                <button
                  type="submit"
                  className="px-8 py-3 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300"
                >
                  {t.newsDetail.postComment}
                </button>
              </form>
            </section>
          </main>

          {/* Sidebar container for correct ordering and width */}
          <div className="w-full lg:w-4/12 order-2 lg:order-1">
            {/* Mobile/Tablet Toggle Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="w-full flex justify-between items-center px-6 py-4 bg-viniela-silver rounded-lg text-left font-bold text-viniela-dark text-lg shadow-sm hover:shadow-md transition-shadow"
                aria-expanded={isSidebarOpen}
                aria-controls="news-sidebar-content"
              >
                <span>{t.newsDetail.exploreMore}</span>
                <i
                  className={`fa-solid fa-chevron-down w-6 h-6 transition-transform duration-300 ${
                    isSidebarOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                ></i>
              </button>
            </div>

            {/* Sidebar */}
            <aside
              id="news-sidebar-content"
              className={`${
                isSidebarOpen ? 'block mt-8 animate-fade-in-up' : 'hidden'
              } lg:block lg:mt-0`}
            >
              <Sidebar currentArticleId={id || ''} />
            </aside>
          </div>
        </div>
      </div>
      <style>{`
        .form-input {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 0.75rem 1rem;
          background-color: white;
        }
        .form-input:focus {
          outline: 2px solid transparent;
          outline-offset: 2px;
          border-color: #c09a58;
          box-shadow: 0 0 0 2px #c09a58;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default NewsDetailPage;

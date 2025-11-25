import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CTA from '../components/CTA';
import NewsCard from '../components/NewsCard';
import { useTranslations } from '../contexts/i18n';
import { listNews } from '../services/newsService';
import { NewsArticle, NewsCategory } from '../types';

const newsCategories: NewsCategory[] = ['company', 'division', 'industry', 'press'];

const NewsListPage: React.FC = () => {
  const { t, language } = useTranslations();
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Load data news dari backend ---
  useEffect(() => {
    window.scrollTo(0, 0);

    let isMounted = true;

    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);

        // ambil max 200 news
        const res = await listNews(1, 200);
        const news = res.data || [];

        // sort newest first (backup kalau backend belum sort)
        const sortedNews = [...news].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        if (!isMounted) return;
        setAllNews(sortedNews);
        setFilteredNews(sortedNews);
      } catch (err: any) {
        console.error('Failed to load news:', err);
        if (!isMounted) return;
        setError(err?.message || 'Failed to load news');
        setAllNews([]);
        setFilteredNews([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
    };
  }, []);

  // --- SEO / meta tags ---
  useEffect(() => {
    const pageTitle = `${t.newsList.title} | VINIELA Group`;
    document.title = pageTitle;

    const defaultDescription =
      'A clean and modern corporate website for VINIELA Group, featuring company information, divisions, news, and a content management system for news articles. The site is multi-lingual and fully responsive.';

    let metaDescriptionTag = document.querySelector('meta[name="description"]');
    if (metaDescriptionTag) {
      metaDescriptionTag.setAttribute('content', t.newsList.subtitle);
    }

    const keywords = [
      'VINIELA Group',
      t.nav.news,
      ...newsCategories.map((cat) => t.admin.categories[cat]),
    ].join(', ');

    let metaKeywordsTag = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsTag) {
      metaKeywordsTag = document.createElement('meta');
      metaKeywordsTag.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywordsTag);
    }
    metaKeywordsTag.setAttribute('content', keywords);

    return () => {
      document.title = 'VINIELA Group';
      if (metaDescriptionTag) {
        metaDescriptionTag.setAttribute('content', defaultDescription);
      }
      if (metaKeywordsTag) {
        metaKeywordsTag.setAttribute('content', '');
      }
    };
  }, [t]);

  // --- Filter kategori + search ---
  useEffect(() => {
    let tempNews = allNews;

    if (selectedCategory !== 'all') {
      tempNews = tempNews.filter((article) => article.category === selectedCategory);
    }

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      tempNews = tempNews.filter((article) => {
        const titleForLang = article.title[language] || article.title.en || '';
        const contentForLang = (article.content[language] || article.content.en || '')
          .replace(/<[^>]+>/g, '')
          .toLowerCase();

        return (
          titleForLang.toLowerCase().includes(lowercasedQuery) ||
          contentForLang.includes(lowercasedQuery)
        );
      });
    }

    setFilteredNews(tempNews);
  }, [selectedCategory, allNews, searchQuery, language]);

  return (
    <div className="bg-viniela-silver animate-fade-in-up">
      <section className="py-20">
        <div className="container mx-auto px-6">
          <header className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-viniela-dark">
              {t.newsList.title}
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-viniela-gray">
              {t.newsList.subtitle}
            </p>
          </header>

          <div className="max-w-xl mx-auto mb-8">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search.placeholderNews}
              className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-viniela-gold focus:border-viniela-gold transition"
              aria-label="Search news articles"
            />
          </div>

          <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                selectedCategory === 'all'
                  ? 'bg-viniela-gold text-white shadow-md'
                  : 'bg-white text-viniela-gray hover:bg-viniela-gold hover:text-white'
              }`}
            >
              {t.newsList.allCategories}
            </button>
            {newsCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-viniela-gold text-white shadow-md'
                    : 'bg-white text-viniela-gray hover:bg-viniela-gold hover:text-white'
                }`}
              >
                {t.admin.categories[category]}
              </button>
            ))}
          </div>

          {/* Loading & Error state */}
          {loading && (
            <div className="text-center py-16">
              <i className="fa-solid fa-spinner fa-spin text-3xl text-viniela-gold mb-4" />
              <p className="text-viniela-gray">Loading news...</p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16">
              <p className="text-xl text-red-600 mb-2">Failed to load news</p>
              <p className="text-sm text-viniela-gray">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {filteredNews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredNews.map((article) => (
                    <Link key={article.id} to={`/news/${article.id}`} className="block">
                      <NewsCard
                        article={article}
                        lang={language}
                        categoryTranslations={t.admin.categories}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-xl text-viniela-gray">{t.newsList.noArticles}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <CTA />
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NewsListPage;

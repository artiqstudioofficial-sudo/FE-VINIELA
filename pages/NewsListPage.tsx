import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import { getNews } from '../services/newsService';
import { NewsArticle, NewsCategory } from '../types';
import NewsCard from '../components/NewsCard';
import CTA from '../components/CTA';

const newsCategories: NewsCategory[] = ['company', 'division', 'industry', 'press'];

const NewsListPage: React.FC = () => {
    const { t, language } = useTranslations();
    const [allNews, setAllNews] = useState<NewsArticle[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        const news = getNews();
        // Sort news by date, newest first
        const sortedNews = news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllNews(sortedNews);
    }, []);

    useEffect(() => {
        const pageTitle = `${t.newsList.title} | VINIELA Group`;
        document.title = pageTitle;

        const defaultDescription = "A clean and modern corporate website for VINIELA Group, featuring company information, divisions, news, and a content management system for news articles. The site is multi-lingual and fully responsive.";
        
        let metaDescriptionTag = document.querySelector('meta[name="description"]');
        if (metaDescriptionTag) {
            metaDescriptionTag.setAttribute('content', t.newsList.subtitle);
        }

        const keywords = ['VINIELA Group', t.nav.news, ...newsCategories.map(cat => t.admin.categories[cat])].join(', ');
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
                // Clear keywords on unmount
                metaKeywordsTag.setAttribute('content', '');
            }
        };
    }, [t]);

    useEffect(() => {
        let tempNews = allNews;

        if (selectedCategory !== 'all') {
            tempNews = tempNews.filter(article => article.category === selectedCategory);
        }

        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            tempNews = tempNews.filter(article => {
                const title = article.title[language]?.toLowerCase() || '';
                const content = (article.content[language] || '').replace(/<[^>]+>/g, '').toLowerCase();
                return title.includes(lowercasedQuery) || content.includes(lowercasedQuery);
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
                        {newsCategories.map(category => (
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
                    
                    {filteredNews.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredNews.map(article => (
                                <Link key={article.id} to={`/news/${article.id}`} className="block">
                                    <NewsCard article={article} lang={language} categoryTranslations={t.admin.categories} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-xl text-viniela-gray">{t.newsList.noArticles}</p>
                        </div>
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
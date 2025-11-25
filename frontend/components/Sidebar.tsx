import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import { getNews } from '../services/newsService';
import { NewsArticle, NewsCategory } from '../types';

const newsCategories: NewsCategory[] = ['company', 'division', 'industry', 'press'];

const SidebarWidget: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-viniela-silver p-6 rounded-lg">
        <h3 className="text-xl font-bold text-viniela-dark pb-3 mb-4 border-b-2 border-viniela-gold/30">{title}</h3>
        {children}
    </div>
);

const Sidebar: React.FC<{ currentArticleId?: string }> = ({ currentArticleId }) => {
    const { t, language } = useTranslations();
    const [allNews, setAllNews] = useState<NewsArticle[]>([]);
    
    useEffect(() => {
        const news = getNews();
        const sortedNews = news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllNews(sortedNews);
    }, []);

    const categoryCounts = newsCategories.reduce((acc, category) => {
        acc[category] = allNews.filter(article => article.category === category).length;
        return acc;
    }, {} as Record<NewsCategory, number>);

    const mockTags = t.newsDetail.mockTags;
    
    const recentPosts = allNews.filter(a => a.id !== currentArticleId).slice(0, 3);
    
    return (
        <div className="space-y-8 lg:sticky lg:top-28">
            {/* Search */}
            <SidebarWidget title={t.sidebar.search}>
                <form className="relative">
                    <input type="search" placeholder={t.sidebar.searchPlaceholder} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-viniela-gold focus:border-viniela-gold" />
                    <button type="submit" className="absolute top-0 right-0 h-full px-3 text-viniela-gray hover:text-viniela-dark">
                        <i className="fa-solid fa-search" aria-hidden="true"></i>
                    </button>
                </form>
            </SidebarWidget>

            {/* Categories */}
            <SidebarWidget title={t.sidebar.categories}>
                <ul className="space-y-3">
                    {newsCategories.map(category => (
                        <li key={category}>
                            <Link to="/news" className="flex justify-between items-center text-viniela-gray hover:text-viniela-gold transition-colors group">
                                <span className="flex items-center gap-2">
                                    <i className="fa-solid fa-arrow-right text-viniela-gold/50 group-hover:text-viniela-gold transition-colors" aria-hidden="true"></i>
                                    {t.admin.categories[category]}
                                </span>
                                <span>({categoryCounts[category] || 0})</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </SidebarWidget>

             {/* Recent Posts */}
            <SidebarWidget title={t.sidebar.recentPosts}>
                 <div className="space-y-4">
                    {recentPosts.map(post => (
                         <Link key={post.id} to={`/news/${post.id}`} className="flex items-center gap-4 group">
                             <img src={post.imageUrl} alt={post.title[language]} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                             <div>
                                 <p className="text-xs text-gray-500">{new Date(post.date).toLocaleDateString()}</p>
                                 <h4 className="font-semibold text-viniela-dark leading-tight line-clamp-2 group-hover:text-viniela-gold transition-colors">{post.title[language]}</h4>
                             </div>
                         </Link>
                    ))}
                 </div>
            </SidebarWidget>

            {/* Tags */}
            <SidebarWidget title={t.sidebar.tags}>
                <div className="flex flex-wrap gap-2">
                    {mockTags.map(tag => (
                        <Link key={tag} to="/news" className="px-4 py-1.5 bg-white border rounded hover:bg-viniela-gold hover:text-white hover:border-viniela-gold transition-colors text-sm text-viniela-gray">
                            {tag}
                        </Link>
                    ))}
                </div>
            </SidebarWidget>
        </div>
    );
};

export default Sidebar;
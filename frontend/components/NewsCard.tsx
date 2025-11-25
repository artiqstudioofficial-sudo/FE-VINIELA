import React from 'react';
import { NewsArticle, Language, NewsCategory } from '../types';

interface NewsCardProps {
  article: NewsArticle | Omit<NewsArticle, 'id' | 'date'>;
  lang: Language;
  categoryTranslations?: { [key in NewsCategory]: string };
}

const NewsCard: React.FC<NewsCardProps> = ({ article, lang, categoryTranslations }) => {
    const displayDate = 'date' in article ? article.date : new Date().toISOString().split('T')[0];
    const category = (article as NewsArticle).category;
    const categoryLabel = categoryTranslations && category ? categoryTranslations[category] : '';
    const mainImage = article.imageUrls && article.imageUrls.length > 0 ? article.imageUrls[0] : 'https://picsum.photos/seed/placeholder/600/400';

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 flex flex-col">
            <img className="h-56 w-full object-cover" src={mainImage} alt={article.title[lang]} loading="lazy" />
            <div className="p-6 flex flex-col flex-grow">
                {categoryLabel && (
                    <p className="text-xs font-bold uppercase tracking-wider text-viniela-gold mb-1">{categoryLabel}</p>
                )}
                <p className="text-sm text-viniela-gray">{new Date(displayDate).toLocaleDateString()}</p>
                <h3 className="mt-2 text-xl font-semibold text-viniela-dark">{article.title[lang] || `[${lang.toUpperCase()} Title]`}</h3>
                <div 
                    className="mt-2 text-viniela-gray text-base line-clamp-3 prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content[lang] || `<p>[${lang.toUpperCase()} Content]</p>` }}
                />
            </div>
        </div>
    );
};

export default NewsCard;
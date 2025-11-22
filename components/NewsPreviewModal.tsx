import React, { useState, useEffect } from 'react';
import { NewsArticle, Language } from '../types';
import { useTranslations } from '../contexts/i18n';
import NewsCard from './NewsCard';
import translations from '../data/translations';

interface NewsPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleData: Omit<NewsArticle, 'id' | 'date'>;
}

const NewsPreviewModal: React.FC<NewsPreviewModalProps> = ({ isOpen, onClose, articleData }) => {
  const [activeLang, setActiveLang] = useState<Language>('id');
  const { t } = useTranslations();

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const languages: { key: Language; name: string }[] = [
    { key: 'id', name: translations.id.langName },
    { key: 'en', name: translations.en.langName },
    { key: 'cn', name: translations.cn.langName },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-viniela-silver rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 sticky top-0 bg-viniela-silver border-b z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-viniela-dark">{t.admin.previewTitle}</h2>
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-viniela-dark rounded-full hover:bg-gray-200 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="mt-4 border-b border-gray-300">
            <nav className="-mb-px flex space-x-6">
              {languages.map(lang => (
                <button
                  key={lang.key}
                  onClick={() => setActiveLang(lang.key)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeLang === lang.key
                      ? 'border-viniela-gold text-viniela-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="p-6">
            <p className="text-center text-viniela-gray mb-6 text-sm">{t.admin.previewSubtitle}</p>
            <div className="max-w-md mx-auto">
                <NewsCard 
                    article={articleData} 
                    lang={activeLang} 
                    categoryTranslations={t.admin.categories}
                />
            </div>
        </div>
      </div>
       <style>{`
          @keyframes fade-in {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.3s ease-out forwards;
          }
      `}</style>
    </div>
  );
};

export default NewsPreviewModal;
import React, { useEffect, useState } from 'react';
import { useTranslations } from '../contexts/i18n';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer, isOpen, onClick }) => (
  <div className="border-b border-gray-200 last-of-type:border-b-0">
    <button
      onClick={onClick}
      className="flex justify-between items-center w-full py-5 text-left"
      aria-expanded={isOpen}
    >
      <span className="text-lg font-semibold text-viniela-dark">{question}</span>
      <i
        className={`fa-solid fa-chevron-down w-6 h-6 text-viniela-gold flex-shrink-0 transform transition-transform duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-hidden="true"
      ></i>
    </button>
    <div
      className={`grid transition-all duration-500 ease-in-out ${
        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="overflow-hidden">
        <div
          className="pb-5 pr-4 text-viniela-gray prose"
          dangerouslySetInnerHTML={{ __html: answer }}
        />
      </div>
    </div>
  </div>
);

const FaqPage: React.FC = () => {
  const { t } = useTranslations();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const { title, subtitle, categories } = t.faq;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleToggle = (key: string) => {
    setOpenKey(openKey === key ? null : key);
  };

  return (
    <div className="bg-viniela-silver animate-fade-in-up">
      <header className="py-20 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-viniela-dark">{title}</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-viniela-gray">{subtitle}</p>
        </div>
      </header>
      <main className="pb-20">
        <div className="container mx-auto px-6 max-w-4xl space-y-12">
          {categories.map((category, catIndex) => (
            <div key={catIndex}>
              <h2 className="text-3xl font-bold text-viniela-dark text-center mb-8">
                {category.categoryTitle}
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                {category.items.map((item, itemIndex) => {
                  const key = `${catIndex}-${itemIndex}`;
                  return (
                    <FaqItem
                      key={key}
                      question={item.question}
                      answer={item.answer}
                      isOpen={openKey === key}
                      onClick={() => handleToggle(key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { 
                    animation: fade-in-up 0.6s ease-out forwards; 
                }
            `}</style>
    </div>
  );
};

export default FaqPage;

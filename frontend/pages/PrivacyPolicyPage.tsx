import React, { useEffect } from 'react';
import { useTranslations } from '../contexts/i18n';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useTranslations();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { title, lastUpdated, introduction, sections } = t.privacyPolicy;

  return (
    <div className="bg-white animate-fade-in-up">
      <header className="bg-viniela-dark text-white py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">{title}</h1>
          <p className="mt-2 text-lg text-gray-300">{lastUpdated}</p>
        </div>
      </header>
      <main className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="prose prose-lg max-w-none text-viniela-gray">
            <p className="lead">{introduction}</p>
            {sections.map((section, index) => (
              <div key={index} className="mt-8">
                <h2 className="!text-viniela-dark !mb-3">{section.title}</h2>
                <div dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            ))}
          </div>
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
                .prose ul > li::before {
                    background-color: #c09a58;
                }
            `}</style>
    </div>
  );
};

export default PrivacyPolicyPage;

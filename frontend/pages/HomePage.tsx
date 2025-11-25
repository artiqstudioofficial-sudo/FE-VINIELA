import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CTA from '../components/CTA';
import NewsCard from '../components/NewsCard';
import { divisions } from '../constants';
import { useTranslations } from '../contexts/i18n';
import useOnScreen from '../hooks/useOnScreen';
import { listNews } from '../services/newsService';
import * as partnerService from '../services/partnerService';
import { Division, NewsArticle, Partner } from '../types';

const HomePage: React.FC = () => {
  const { t, language } = useTranslations();
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Ambil 3 berita terbaru dari API
        const res = await listNews(1, 3);
        setLatestNews(res.data);
      } catch (err) {
        console.error('Failed to load news:', err);
        setLatestNews([]);
      }

      // Partner masih pakai local service
      setPartners(partnerService.getPartners());
    };

    load();
  }, []);

  // Refs for scroll animations
  const [aboutRef, isAboutVisible] = useOnScreen({ threshold: 0.2 });
  const [divisionsRef, isDivisionsVisible] = useOnScreen({ threshold: 0.1 });
  const [partnersRef, isPartnersVisible] = useOnScreen({ threshold: 0.1 });
  const [newsRef, isNewsVisible] = useOnScreen({ threshold: 0.1 });

  // Helper to get nested translation
  const getTranslation = (key: string) => {
    const keys = key.split('.');
    let result: any = t;
    for (const k of keys) {
      result = result?.[k];
      if (typeof result === 'undefined') return key;
    }
    return result;
  };

  const renderDivisionItem = (division: Division) => (
    <Link
      key={division.name}
      to={division.url}
      className="group flex flex-col items-center p-6 bg-white rounded-xl shadow-md text-center transform hover:-translate-y-2 transition-transform duration-300"
    >
      <div className="bg-viniela-gold text-white p-4 rounded-full mb-4 transition-all duration-300 group-hover:scale-110">
        <division.Icon className="w-8 h-8" />
      </div>
      <h3 className="font-semibold text-viniela-dark">{getTranslation(division.name)}</h3>
      <p className="text-sm text-viniela-gray mt-2 opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-40 transition-all duration-300">
        {getTranslation(division.description)}
      </p>
    </Link>
  );

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center text-white bg-viniela-dark overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://picsum.photos/seed/modern-glass-building/1920/1080')",
          }}
        ></div>
        <div className="absolute inset-0 bg-black opacity-40 z-0"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 animate-fade-in-down">
            {t.home.heroTitle}
          </h1>
          <p
            className="text-lg md:text-xl max-w-3xl mx-auto animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            {t.home.heroSubtitle}
          </p>
          <a
            href="#divisions"
            className="mt-8 inline-block px-8 py-3 bg-viniela-gold font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300 transform hover:scale-105 animate-fade-in-up"
            style={{ animationDelay: '0.6s' }}
          >
            {t.home.heroButton}
          </a>
        </div>
      </section>

      {/* About Section */}
      <section
        ref={aboutRef}
        className={`py-20 bg-white transition-all duration-700 ease-out ${
          isAboutVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
                {t.home.aboutSectionTitle}
              </h2>
              <p className="mt-4 max-w-xl mx-auto md:mx-0 text-lg text-viniela-gray">
                {t.home.aboutSectionContent}
              </p>
            </div>
            <div
              className="relative w-full overflow-hidden rounded-xl shadow-lg"
              style={{ paddingTop: '56.25%' }}
            >
              {/* 16:9 Aspect Ratio */}
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src="https://www.youtube.com/embed/6bTu_y4-p3E?rel=0&showinfo=0&modestbranding=1"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Viniela Group Profile Video"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section
        ref={divisionsRef}
        id="divisions"
        className={`py-20 bg-viniela-silver transition-all duration-700 ease-out ${
          isDivisionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-viniela-dark mb-12">
            {t.home.divisionsSectionTitle}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {divisions.map(renderDivisionItem)}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section
        ref={partnersRef}
        className={`py-16 bg-white transition-all duration-700 ease-out ${
          isPartnersVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-viniela-dark mb-10">
            {t.home.partnersSectionTitle}
          </h2>
          <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)] group">
            <div className="flex items-center whitespace-nowrap animate-scroll group-hover:[animation-play-state:paused]">
              {partners.length > 0 &&
                [...partners, ...partners].map((partner, index) => (
                  <div
                    key={`${partner.id}-${index}`}
                    className="flex-shrink-0 w-64 flex justify-center px-4"
                  >
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="h-10 w-auto max-h-10 object-contain"
                      title={partner.name}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <section
        ref={newsRef}
        id="news"
        className={`py-20 bg-viniela-silver transition-all duration-700 ease-out ${
          isNewsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-viniela-dark mb-12">
            {t.home.newsSectionTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestNews.map((article) => (
              <Link key={article.id} to={`/news/${article.id}`} className="block">
                <NewsCard
                  article={article}
                  lang={language}
                  categoryTranslations={t.admin.categories}
                />
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              to="/news"
              className="px-8 py-3 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300 transform hover:scale-105"
            >
              {t.home.viewAllNews}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTA />

      <style>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
          animation-fill-mode: backwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          animation-fill-mode: backwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;

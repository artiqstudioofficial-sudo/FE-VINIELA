import React, { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import CTA from '../components/CTA';
import { divisions } from '../constants';
import { useTranslations } from '../contexts/i18n';
import useOnScreen from '../hooks/useOnScreen';

// --- CHILD COMPONENTS ---

const Section: React.FC<{
  children: React.ReactNode;
  className?: string;
  refHook: ReturnType<typeof useOnScreen>;
}> = ({ children, className = '', refHook }) => {
  const [ref, isVisible] = refHook;
  return (
    <section
      ref={ref}
      className={`py-20 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      <div className="container mx-auto px-6">{children}</div>
    </section>
  );
};

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="text-center max-w-3xl mx-auto mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">{title}</h2>
    {subtitle && <p className="mt-4 text-lg text-viniela-gray">{subtitle}</p>}
  </div>
);

// --- MAIN PAGE COMPONENT ---

const DivisionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, language } = useTranslations();

  const division = divisions.find((d) => d.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  const getTranslation = (key: string, data: any) => {
    const keys = key.split('.');
    let result = data;
    for (const k of keys) {
      result = result?.[k];
      if (typeof result === 'undefined') return key;
    }
    return result;
  };

  // Get division-specific content, or fallback to default
  const divisionContent =
    t.divisionContent[slug as keyof typeof t.divisionContent] || t.divisionContent.default;

  // Animation Refs
  const aboutRef = useOnScreen({ threshold: 0.2, triggerOnce: true });
  const servicesRef = useOnScreen({ threshold: 0.2, triggerOnce: true });
  const processRef = useOnScreen({ threshold: 0.2, triggerOnce: true });
  const whyUsRef = useOnScreen({ threshold: 0.2, triggerOnce: true });

  if (!division) {
    return <Navigate to="/" replace />;
  }

  const { Icon } = division;
  const divisionName = getTranslation(division.name, t);
  const divisionDescription = getTranslation(division.description, t);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <header className="relative py-24 md:py-32 flex items-center text-white bg-viniela-dark overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url('https://picsum.photos/seed/${slug}/1920/1080')` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-viniela-dark via-viniela-dark/80 to-transparent z-0"></div>
        <div className="relative z-10 container mx-auto px-6 text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{divisionName}</h1>
          <p className="text-lg md:text-xl max-w-3xl mx-auto mt-4 text-gray-300">
            {divisionDescription}
          </p>
        </div>
      </header>

      <main>
        {/* About Section */}
        <Section refHook={aboutRef}>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-viniela-dark mb-4">
                {divisionContent.aboutTitle}
              </h2>
              <p className="text-lg text-viniela-gray leading-relaxed">
                {divisionContent.aboutContent}
              </p>
            </div>
            <div className="rounded-xl shadow-lg overflow-hidden">
              <img
                src={`https://picsum.photos/seed/${slug}-about/800/600`}
                alt={divisionContent.aboutTitle}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Section>

        {/* Services Section */}
        <Section refHook={servicesRef} className="bg-viniela-silver">
          <SectionHeader title={t.divisionDetail.ourServices} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {divisionContent.services.map(
              (service: { icon: string; title: string; description: string }, index: number) => (
                <div
                  key={index}
                  className="bg-white p-8 rounded-xl shadow-md text-center transform hover:-translate-y-2 transition-transform duration-300"
                >
                  <div className="inline-flex items-center justify-center bg-viniela-gold/10 text-viniela-gold p-4 rounded-full mb-4">
                    <i className={`${service.icon} fa-2x w-8 h-8`}></i>
                  </div>
                  <h3 className="text-xl font-bold text-viniela-dark">{service.title}</h3>
                  <p className="mt-2 text-viniela-gray">{service.description}</p>
                </div>
              ),
            )}
          </div>
        </Section>

        {/* Process Section */}
        <Section refHook={processRef}>
          <SectionHeader title={t.divisionDetail.ourProcess} />
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block"></div>
            {divisionContent.processSteps.map(
              (step: { title: string; description: string }, index: number) => (
                <div key={index} className="relative flex md:items-center mb-12 md:mb-0 group">
                  <div className="hidden md:flex flex-col items-center justify-center w-1/2 group-odd:order-3">
                    <div className={`h-40 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}></div>
                  </div>
                  <div className="absolute md:relative left-0 md:left-auto top-0 transform -translate-x-1/2 md:transform-none bg-viniela-gold text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl border-4 border-white shadow-md">
                    {index + 1}
                  </div>
                  <div className="ml-12 md:ml-0 md:w-1/2 p-6 bg-viniela-silver rounded-xl shadow-md md:group-odd:ml-auto md:group-even:mr-auto">
                    <h3 className="text-xl font-bold text-viniela-dark">{step.title}</h3>
                    <p className="mt-2 text-viniela-gray">{step.description}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </Section>

        {/* Why Choose Us Section */}
        <Section refHook={whyUsRef} className="bg-viniela-silver">
          <SectionHeader title={t.divisionDetail.whyChooseUs} />
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {divisionContent.whyUsPoints.map(
              (point: { icon: string; title: string; description: string }, index: number) => (
                <div key={index} className="flex items-start gap-6">
                  <div className="flex-shrink-0 bg-viniela-gold/10 text-viniela-gold p-4 rounded-full">
                    <i className={`${point.icon} fa-2x w-8 h-8`}></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-viniela-dark">{point.title}</h3>
                    <p className="mt-2 text-viniela-gray">{point.description}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </Section>

        {/* Division CTA */}
        <CTA
          title={t.divisionDetail.ctaTitle}
          buttonText={t.divisionDetail.ctaButton}
          imageUrl={`https://picsum.photos/seed/${slug}-cta/800/600`}
          imageAlt={divisionName}
        />
      </main>

      <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { 
                    animation: fade-in-up 0.6s ease-out forwards; 
                }
                /* Process timeline line for mobile */
                @media (max-width: 767px) {
                    .relative.flex.md\\:items-center:not(:last-child)::before {
                        content: '';
                        position: absolute;
                        left: 24px; /* center of the 48px circle */
                        top: 48px; /* below the circle */
                        bottom: -48px; /* space between items */
                        width: 2px;
                        background-color: #e5e7eb; /* gray-200 */
                        transform: translateX(-50%);
                    }
                }
            `}</style>
    </div>
  );
};

export default DivisionDetailPage;

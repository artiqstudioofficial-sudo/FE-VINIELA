import React, { useEffect, useState } from 'react';
import CTA from '../components/CTA';
import { useTranslations } from '../contexts/i18n';
import useOnScreen from '../hooks/useOnScreen';

// Animated Counter Component
const AnimatedCounter: React.FC<{ target: number; isYear?: boolean }> = ({
  target,
  isYear = false,
}) => {
  const [count, setCount] = useState(isYear ? 1980 : 0);

  useEffect(() => {
    let start = isYear ? 1980 : 0;
    const end = target;
    if (start === end) return;

    const duration = 2000;
    const range = end - start;
    const stepTime = Math.max(1, Math.floor(duration / range));

    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, isYear]);

  return (
    <span>
      {count.toLocaleString()}
      {isYear ? '' : '+'}
    </span>
  );
};

const AboutPage: React.FC = () => {
  const { t } = useTranslations();

  // Observer Refs for animations
  const [heroRef, isHeroVisible] = useOnScreen({ threshold: 0.3, triggerOnce: true });
  const [aboutRef, isAboutVisible] = useOnScreen({ threshold: 0.2, triggerOnce: true });
  const [visionMissionRef, isVisionMissionVisible] = useOnScreen({
    threshold: 0.2,
    triggerOnce: true,
  });
  const [advantagesRef, isAdvantagesVisible] = useOnScreen({ threshold: 0.2, triggerOnce: true });
  const [statsRef, isStatsVisible] = useOnScreen({ threshold: 0.3, triggerOnce: true });

  const advantages = [
    { title: t.about.advantage1Title, content: t.about.advantage1Content },
    { title: t.about.advantage2Title, content: t.about.advantage2Content },
    { title: t.about.advantage3Title, content: t.about.advantage3Content },
  ];

  const stats = [
    { label: t.about.stat1Label, value: 15 },
    { label: t.about.stat2Label, value: 50 },
    { label: t.about.stat3Label, value: 2020, isYear: true },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative h-[50vh] flex items-center justify-center text-white bg-viniela-dark overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
          style={{
            backgroundImage: "url('https://picsum.photos/seed/corporate/1920/1080')",
            transform: isHeroVisible ? 'scale(1)' : 'scale(1.1)',
          }}
        ></div>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center px-4">
          <h1
            className={`text-4xl md:text-5xl font-extrabold tracking-tight transition-all duration-700 ease-out ${
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            {t.about.heroTitle}
          </h1>
          <p
            className={`text-lg md:text-xl mt-2 transition-all duration-700 ease-out delay-200 ${
              isHeroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
          >
            {t.about.heroSubtitle}
          </p>
        </div>
      </section>

      {/* About Viniela Group Section */}
      <section ref={aboutRef} className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div
              className={`transition-all duration-700 ease-out ${
                isAboutVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
                {t.about.aboutSectionTitle}
              </h2>
              <p className="mt-4 text-lg text-viniela-gray">{t.about.aboutSectionContent}</p>
            </div>
            <div
              className={`transition-all duration-700 ease-out delay-200 ${
                isAboutVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <img
                src="https://picsum.photos/seed/team/600/500"
                alt="VINIELA Group Team"
                className="rounded-xl shadow-lg w-full"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision and Mission Section */}
      <section ref={visionMissionRef} className="py-20 bg-viniela-silver">
        <div className="container mx-auto px-6">
          <div
            className={`text-center transition-all duration-700 ease-out mb-12 ${
              isVisionMissionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
              {t.about.visionMissionTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div
              className={`bg-white p-8 rounded-xl shadow-lg flex items-start gap-6 transition-all duration-700 ease-out delay-100 hover:shadow-2xl hover:-translate-y-2 ${
                isVisionMissionVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <div className="bg-viniela-gold/10 text-viniela-gold p-3 rounded-full flex-shrink-0">
                <i className="fa-solid fa-eye fa-2x w-8 h-8" aria-hidden="true"></i>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-viniela-gold mb-3">
                  {t.about.visionTitle}
                </h3>
                <p className="text-viniela-gray">{t.about.visionContent}</p>
              </div>
            </div>
            <div
              className={`bg-white p-8 rounded-xl shadow-lg flex items-start gap-6 transition-all duration-700 ease-out delay-300 hover:shadow-2xl hover:-translate-y-2 ${
                isVisionMissionVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="bg-viniela-gold/10 text-viniela-gold p-3 rounded-full flex-shrink-0">
                <i className="fa-solid fa-bullseye fa-2x w-8 h-8" aria-hidden="true"></i>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-viniela-gold mb-3">
                  {t.about.missionTitle}
                </h3>
                <p className="text-viniela-gray">{t.about.missionContent}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-viniela-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22M0%2040L40%200H20L0%2020M40%2040V20L20%2040%22/%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div
            className={`text-center transition-all duration-700 ease-out mb-12 ${
              isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold">{t.about.statsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ease-out ${
                  isStatsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <p className="text-6xl font-bold text-viniela-gold mb-2">
                  {isStatsVisible ? (
                    <AnimatedCounter target={stat.value} isYear={stat.isYear} />
                  ) : stat.isYear ? (
                    '2020'
                  ) : (
                    '0'
                  )}
                </p>
                <p className="text-lg font-semibold text-gray-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section ref={advantagesRef} className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div
            className={`text-center transition-all duration-700 ease-out mb-12 ${
              isAdvantagesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
              {t.about.advantagesTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {advantages.map((adv, index) => (
              <div
                key={index}
                className={`bg-viniela-silver p-8 rounded-xl transform transition-all duration-500 ease-out hover:bg-white hover:shadow-2xl hover:-translate-y-2 ${
                  isAdvantagesVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <div className="bg-viniela-gold text-white p-4 rounded-full inline-block mb-4">
                  <i className="fa-solid fa-check-circle fa-2x w-8 h-8" aria-hidden="true"></i>
                </div>
                <h3 className="text-xl font-bold text-viniela-dark mb-3">{adv.title}</h3>
                <p className="text-viniela-gray">{adv.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </div>
  );
};

export default AboutPage;

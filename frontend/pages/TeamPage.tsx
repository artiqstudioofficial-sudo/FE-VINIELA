import React, { useEffect, useState } from 'react';
import CTA from '../components/CTA';
import { useTranslations } from '../contexts/i18n';
import * as teamService from '../services/teamService';
import { TeamMember } from '../types';

const LinkedInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8 19H5v-9h3v9zM6.5 8.25a1.75 1.75 0 110-3.5 1.75 1.75 0 010 3.5zM19 19h-3v-4.74c0-1.42-.6-2.24-1.68-2.24-1.08 0-1.68.76-1.68 2.24V19h-3V10h3v1.32h.04c.4-.77 1.38-1.57 2.86-1.57 3.05 0 3.59 2 3.59 4.6V19z" />
  </svg>
);

const TeamPage: React.FC = () => {
  const { t } = useTranslations();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const loadTeam = async () => {
      try {
        setIsLoading(true);
        const data = await teamService.getTeamMembers();
        setTeamMembers(data);
      } catch (err) {
        console.error('Gagal memuat anggota tim:', err);
        // boleh diganti toast kalau mau
        alert(err instanceof Error ? err.message : 'Gagal memuat data anggota tim dari server');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, []);

  return (
    <div className="animate-fade-in-up">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center text-white bg-viniela-dark overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://picsum.photos/seed/teamwork/1920/1080')" }}
        ></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{t.team.heroTitle}</h1>
          <p className="text-lg md:text-xl mt-2 max-w-3xl mx-auto">{t.team.heroSubtitle}</p>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-viniela-silver">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
              {t.team.sectionTitle}
            </h2>
            <p className="mt-4 text-lg text-viniela-gray">{t.team.sectionSubtitle}</p>
          </div>

          {isLoading ? (
            <p className="text-center text-viniela-gray py-8">
              {t.team.loading || 'Memuat data tim...'}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="group flex flex-col items-center text-center bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                >
                  <div className="relative">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-40 h-40 rounded-full object-cover shadow-md border-4 border-white transition-transform duration-300 group-hover:scale-105"
                    />
                    {member.linkedinUrl && (
                      <a
                        href={member.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 p-2 bg-viniela-gold text-white rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100 hover:bg-viniela-gold-dark"
                      >
                        <LinkedInIcon />
                      </a>
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-viniela-dark">{member.name}</h3>
                  <p className="mt-1 text-viniela-gold font-semibold">{member.title.id}</p>
                  <p className="mt-3 text-sm text-viniela-gray flex-grow">{member.bio.id}</p>
                </div>
              ))}

              {!isLoading && teamMembers.length === 0 && (
                <p className="col-span-full text-center text-viniela-gray py-8">
                  {t.team.empty || 'Belum ada data tim.'}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <CTA />
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

export default TeamPage;

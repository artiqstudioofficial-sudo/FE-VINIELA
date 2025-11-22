
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import * as careersService from '../services/careersService';
import { JobListing } from '../types';
import CTA from '../components/CTA';

const CareersPage: React.FC = () => {
    const { t, language } = useTranslations();
    const [allJobs, setAllJobs] = useState<JobListing[]>([]);
    const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
        const jobs = careersService.getJobListings();
        const sortedJobs = jobs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setAllJobs(sortedJobs);
    }, []);
    
    useEffect(() => {
        let jobs = [...allJobs];
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            jobs = jobs.filter(job => 
                job.title[language].toLowerCase().includes(lowercasedQuery) ||
                job.location[language].toLowerCase().includes(lowercasedQuery) ||
                job.description[language].replace(/<[^>]+>/g, '').toLowerCase().includes(lowercasedQuery)
            );
        }
        setFilteredJobs(jobs);
    }, [searchQuery, allJobs, language]);

    return (
        <div className="bg-viniela-silver animate-fade-in-up">
            {/* Hero Section */}
            <section className="relative h-[50vh] flex items-center justify-center text-white bg-viniela-dark">
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30" 
                    style={{ backgroundImage: "url('https://picsum.photos/seed/hiring/1920/1080')" }}
                ></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        {t.careers.heroTitle}
                    </h1>
                    <p className="text-lg md:text-xl mt-4 max-w-3xl mx-auto">
                        {t.careers.heroSubtitle}
                    </p>
                </div>
            </section>

            {/* Open Positions Section */}
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <header className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-viniela-dark">
                            {t.careers.openPositions}
                        </h2>
                    </header>

                    <div className="max-w-xl mx-auto mb-12">
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.search.placeholderCareers}
                            className="w-full px-5 py-3 border border-gray-300 rounded-full shadow-sm focus:ring-2 focus:ring-viniela-gold focus:border-viniela-gold transition"
                            aria-label="Search job openings"
                        />
                    </div>
                    
                    {filteredJobs.length > 0 ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            {filteredJobs.map(job => (
                                <div key={job.id} className="bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-shadow hover:shadow-xl">
                                    <div className="flex-grow">
                                        <h3 className="text-2xl font-bold text-viniela-dark">{job.title[language]}</h3>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-viniela-gray mt-2">
                                            <span className="flex items-center text-sm">
                                                <i className="fa-solid fa-briefcase w-4 h-4 mr-2" aria-hidden="true"></i>
                                                {t.admin.jobTypes[job.type]}
                                            </span>
                                            <span className="flex items-center text-sm">
                                                <i className="fa-solid fa-location-dot w-4 h-4 mr-2" aria-hidden="true"></i>
                                                {job.location[language]}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-4 md:mt-0">
                                        <Link to={`/careers/${job.id}`} className="px-6 py-2.5 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300 transform hover:scale-105">
                                            {t.careers.viewDetails}
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-xl shadow-md">
                            <p className="text-xl text-viniela-gray">{t.careers.noOpenings}</p>
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

export default CareersPage;
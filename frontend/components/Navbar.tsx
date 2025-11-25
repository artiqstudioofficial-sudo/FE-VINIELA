
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';
import { divisions } from '../constants';
import { Language } from '../types';
// FIX: Import translations object to display language names in the dropdown.
import translations from '../data/translations';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDivisionsOpen, setDivisionsOpen] = useState(false);
  const [isLanguageOpen, setLanguageOpen] = useState(false);
  const [isMobileDivisionsOpen, setMobileDivisionsOpen] = useState(false);
  const [isMobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const { t, language, setLanguage } = useTranslations();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const divisionsRef = useRef<HTMLLIElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (divisionsRef.current && !divisionsRef.current.contains(event.target as Node)) {
        setDivisionsOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
        setMobileDivisionsOpen(false);
        setMobileLanguageOpen(false);
    }
  }, [isMobileMenuOpen]);
  
  const getTranslation = (key: string) => {
    const keys = key.split('.');
    let result: any = t;
    for (const k of keys) {
        result = result?.[k];
        if (typeof result === 'undefined') return key;
    }
    return result;
  };

  const NavLink: React.FC<{ to: string, children: React.ReactNode, onClick?: () => void }> = ({ to, children, onClick }) => {
    let isActive = false;
    const [path, hash] = to.split('#');

    if (hash) {
        // Hash link like "/#news" or just "#news"
        const targetPath = path || '/';
        isActive = location.pathname === targetPath && location.hash === `#${hash}`;
    } else {
        // Path link like "/" or "/about"
        if (to === '/') {
            // Home is only active if there is no hash
            isActive = location.pathname === '/' && (!location.hash || location.hash === '#');
        } else {
            // For other paths, it should be an exact match, or for /news, it should also be active on /news/:id
            isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
        }
    }
    
    return (
        <Link to={to} onClick={onClick} className={`px-4 py-2 text-sm font-medium transition-colors duration-300 ${isActive ? 'text-viniela-gold' : 'text-viniela-gray hover:text-viniela-gold'}`}>
            {children}
        </Link>
    );
  };


  return (
    <nav className={`bg-white/95 backdrop-blur-lg sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? 'shadow-lg' : 'shadow-md'}`}>
      <div className="container mx-auto px-6 py-3 relative">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-viniela-dark tracking-wider">
            VINIELA
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-2">
            <NavLink to="/">{t.nav.home}</NavLink>
            <NavLink to="/about">{t.nav.about}</NavLink>
            <NavLink to="/team">{t.nav.team}</NavLink>
            <li ref={divisionsRef} className="relative list-none">
                <button onClick={() => setDivisionsOpen(!isDivisionsOpen)} className="flex items-center px-4 py-2 text-sm font-medium text-viniela-gray hover:text-viniela-gold transition-colors duration-300">
                    {t.nav.divisions}
                    <i className={`fa-solid fa-chevron-down w-5 h-5 ml-1.5 text-gray-400 transition-transform duration-300 ${isDivisionsOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                </button>
                {isDivisionsOpen && (
                <div className="absolute top-full mt-2 w-64 bg-white rounded-lg shadow-xl py-2 animate-fade-in-down max-h-[80vh] overflow-y-auto">
                    {divisions.map((division) => (
                    <Link key={division.name} to={division.url} onClick={() => setDivisionsOpen(false)} className="flex items-center px-4 py-3 text-sm text-viniela-gray hover:bg-viniela-silver hover:text-viniela-dark transition-colors duration-200 border-b border-gray-50 last:border-0">
                      <division.Icon className="w-4 h-4 mr-3 flex-shrink-0 text-viniela-gold" />
                      <span className="truncate">{getTranslation(division.name)}</span>
                    </Link>
                    ))}
                </div>
                )}
            </li>
            <NavLink to="/news">{t.nav.news}</NavLink>
            <NavLink to="/careers">{t.nav.careers}</NavLink>
            <NavLink to="/contact">{t.nav.contact}</NavLink>
            <NavLink to="/admin">{t.nav.admin}</NavLink>
          </div>

          <div className="flex items-center">
             <div ref={languageRef} className="relative hidden lg:block">
                <button onClick={() => setLanguageOpen(!isLanguageOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-viniela-silver transition-colors duration-300 text-viniela-gray">
                    <i className="fa-solid fa-globe w-5 h-5" aria-hidden="true"></i>
                    <span className="text-sm font-medium">{t.langName}</span>
                    <i className={`fa-solid fa-chevron-down w-5 h-5 text-gray-400 transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                </button>
                {isLanguageOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-xl p-2 z-10 animate-fade-in-down">
                       <div className="space-y-1">
                            {(['id', 'en', 'cn'] as Language[]).map((lang) => (
                                <button 
                                    key={lang} 
                                    onClick={() => { setLanguage(lang); setLanguageOpen(false); }} 
                                    className={`w-full flex items-center text-left px-3 py-2 text-sm rounded-md transition-colors duration-200 ${language === lang ? 'bg-viniela-gold text-white' : 'text-viniela-gray hover:bg-viniela-silver'}`}
                                >
                                    {translations[lang].langName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden p-2 rounded-md hover:bg-viniela-silver focus:outline-none focus:bg-viniela-silver ml-2" aria-label="Toggle mobile menu">
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-viniela-gray text-2xl w-6 h-6 flex items-center justify-center`} aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
           <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-2xl border-t border-gray-100 overflow-y-auto max-h-[calc(100vh-70px)] animate-fade-in-down">
                <div className="px-4 py-4 space-y-2 flex flex-col">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname === '/' && !location.hash ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.home}</Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname === '/about' ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.about}</Link>
                    <Link to="/team" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname === '/team' ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.team}</Link>

                    <div className="w-full">
                        <button 
                            onClick={() => setMobileDivisionsOpen(!isMobileDivisionsOpen)} 
                            className={`flex items-center justify-between w-full px-4 py-3 text-base font-medium text-left rounded-lg transition-colors ${isMobileDivisionsOpen ? 'bg-viniela-silver text-viniela-dark' : 'text-viniela-gray hover:bg-viniela-silver'}`}
                        >
                            <span>{t.nav.divisions}</span>
                            <i className={`fa-solid fa-chevron-down w-5 h-5 transition-transform duration-300 ${isMobileDivisionsOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                        </button>
                        {/* Scrollable sub-menu for divisions to prevent layout breaking */}
                        {isMobileDivisionsOpen && (
                            <div className="pl-4 mt-2 space-y-1 border-l-2 border-viniela-silver ml-4 max-h-64 overflow-y-auto custom-scrollbar">
                                {divisions.map((division) => (
                                    <Link 
                                        key={division.name} 
                                        to={division.url}
                                        onClick={() => setMobileMenuOpen(false)} 
                                        className="flex items-center py-3 px-3 text-sm text-viniela-gray hover:text-viniela-gold rounded-md transition-colors duration-200"
                                    >
                                        <division.Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                                        <span className="truncate">{getTranslation(division.name)}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <Link to="/news" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname.startsWith('/news') ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.news}</Link>
                    <Link to="/careers" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname.startsWith('/careers') ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.careers}</Link>
                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname === '/contact' ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.contact}</Link>
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-lg text-base font-medium ${location.pathname === '/admin' ? 'text-viniela-gold bg-viniela-silver' : 'text-viniela-gray hover:bg-viniela-silver'}`}>{t.nav.admin}</Link>

                    <hr className="my-2 border-gray-200" />
                    
                    <div className="w-full">
                        <button 
                            onClick={() => setMobileLanguageOpen(!isMobileLanguageOpen)} 
                            className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-left text-viniela-gray hover:bg-viniela-silver rounded-lg"
                        >
                            <span className="flex items-center">
                                <i className="fa-solid fa-globe w-5 h-5 mr-3" aria-hidden="true"></i>
                                <span>{t.nav.language}</span>
                            </span>
                            <i className={`fa-solid fa-chevron-down w-5 h-5 transition-transform duration-300 ${isMobileLanguageOpen ? 'rotate-180' : ''}`} aria-hidden="true"></i>
                        </button>
                        {isMobileLanguageOpen && (
                            <div className="pl-4 mt-1 space-y-1">
                                {(['id', 'en', 'cn'] as Language[]).map((lang) => (
                                    <button 
                                        key={lang} 
                                        onClick={() => { setLanguage(lang); setMobileMenuOpen(false); }}
                                        className={`w-full text-left py-2 px-3 text-sm rounded-md transition-colors duration-200 ${language === lang ? 'bg-viniela-gold text-white font-semibold' : 'text-viniela-gray hover:bg-viniela-silver'}`}
                                    >
                                        {translations[lang].langName}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    </nav>
  );
};

// Add this to your index.html style block or a CSS file if you use one.
const css = `
  @keyframes fade-in-down {
    0% {
      opacity: 0;
      transform: translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-down {
    animation: fade-in-down 0.3s ease-out forwards;
  }
  /* Custom scrollbar for the mobile divisions list */
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;
const style = document.createElement('style');
if (!document.head.querySelector('style#fade-in-down-animation')) {
    style.id = 'fade-in-down-animation';
    style.innerHTML = css;
    document.head.appendChild(style);
}

export default Navbar;

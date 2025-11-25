import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';

const SocialIcon: React.FC<{ href: string, 'aria-label': string, children: React.ReactNode }> = ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-viniela-gray hover:text-viniela-gold transition-all duration-300 transform hover:scale-110" {...props}>
        {children}
    </a>
);

const Footer: React.FC = () => {
    const { t } = useTranslations();
    const navLinks = [
        { path: '/', label: t.nav.home },
        { path: '/about', label: t.nav.about },
        { path: '/#divisions', label: t.nav.divisions },
        { path: '/news', label: t.nav.news },
        { path: '/careers', label: t.nav.careers },
    ];
  return (
    <footer className="bg-viniela-dark text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Column 1: Brand Info */}
          <div>
            <h2 className="text-2xl font-bold tracking-wider">VINIELA</h2>
            <p className="mt-4 text-gray-400 text-sm">{t.footer.description}</p>
            <div className="flex space-x-4 mt-6">
                <SocialIcon href="https://www.facebook.com/profile.php?id=61581261302169" aria-label="Facebook"><i className="fa-brands fa-facebook fa-fw fa-xl" /></SocialIcon>
                <SocialIcon href="https://www.instagram.com/vinielaproperty/" aria-label="Instagram"><i className="fa-brands fa-instagram fa-fw fa-xl" /></SocialIcon>
                <SocialIcon href="https://www.tiktok.com/@vinielaproperty?is_from_webapp=1&sender_device=pc" aria-label="TikTok"><i className="fa-brands fa-tiktok fa-fw fa-xl" /></SocialIcon>
            </div>
          </div>

          {/* Column 2 & 3 Wrapper */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <h3 className="text-lg font-semibold tracking-wide">{t.footer.quickLinks}</h3>
              <ul className="mt-4 space-y-2">
                  {navLinks.map(link => (
                      <li key={link.path}>
                          <Link to={link.path} className="text-gray-400 hover:text-white transition-colors duration-300 text-sm">{link.label}</Link>
                      </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-wide">{t.footer.legal}</h3>
              <ul className="mt-4 space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm">{t.footer.privacy}</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm">{t.footer.faq}</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="text-lg font-semibold tracking-wide">{t.footer.office.title}</h3>
              <p className="mt-4 text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                  {t.footer.office.address}
              </p>
              <div className="mt-4 rounded-lg overflow-hidden shadow-lg border border-gray-700">
                  <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.741750731694!2d106.72895489999999!3d-6.1653288!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f79197e2c4fb%3A0xd797787cc64542d8!2sViniela%20Design%20Interior!5e0!3m2!1sid!2sid!4v1763443190152!5m2!1sid!2sid"
                      width="100%"
                      height="120"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Viniela Design Interior Location"
                  ></iframe>
              </div>
              <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Viniela+Design+Interior"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-viniela-gold text-white font-semibold rounded-lg shadow-md hover:bg-viniela-gold-dark transition-all duration-300 transform hover:scale-105"
              >
                  <i className="fa-solid fa-paper-plane" />
                  {t.footer.office.directionsButton}
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-700 pt-6 text-center">
          <p className="text-sm text-gray-400">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
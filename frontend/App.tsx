import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import ChatWidget from './components/ChatWidget';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { LanguageProvider } from './contexts/i18n';

// Lazy load page components
const HomePage = lazy(() => import('./pages/HomePage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const NewsListPage = lazy(() => import('./pages/NewsListPage'));
const NewsDetailPage = lazy(() => import('./pages/NewsDetailPage'));
const CareersPage = lazy(() => import('./pages/CareersPage'));
const CareersDetailPage = lazy(() => import('./pages/CareersDetailPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const FaqPage = lazy(() => import('./pages/FaqPage'));
const DivisionDetailPage = lazy(() => import('./pages/DivisionDetailPage'));

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="w-16 h-16 border-4 border-viniela-gold border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const AppContent: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on path change
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Handle scrolling to hash links
    if (location.hash) {
      const id = location.hash.substring(1); // remove #
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 0);
    }
  }, [location]);

  // Don't show chat widget on admin page to prevent clutter
  const showChatWidget = !location.pathname.startsWith('/admin');

  return (
    <div className="bg-white text-viniela-dark font-sans">
      <Navbar />
      <main key={location.pathname} className="page-transition">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/divisions/:slug" element={<DivisionDetailPage />} />
            <Route path="/news" element={<NewsListPage />} />
            <Route path="/news/:id" element={<NewsDetailPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/careers/:id" element={<CareersDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      {showChatWidget && <ChatWidget />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </LanguageProvider>
  );
};

export default App;

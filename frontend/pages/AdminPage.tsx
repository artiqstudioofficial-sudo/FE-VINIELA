import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../contexts/i18n';

import CareersManagementView from '@/components/admin/CareersManagementView';
import ContactManagementView from '@/components/admin/ContactManagementView';
import DashboardView from '@/components/admin/DashboardManagementView';
import NewsManagementView from '@/components/admin/NewsManagementView';
import PartnerManagementView from '@/components/admin/PartnerManagementView';
import TeamManagementView from '@/components/admin/TeamManagementView';
import Toast from '../components/Toast';

type View = 'dashboard' | 'news' | 'careers' | 'team' | 'partners' | 'contact';
type ToastState = { show: boolean; message: string; type: 'success' | 'error' };

const AdminPage: React.FC = () => {
  const { t } = useTranslations();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'success',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('viniela-auth');
    navigate('/login');
  };

  const navItems = useMemo(
    () => [
      {
        id: 'dashboard',
        label: t.admin.dashboardTitle,
        icon: 'fa-solid fa-chart-pie',
      },
      {
        id: 'news',
        label: t.admin.newsManagement,
        icon: 'fa-solid fa-newspaper',
      },
      {
        id: 'careers',
        label: t.admin.careersManagement,
        icon: 'fa-solid fa-briefcase',
      },
      { id: 'team', label: t.admin.teamManagement, icon: 'fa-solid fa-users' },
      {
        id: 'partners',
        label: t.admin.partnerManagement,
        icon: 'fa-solid fa-handshake',
      },
      {
        id: 'contact',
        label: t.admin.contactManagement,
        icon: 'fa-solid fa-envelope',
      },
    ],
    [t],
  );

  const pageTitle = useMemo(() => {
    return navItems.find((item) => item.id === activeView)?.label || 'Admin Panel';
  }, [activeView, navItems]);

  return (
    <div className="min-h-screen bg-viniela-silver flex font-sans">
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-viniela-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-center h-20 border-b border-gray-700 bg-black/20">
          <h1 className="text-2xl font-bold tracking-wider text-viniela-gold">ADMIN PANEL</h1>
        </div>
        <nav className="p-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as View);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeView === item.id
                  ? 'bg-viniela-gold text-white shadow-lg'
                  : 'text-gray-400 hover:bg.white/10 hover:text-white'
              }`}
            >
              <i
                className={`${item.icon} w-6 text-center mr-3 transition-transform group-hover:scale-110`}
              ></i>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-black/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <i className="fa-solid fa-sign-out-alt w-6 text-center mr-3"></i>
            <span className="font-medium">{t.admin.logout}</span>
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 h-20 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden mr-4 text-gray-500 hover:text-viniela-dark"
            >
              <i className="fa-solid fa-bars fa-xl"></i>
            </button>
            <h2 className="text-2xl font-bold text-viniela-dark">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-gray-500">Welcome, Admin</span>
            <div className="w-10 h-10 bg-viniela-gold rounded-full flex items-center justify-center text-white font-bold shadow-md border-2 border-white ring-2 ring-gray-100">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeView === 'dashboard' && <DashboardView />}
            {activeView === 'news' && <NewsManagementView showToast={showToast} />}
            {activeView === 'careers' && <CareersManagementView showToast={showToast} />}
            {activeView === 'team' && <TeamManagementView showToast={showToast} />}
            {activeView === 'partners' && <PartnerManagementView showToast={showToast} />}
            {activeView === 'contact' && <ContactManagementView showToast={showToast} />}
          </div>
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <style>{`
        .form-section-title { font-weight: 600; color: #1a1a1a; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .form-input { width: 100%; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 0.6rem 1rem; transition: all 0.2s; }
        .form-input:focus { border-color: #c09a58; outline: none; box-shadow: 0 0 0 3px rgba(192, 154, 88, 0.1); }
        .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.35rem; }
        .form-error { color: #dc2626; font-size: 0.75rem; margin-top: 0.25rem; }
        .translate-btn { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #c09a58; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 9999px; background-color: #fffbf0; transition: background 0.2s; }
        .translate-btn:hover:not(:disabled) { background-color: #fef3c7; }
        .translate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background-color: #c09a58; color: white; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-primary:hover:not(:disabled) { background-color: #b08b49; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .btn-secondary { background-color: #f3f4f6; color: #4b5563; padding: 0.6rem 1.5rem; border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; }
        .btn-secondary:hover { background-color: #e5e7eb; color: #1a1a1a; }
        .admin-action-btn { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; transition: all 0.2s; }
        .sub-tab-button { padding: 0.5rem 1.5rem; font-weight: 600; color: #6b7280; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .sub-tab-active { color: #c09a58; border-bottom-color: #c09a58; }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AdminPage;

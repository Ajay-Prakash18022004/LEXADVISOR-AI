import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDocument } from '../context/DocumentContext';

export default function Header({ onToggleSidebar, onOpenUploadModal }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activeJurisdiction, setActiveJurisdiction } = useDocument();

  const [showJurisdictionMenu, setShowJurisdictionMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine breadcrumb title
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return { section: 'Platform Overview', page: 'Home' };
    if (path.includes('chatbot') || path === '/dashboard') return { section: 'AI Assistance', page: 'Chatbot' };
    if (path.includes('my-documents')) return { section: 'Repository', page: 'My Documents & Drafts' };
    if (path.includes('drafting-studio')) return { section: 'Legal Studio', page: 'Drafting Studio' };
    if (path.includes('stamp-paper-verification') || path.includes('stamp-duty')) return { section: 'Compliance', page: 'Stamp Paper Verification' };
    if (path.includes('document-analysis')) return { section: 'Document Intelligence', page: 'Document Analysis' };
    if (path.includes('risk')) return { section: 'Document Intelligence', page: 'Future Risk Analysis' };
    if (path.includes('roadmap') || path.includes('action')) return { section: 'Action Engine', page: 'Recommended Action Plan' };
    if (path.includes('advocate')) return { section: 'Advocate Connect', page: 'Find an Advocate' };
    if (path.includes('consultation') || path.includes('appointment')) return { section: 'Advocate Connect', page: 'My Consultations' };
    if (path.includes('counsel') || path.includes('chat')) return { section: 'AI Assistance', page: 'AI Legal Counsel' };
    if (path.includes('profile')) return { section: 'Client Account', page: 'My Profile' };
    if (path.includes('settings')) return { section: 'System', page: 'Settings' };
    if (path.includes('help')) return { section: 'System', page: 'Help & Support' };
    return { section: 'Client Workspace', page: 'Overview' };
  };

  const breadcrumb = getBreadcrumb();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ai-legal-counsel?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-20 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40">
      <div className="h-20 w-full px-4 sm:px-space-md lg:px-space-xl flex items-center justify-between gap-space-sm sm:gap-space-lg">
        {/* Left Section: Mobile toggle */}
        <div className="flex items-center gap-space-sm sm:gap-space-md min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            title="Open Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        </div>

        {/* Right Section: Notifications + Avatar */}
        <div className="flex items-center gap-2 sm:gap-space-md flex-shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative h-10 w-10 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-3 z-50 animate-in fade-in"
                onMouseLeave={() => setShowNotifications(false)}
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                  <span className="font-title-md text-title-md font-bold text-on-surface">Legal Notifications</span>
                  <span className="font-label-caps text-label-caps text-error bg-error-container px-2 py-0.5 rounded-full font-bold">Client Alerts</span>
                </div>
                <div className="divide-y divide-surface-container mt-2 space-y-2">
                  <div className="pt-2 text-left">
                    <p className="font-body-sm text-body-sm font-semibold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">mail</span>
                      Consultation Dispatch Active
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Advocate appointment confirmations and receipts delivered to <b>sureshtakur194@gmail.com</b>.
                    </p>
                  </div>
                  <div className="pt-2 text-left">
                    <p className="font-body-sm text-body-sm font-semibold text-on-tertiary-container flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified_user</span>
                      Stamp Deficit Identified
                    </p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      Syed Residential Lease has ₹2,300 stamp duty deficit under Article 35. Supplementary paper recommended before SRO.
                    </p>
                  </div>
                </div>
                <div className="pt-3 mt-2 border-t border-surface-container text-center">
                  <Link
                    to="/action-roadmap"
                    onClick={() => setShowNotifications(false)}
                    className="font-label-sm text-label-sm font-semibold text-primary-container hover:underline"
                  >
                    View Recommended Next Steps →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative pl-space-xs">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-primary-container text-on-primary font-cinzel font-bold text-sm ring-2 ring-surface-container-high hover:ring-primary-container transition-all"
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container p-2 z-50 animate-in fade-in"
                onMouseLeave={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2 border-b border-surface-container">
                  <p className="font-body-sm text-body-sm font-bold text-on-surface">{user?.name || 'Suresh Thakur'}</p>
                  <p className="font-label-caps text-label-caps text-on-surface-variant truncate">{user?.email || 'sureshtakur194@gmail.com'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container text-on-secondary-fixed uppercase">
                    Client Account
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">person</span>
                    <span>My Profile</span>
                  </Link>
                  <Link
                    to="/my-documents"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">folder_shared</span>
                    <span>My Documents &amp; Drafts</span>
                  </Link>
                  <Link
                    to="/my-consultations"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">forum</span>
                    <span>My Consultations</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">settings</span>
                    <span>Settings</span>
                  </Link>
                </div>
                <div className="pt-1 border-t border-surface-container">
                  <button
                    onClick={() => { logout(); setShowProfileMenu(false); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-body-sm text-error hover:bg-error-container/30 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

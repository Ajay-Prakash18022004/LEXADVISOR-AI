import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, switchPortal } = useAuth();

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all font-body-sm text-body-sm ${
      isActive
        ? 'bg-primary-container text-on-primary font-semibold shadow-sm border-l-4 border-on-tertiary-container'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }`;

  // Client Portal Navigation Options:
  // 1. Home
  // 2. AI Document Analysis
  // 3. Stamp Paper Verification
  // 4. Future Risk Analysis
  // 5. Recommended Action Plan
  // 6. Legal Draft Studio
  // 7. Find an Advocate
  // 8. My Consultations
  const navItems = [
    {
      label: 'Home',
      to: '/',
      icon: 'home',
    },
    {
      label: 'Chatbot',
      to: '/chatbot',
      icon: 'smart_toy',
    },
    {
      label: 'AI Document Analysis',
      to: '/document-analysis',
      icon: 'description',
    },
    {
      label: 'Stamp Paper Verification',
      to: '/stamp-paper-verification',
      icon: 'verified_user',
    },
    {
      label: 'Future Risk Analysis',
      to: '/clause-risk-analyzer',
      icon: 'policy',
    },
    {
      label: 'Recommended Action Plan',
      to: '/legal-action-roadmap',
      icon: 'alt_route',
    },
    {
      label: 'Legal Draft Studio',
      to: '/drafting-studio',
      icon: 'edit_document',
    },
    {
      label: 'Find an Advocate',
      to: '/advocate-directory',
      icon: 'gavel',
    },
    {
      label: 'My Consultations',
      to: '/my-consultations',
      icon: 'forum',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-container-lowest overflow-hidden border-r border-surface-container">
      {/* Brand Header */}
      <div className="h-20 px-5 flex items-center justify-between gap-3 bg-surface-container-lowest border-b border-surface-container">
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => { navigate('/'); if (onClose) onClose(); }}
          title="LexAdvisor AI Home"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold font-cinzel text-xl shadow-sm">
            §
          </div>
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight leading-none">
              LexAdvisor AI
            </span>
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1 tracking-wider">
              Legal Decision Support
            </span>
          </div>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
            aria-label="Close sidebar"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Strictly Limited 7 Navigation Options */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={navLinkClasses}
            >
              <span className="material-symbols-outlined text-xl shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Compact Switcher to Advocate Portal */}
      <div className="p-4 bg-surface-container-low/50 border-t border-surface-container">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            if (switchPortal) switchPortal('advocate');
            navigate('/advocate/dashboard');
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 text-amber-400 border border-slate-800 text-xs font-semibold hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm">balance</span>
          <span>Switch to Advocate Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-primary/40 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

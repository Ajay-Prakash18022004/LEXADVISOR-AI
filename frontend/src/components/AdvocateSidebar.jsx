import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CANONICAL_ADVOCATES, getActiveAdvocateFromStorage, getAdvocateInitials } from '../data/canonicalAdvocates';

export default function AdvocateSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user, switchPortal } = useAuth();

  const isVerified = user?.verification_status === 'verified';

  const [activeAdvocate, setActiveAdvocate] = useState(() => getActiveAdvocateFromStorage());

  useEffect(() => {
    const handleProfileChange = (e) => {
      const adv = e.detail?.advocate;
      const advId = Number(e.detail?.id);
      if (adv) {
        setActiveAdvocate({
          id: adv.id,
          name: adv.name,
          roll: adv.roll || adv.bar_council_id,
          specialization: adv.specialization || 'Civil, Property & Real Estate Litigation'
        });
      } else if (advId) {
        const found = CANONICAL_ADVOCATES.find(a => a.id === advId);
        if (found) {
          setActiveAdvocate({
            id: found.id,
            name: found.name,
            roll: found.roll,
            specialization: found.specialization
          });
        } else {
          setActiveAdvocate(getActiveAdvocateFromStorage());
        }
      } else {
        setActiveAdvocate(getActiveAdvocateFromStorage());
      }
    };

    window.addEventListener('advocate_profile_changed', handleProfileChange);
    return () => window.removeEventListener('advocate_profile_changed', handleProfileChange);
  }, [user]);

  const navLinkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-body-sm text-body-sm ${
      isActive
        ? 'bg-primary-container text-on-primary font-semibold shadow-sm border-l-4 border-on-tertiary-container'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-container-lowest border-r border-surface-container text-on-surface overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      {/* Chamber Brand Header */}
      <div className="h-20 px-space-lg flex items-center justify-between gap-space-sm bg-surface-container-lowest border-b border-surface-container shrink-0">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => { navigate('/advocate/dashboard'); if (onClose) onClose(); }}
        >
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
            <span className="material-symbols-outlined text-xl text-tertiary-fixed-dim">gavel</span>
          </div>
          <div className="flex flex-col">
            <span className="font-title-md text-title-md text-on-surface font-bold tracking-tight leading-none">
              LexAdvisor Chambers
            </span>
            <span className="font-label-caps text-[10px] text-on-surface-variant uppercase mt-1 tracking-wider font-semibold">
              Advocate Legal Portal
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Advocate Verification Badge Card */}
      <div className="p-3 mx-space-md mt-3 bg-surface-container-low border border-surface-container rounded-xl flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Advocate ID</span>
          <span className="text-xs font-mono font-bold text-on-surface">{activeAdvocate?.roll || 'TS/1402/2014'}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {isVerified ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="material-symbols-outlined text-xs">verified</span>
              Verified Advocate
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="material-symbols-outlined text-xs">hourglass_top</span>
              Pending Review
            </span>
          )}
          <span className="text-[11px] text-on-surface-variant font-medium truncate">
            {activeAdvocate?.roll?.startsWith('AP') ? 'Andhra Pradesh Bar' : (user?.state_bar_council || 'Telangana Bar')}
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto px-space-md py-space-sm space-y-space-md">
        {/* Practice Overview */}
        <div className="space-y-1">
          <p className="px-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            Practice Overview
          </p>
          <nav className="space-y-1">
            <NavLink to="/advocate/dashboard" end onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">dashboard</span>
              <span>Dashboard</span>
            </NavLink>
          </nav>
        </div>

        {/* Client Consultations */}
        <div className="space-y-1">
          <p className="px-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            Client Consultations
          </p>
          <nav className="space-y-1">
            <NavLink to="/advocate/pending" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">mark_email_unread</span>
              <span>Pending Consultations</span>
            </NavLink>
            <NavLink to="/advocate/upcoming" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">calendar_month</span>
              <span>Upcoming Consultations</span>
            </NavLink>
          </nav>
        </div>

        {/* Case Litigation Management */}
        <div className="space-y-1">
          <p className="px-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            Litigation &amp; Cases
          </p>
          <nav className="space-y-1">
            <NavLink to="/advocate/cases" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">folder_managed</span>
              <span>My Cases</span>
            </NavLink>
            <NavLink to="/advocate/resolved-cases" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">task_alt</span>
              <span>Resolved Cases</span>
            </NavLink>
          </nav>
        </div>

        {/* Chamber Operations */}
        <div className="space-y-1">
          <p className="px-3 font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider font-bold">
            Chamber Operations
          </p>
          <nav className="space-y-1">
            <NavLink to="/advocate/availability" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">event_available</span>
              <span>Availability Calendar</span>
            </NavLink>
            <NavLink to="/advocate/profile" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">badge</span>
              <span>Chamber Profile</span>
            </NavLink>
            <NavLink to="/advocate/fees" onClick={onClose} className={navLinkClasses}>
              <span className="material-symbols-outlined text-lg">payments</span>
              <span>Consultation Fees</span>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Footer Profile & Switcher */}
      <div className="p-space-md bg-surface-container-low/60 border-t border-surface-container space-y-2 shrink-0">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {getAdvocateInitials(activeAdvocate?.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-bold text-on-surface truncate">{activeAdvocate?.name || 'Adv. Rajeshwar Rao'}</span>
            <span className="text-[10px] text-on-surface-variant truncate">{activeAdvocate?.specialization || 'Civil, Property & Real Estate Litigation'}</span>
          </div>
        </div>

        {/* Portal Switcher Pill */}
        <button
          type="button"
          onClick={() => {
            switchPortal('client');
            navigate('/dashboard');
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface border border-surface-container text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <span className="material-symbols-outlined text-base text-primary">switch_account</span>
          <span>Switch to Client Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-72 bg-surface-container-lowest z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-on-background/40 backdrop-blur-xs" onClick={onClose} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

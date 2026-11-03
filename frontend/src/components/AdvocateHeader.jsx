import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdvocateProfiles } from '../api/advocate';

const CANONICAL_ADVOCATES = [
  { id: 1, name: 'Adv. Rajeshwar Rao', roll: 'TS/1402/2014', city: 'Hyderabad' },
  { id: 2, name: 'Adv. Rajesh Varma', roll: 'TS/1842/2012', city: 'Hyderabad' },
  { id: 3, name: 'Adv. Ramesh V. Kulkarni', roll: 'TS/1420/2008', city: 'Hyderabad' },
  { id: 4, name: 'Adv. Priya Sundaram', roll: 'TS/2491/2016', city: 'Hyderabad' },
  { id: 5, name: 'Adv. Sravani Devi Reddy', roll: 'TS/2890/2014', city: 'Hyderabad' },
  { id: 6, name: 'Adv. P. Srinivasa Rao', roll: 'AP/982/2005', city: 'Visakhapatnam' },
  { id: 7, name: 'Adv. Ananya Chowdary', roll: 'AP/3412/2016', city: 'Vijayawada' },
  { id: 8, name: 'Adv. Mohammed Tariq Ahmed', roll: 'TS/4102/2012', city: 'Hyderabad' },
  { id: 9, name: 'Adv. K. Ananya Reddy', roll: 'TS/3104/2018', city: 'Warangal' },
  { id: 10, name: 'Adv. K. Venkata Subbaiah', roll: 'AP/1877/2009', city: 'Guntur' },
  { id: 11, name: 'Adv. Ch. Murali Krishna', roll: 'TS/5012/2015', city: 'Warangal' },
  { id: 12, name: 'Adv. B. Haritha', roll: 'AP/2144/2013', city: 'Tirupati' }
];

export default function AdvocateHeader({ onMenuClick }) {
  const { user, logout, switchPortal } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profiles, setProfiles] = useState(CANONICAL_ADVOCATES);

  const initialAdvId = Number(localStorage.getItem('active_advocate_id')) || 1;
  const [selectedAdvId, setSelectedAdvId] = useState(initialAdvId);

  useEffect(() => {
    getAdvocateProfiles()
      .then(res => {
        if (res && res.length > 0) {
          const mapped = res.map(p => ({
            id: p.id,
            name: p.name,
            roll: p.bar_council_id || p.roll,
            city: p.city,
            pending_count: p.pending_count
          }));
          setProfiles(mapped);
        }
      })
      .catch(() => {});

    const onProfileChanged = (e) => {
      if (e.detail?.id !== undefined) {
        setSelectedAdvId(Number(e.detail.id));
      }
    };
    window.addEventListener('advocate_profile_changed', onProfileChanged);
    return () => window.removeEventListener('advocate_profile_changed', onProfileChanged);
  }, []);

  const handleSelectAdvocate = (advId) => {
    const numericId = Number(advId);
    setSelectedAdvId(numericId);
    localStorage.setItem('active_advocate_id', String(numericId));
    const found = profiles.find(p => p.id === numericId);
    if (found) {
      localStorage.setItem('active_advocate_name', found.name);
      localStorage.setItem('active_advocate_roll', found.roll);
    }
    window.dispatchEvent(new CustomEvent('advocate_profile_changed', { detail: { id: numericId, advocate: found } }));
  };

  const currentAdv = profiles.find(p => p.id === selectedAdvId) || profiles[0];
  const isVerified = user?.verification_status === 'verified';

  return (
    <header className="sticky top-0 z-40 w-full h-20 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)] shrink-0">
      <div className="h-20 w-full px-4 sm:px-space-md lg:px-space-xl flex items-center justify-between gap-space-sm sm:gap-space-lg">
        {/* Left: Mobile hamburger + Chamber Breadcrumb */}
        <div className="flex items-center gap-space-sm sm:gap-space-md min-w-0">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
            title="Open Menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm truncate">
            <span className="material-symbols-outlined text-sm">balance</span>
            <span className="font-label-sm text-label-sm text-outline-variant">/</span>
            <span className="font-label-sm text-label-sm">Legal Chamber Workspace</span>
            <span className="font-label-sm text-label-sm text-outline-variant hidden sm:inline">/</span>
            <span className="font-label-sm text-label-sm font-semibold text-on-surface font-mono hidden sm:inline">
              {currentAdv?.roll || 'TS/1402/2014'}
            </span>
          </div>
        </div>

        {/* Right: Advocate Profile Switcher + Verification Pill + Client View Switcher + User Profile */}
        <div className="flex items-center gap-2 sm:gap-space-md shrink-0">
          {/* Advocate Profile Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-surface-container-low px-2 py-1.5 rounded-xl border border-surface-container">
            <span className="material-symbols-outlined text-base text-primary hidden sm:inline">switch_account</span>
            <select
              value={selectedAdvId}
              onChange={(e) => handleSelectAdvocate(e.target.value)}
              className="bg-transparent text-on-surface font-semibold text-xs border-none outline-none cursor-pointer max-w-[150px] sm:max-w-[220px] truncate"
              title="Switch advocate chamber profile to view their dashboard and pending consultations"
            >
              <option value="0">⚡ All Chambers (Master View)</option>
              {profiles.map(adv => (
                <option key={adv.id} value={adv.id}>
                  ⚖️ {adv.name} ({adv.roll})
                </option>
              ))}
            </select>
          </div>

          {/* Verification Status Pill */}
          {isVerified ? (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-label-caps text-xs font-semibold">
              <span className="material-symbols-outlined text-sm text-emerald-700">verified</span>
              <span>Verified Bar Counsel</span>
            </div>
          ) : (
            <div
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 font-label-caps text-xs font-semibold"
              title="Your Bar Council credentials are under statutory administrative verification."
            >
              <span className="material-symbols-outlined text-sm text-amber-700">hourglass_top</span>
              <span>Pending Review</span>
            </div>
          )}

          {/* Client Portal Switcher Button */}
          <button
            type="button"
            onClick={() => {
              switchPortal('client');
              navigate('/dashboard');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface border border-surface-container font-body-sm text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">open_in_new</span>
            <span className="hidden sm:inline">Client View</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container-low transition-all text-on-surface cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary font-bold text-xs flex items-center justify-center shadow-xs">
                {currentAdv?.name ? currentAdv.name.replace('Adv. ', '').slice(0, 2).toUpperCase() : 'AR'}
              </div>
              <span className="text-xs font-semibold text-on-surface hidden md:inline truncate max-w-[130px]">
                {currentAdv?.name || 'Advocate'}
              </span>
              <span className="material-symbols-outlined text-sm text-on-surface-variant">expand_more</span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xl p-2 z-50 animate-in fade-in"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-2 border-b border-surface-container">
                  <p className="text-xs font-bold text-on-surface truncate">{currentAdv?.name || 'Advocate Counsel'}</p>
                  <p className="text-[11px] text-on-surface-variant truncate">sureshtakur194@gmail.com</p>
                  <p className="text-[10px] text-on-tertiary-container font-mono mt-0.5">{currentAdv?.roll || 'TS/1402/2014'}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { navigate('/advocate/profile'); setDropdownOpen(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">badge</span>
                    <span>Chamber Profile</span>
                  </button>
                  <button
                    onClick={() => { navigate('/advocate/pending'); setDropdownOpen(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">inbox</span>
                    <span>Pending Consultations</span>
                  </button>
                  <button
                    onClick={() => { navigate('/advocate/cases'); setDropdownOpen(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-on-surface hover:bg-surface-container-low rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">folder_managed</span>
                    <span>Active Litigation Cases</span>
                  </button>
                </div>

                <div className="border-t border-surface-container pt-1 mt-1">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error-container/20 rounded-lg flex items-center gap-2 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">logout</span>
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
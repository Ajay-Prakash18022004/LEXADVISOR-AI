import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdvocateDashboardStats, acceptConsultation, rejectConsultation, getAdvocateProfiles } from '../../api/advocate';
import { useAuth } from '../../context/AuthContext';
import EmailSettingsModal from '../../components/EmailSettingsModal';

const CANONICAL_PROFILES = [
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

export default function AdvocateDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, id: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMsg, setBannerMsg] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const [advocateProfiles, setAdvocateProfiles] = useState(CANONICAL_PROFILES);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState(() => {
    const saved = localStorage.getItem('active_advocate_id');
    return saved !== null && saved !== undefined ? Number(saved) : 1;
  });

  const loadData = async (advId, silent = false) => {
    const targetId = advId !== undefined ? advId : selectedAdvocateId;
    try {
      if (!silent) setLoading(true);
      const data = await getAdvocateDashboardStats(targetId);
      setStatsData(data);
    } catch (err) {
      console.error('Failed to load advocate dashboard stats:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch profiles
    getAdvocateProfiles()
      .then(res => {
        if (res && res.length > 0) {
          setAdvocateProfiles(res);
        }
      })
      .catch(() => {});

    loadData(selectedAdvocateId, false);

    const onProfileChanged = (e) => {
      if (e.detail?.id !== undefined) {
        const newId = Number(e.detail.id);
        setSelectedAdvocateId(newId);
        loadData(newId, false);
      }
    };

    const onConsultationBooked = (e) => {
      const advId = e.detail?.advocate_id;
      if (advId) {
        setSelectedAdvocateId(Number(advId));
        loadData(Number(advId), false);
      } else {
        loadData(selectedAdvocateId, true);
      }
    };

    window.addEventListener('advocate_profile_changed', onProfileChanged);
    window.addEventListener('consultation_booked', onConsultationBooked);
    const interval = setInterval(() => loadData(selectedAdvocateId, true), 4000);
    const onFocus = () => loadData(selectedAdvocateId, true);
    window.addEventListener('focus', onFocus);

    return () => {
      window.removeEventListener('advocate_profile_changed', onProfileChanged);
      window.removeEventListener('consultation_booked', onConsultationBooked);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [selectedAdvocateId]);

  const handleSwitchAdvocate = (advId) => {
    const num = Number(advId);
    setSelectedAdvocateId(num);
    localStorage.setItem('active_advocate_id', String(num));
    const found = advocateProfiles.find(p => p.id === num);
    if (found) {
      localStorage.setItem('active_advocate_name', found.name);
      localStorage.setItem('active_advocate_roll', found.roll || found.bar_council_id);
    }
    window.dispatchEvent(new CustomEvent('advocate_profile_changed', { detail: { id: num, advocate: found } }));
    loadData(num);
  };

  const handleAccept = async (id) => {
    try {
      setActionLoading(true);
      await acceptConsultation(id);
      setBannerMsg('Consultation confirmed! Status updated, email notification dispatched to sureshtakur194@gmail.com, and litigation case file opened.');
      window.dispatchEvent(new CustomEvent('consultation_accepted', { detail: { id } }));
      await loadData();
    } catch (err) {
      alert('Error accepting consultation: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModal.reason || rejectModal.reason.length < 5) {
      alert('Please provide a specific rejection reason (min 5 characters).');
      return;
    }
    try {
      setActionLoading(true);
      await rejectConsultation(rejectModal.id, rejectModal.reason);
      setBannerMsg('Consultation request rejected. Client notified.');
      setRejectModal({ open: false, id: null, reason: '' });
      await loadData();
    } catch (err) {
      alert('Error rejecting: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const stats = statsData?.stats || {
    total_consultations: 0,
    pending_consultations: 0,
    upcoming_consultations: 0,
    completed_consultations: 0,
    active_cases: 0,
    resolved_cases: 0,
    earnings: 0
  };

  const isPendingVerification = (user?.verification_status || statsData?.verification_status) === 'pending';

  return (
    <div className="space-y-space-lg">
      {/* Top Welcome & Bar Verification Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-lowest border border-surface-container p-space-lg rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Chamber Dashboard</h1>
            {isPendingVerification ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                <span className="material-symbols-outlined text-xs text-amber-700">hourglass_top</span>
                Verification Pending
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="material-symbols-outlined text-xs text-emerald-700">verified</span>
                Verified Bar Counsel
              </span>
            )}
          </div>
          <p className="font-body-md text-sm text-on-surface-variant">
            Welcome, <strong className="text-on-surface">{statsData?.name || user?.name || 'Adv. Rajeshwar Rao'}</strong> · Bar Council ID:{' '}
            <span className="font-mono font-semibold text-on-tertiary-container">{statsData?.bar_council_id || user?.bar_council_id || 'TS/1402/2014'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setEmailModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Configure Gmail App Password and test email delivery"
          >
            <span className="material-symbols-outlined text-sm text-emerald-600">notifications_active</span>
            <span>Email Alerts: sureshtakur194@gmail.com</span>
            <span className="material-symbols-outlined text-xs text-emerald-700 ml-1">tune</span>
          </button>
          <button
            onClick={() => navigate('/advocate/availability')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container transition-all shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-primary">event_available</span>
            <span>Set Availability</span>
          </button>
          <button
            onClick={() => navigate('/advocate/cases')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-container hover:bg-on-background text-on-primary text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-tertiary-fixed-dim">folder_managed</span>
            <span>Litigation Cases</span>
          </button>
        </div>
      </div>

      {/* Advocate Profile Selector Card (Switch Between All 12 Advocates) */}
      <div className="bg-surface-container-lowest border-2 border-primary/20 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">switch_account</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-on-surface">Switch Advocate Chamber Profile</h2>
            <p className="text-xs text-on-surface-variant">
              Select any of the 12 verified advocates across Telangana &amp; Andhra Pradesh to view their dashboard, stats, and pending bookings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
          <select
            value={selectedAdvocateId}
            onChange={(e) => handleSwitchAdvocate(e.target.value)}
            className="w-full md:w-80 bg-surface-container-low text-on-surface font-semibold text-xs border border-surface-container-high rounded-xl px-3.5 py-2.5 cursor-pointer shadow-xs focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="0">⚡ All Advocates (Master Chamber View)</option>
            {advocateProfiles.map(adv => (
              <option key={adv.id} value={adv.id}>
                ⚖️ {adv.name} ({adv.roll || adv.bar_council_id}) — {adv.city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {bannerMsg && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-700">check_circle</span>
            <span className="font-medium">{bannerMsg}</span>
          </div>
          <button onClick={() => setBannerMsg('')} className="text-emerald-700 hover:text-emerald-950 font-bold">✕</button>
        </div>
      )}

      {/* Verification Notice */}
      {isPendingVerification && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 shrink-0 mt-0.5">info</span>
          <p className="font-body-sm text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong className="font-semibold">Bar Council Review Notice:</strong> Your advocate profile is operating in{' '}
            <strong className="font-semibold">Pending Verification</strong> mode. You can accept consultations, log private case notes, and schedule hearings. Public directory ranking will display the full verified seal upon manual administrative document audit.
          </p>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
            Total Cons.
          </span>
          <p className="font-headline-md text-2xl font-bold text-on-surface">{stats.total_consultations}</p>
          <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 block">All Bookings</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-amber-900 dark:text-amber-300 font-bold block mb-1">
            Pending
          </span>
          <p className="font-headline-md text-2xl font-bold text-amber-900 dark:text-amber-300">{stats.pending_consultations}</p>
          <span className="font-body-sm text-[11px] text-amber-900/80 dark:text-amber-300/80 mt-0.5 block">Requires Action</span>
        </div>

        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-primary font-bold block mb-1">
            Upcoming
          </span>
          <p className="font-headline-md text-2xl font-bold text-primary">{stats.upcoming_consultations}</p>
          <span className="font-body-sm text-[11px] text-primary/80 mt-0.5 block">Confirmed</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
            Completed
          </span>
          <p className="font-headline-md text-2xl font-bold text-on-surface">{stats.completed_consultations}</p>
          <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 block">Concluded</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
            Active Cases
          </span>
          <p className="font-headline-md text-2xl font-bold text-on-surface">{stats.active_cases}</p>
          <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 block">Under Review</span>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-surface-variant font-bold block mb-1">
            Resolved
          </span>
          <p className="font-headline-md text-2xl font-bold text-on-surface">{stats.resolved_cases}</p>
          <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5 block">Case Closed</span>
        </div>

        <div className="p-4 rounded-xl bg-secondary-container border border-secondary/30 shadow-xs col-span-2 sm:col-span-1">
          <span className="font-label-caps text-[11px] uppercase tracking-wider text-on-secondary-fixed font-bold block mb-1">
            Earnings
          </span>
          <p className="font-headline-md text-2xl font-bold text-on-secondary-fixed">₹{stats.earnings.toLocaleString()}</p>
          <span className="font-body-sm text-[11px] text-on-secondary-fixed/80 mt-0.5 block">Fee Accrued</span>
        </div>
      </div>

      {/* Main Two Columns: Pending Consultations & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Pending Consultation Requests */}
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600">mail</span>
              <h2 className="font-title-md text-base font-bold text-on-surface">Pending Consultation Requests</h2>
            </div>
            <button
              onClick={() => navigate('/advocate/pending')}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">Loading pending requests...</div>
          ) : !statsData?.recent_pending?.length ? (
            <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">inbox</span>
              <span>No pending consultation requests for this profile at this time.</span>
              <span className="text-xs text-slate-400 mt-1">Switch profile above to view other advocates' bookings.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {statsData.recent_pending.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-on-surface truncate">{item.client_name}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">₹{item.fee}</span>
                      {selectedAdvocateId === 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {item.advocate_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{item.case_subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {item.appointment_date}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {item.time_slot}
                      </span>
                      <span>· {item.consultation_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(item.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setRejectModal({ open: true, id: item.id, reason: '' })}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-rose-50 text-rose-700 border border-rose-300 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Confirmed Consultations */}
        <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              <h2 className="font-title-md text-base font-bold text-on-surface">Upcoming Confirmed Schedule</h2>
            </div>
            <button
              onClick={() => navigate('/advocate/upcoming')}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-on-surface-variant text-sm">Loading upcoming consultations...</div>
          ) : !statsData?.recent_upcoming?.length ? (
            <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-outline-variant mb-2">event_busy</span>
              <span>No upcoming confirmed consultations scheduled.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {statsData.recent_upcoming.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-surface-container transition-all flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-on-surface truncate">{item.client_name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary-container text-on-secondary-fixed">
                        {item.consultation_type}
                      </span>
                      {selectedAdvocateId === 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                          {item.advocate_name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">{item.case_subject}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 font-medium text-on-surface">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {item.appointment_date}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-on-surface">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {item.time_slot}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/advocate/cases')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-primary font-semibold text-xs border border-surface-container shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    Open Case File &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-background/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-surface-container p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">cancel</span>
                Reject Consultation Request
              </h3>
              <button
                onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                className="text-on-surface-variant hover:text-on-surface"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Please enter the professional reason for rejecting this consultation request. This will be transmitted to the client and dispatched via email.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="E.g. Conflict of interest, schedule fully booked, or outside jurisdictional expertise..."
                className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container text-on-surface text-xs placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, id: null, reason: '' })}
                  className="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-error text-on-error text-xs font-semibold hover:bg-error/90 shadow-sm"
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Email Alert Configuration & Live Test Modal */}
      <EmailSettingsModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
      />
    </div>
  );
}
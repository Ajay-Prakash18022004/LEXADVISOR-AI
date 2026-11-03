import React, { useState, useEffect } from 'react';
import { getAdvocateProfile, getAdvocateDashboardStats } from '../../api/advocate';
import { useAuth } from '../../context/AuthContext';

export default function AdvocateFees() {
  const { updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [feeInput, setFeeInput] = useState(1500);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([getAdvocateProfile(), getAdvocateDashboardStats()]);
        setProfile(p);
        setStats(s);
        setFeeInput(p.consultation_fee || 1500);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({ consultation_fee: Number(feeInput) });
      setMsg('Consultation fee updated successfully!');
    } catch (err) {
      alert('Error updating fee: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSaving(false);
    }
  };

  const earnings = stats?.stats?.earnings || 0;
  const completed = stats?.stats?.completed_consultations || 0;
  const upcoming = stats?.stats?.upcoming_consultations || 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-on-tertiary-container text-2xl">payments</span>
          <h1 className="font-serif text-2xl font-bold text-on-surface">Consultation Fees &amp; Billing</h1>
        </div>
        <p className="text-xs text-on-surface-variant">
          Set standard consultation rates and review revenue metrics from client appointments.
        </p>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {msg}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
            Total Accrued Earnings
          </span>
          <div className="font-serif text-3xl font-bold text-on-tertiary-container">₹{earnings.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">From confirmed &amp; completed bookings</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
            Concluded Consultations
          </span>
          <div className="font-serif text-3xl font-bold text-emerald-700">{completed}</div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">Successfully completed sessions</span>
        </div>

        <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">
            Current Base Rate
          </span>
          <div className="font-serif text-3xl font-bold text-on-surface">₹{profile?.consultation_fee || 1500}</div>
          <span className="text-[11px] text-on-surface-variant mt-1 block">Per initial chamber consultation</span>
        </div>
      </div>

      {/* Fee Editor */}
      <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <h2 className="font-serif text-base font-bold text-on-surface mb-1">Update Consultation Fee</h2>
        <p className="text-xs text-on-surface-variant mb-4">
          This rate is displayed publicly on the Advocate Directory when clients search and book appointments.
        </p>

        <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row items-center gap-3 max-w-md">
          <div className="relative w-full">
            <span className="absolute left-3.5 top-2.5 text-on-surface-variant text-sm font-bold">₹</span>
            <input
              type="number"
              step="100"
              required
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-sm text-on-surface outline-none focus:border-primary-container font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary-container hover:bg-on-background text-on-primary text-xs font-bold shrink-0 transition-all shadow-sm"
          >
            {saving ? 'Updating...' : 'Save Rate'}
          </button>
        </form>
      </div>
    </div>
  );
}

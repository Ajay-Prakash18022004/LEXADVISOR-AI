import React, { useState, useEffect } from 'react';
import { getAdvocateProfile } from '../../api/advocate';
import { useAuth } from '../../context/AuthContext';

export default function AdvocateProfile() {
  const { updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: 'success' });

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    bar_council_id: '',
    state_bar_council: '',
    verification_status: 'pending',
    specialization: '',
    experience_years: 5,
    consultation_fee: 1500,
    bio: '',
    address: '',
    languages_spoken: ''
  });

  useEffect(() => {
    const fetchProf = async () => {
      try {
        setLoading(true);
        const data = await getAdvocateProfile();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProf();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateProfile({
        name: profile.name,
        phone: profile.phone,
        specialization: profile.specialization,
        consultation_fee: Number(profile.consultation_fee),
        bio: profile.bio,
        address: profile.address,
        languages_spoken: profile.languages_spoken
      });
      setFeedback({ text: 'Professional chamber profile updated successfully!', type: 'success' });
    } catch (err) {
      setFeedback({ text: err.response?.data?.detail || 'Error saving profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isVerified = profile.verification_status === 'verified';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-surface-container-lowest border border-surface-container p-6 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-on-tertiary-container text-2xl">badge</span>
          <h1 className="font-serif text-2xl font-bold text-on-surface">Advocate Professional Profile</h1>
        </div>
        <p className="text-xs text-on-surface-variant">
          Manage your legal chamber credentials, areas of practice, and consultation fee structure.
        </p>
      </div>

      {feedback.text && (
        <div className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
          feedback.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ text: '', type: 'success' })} className="text-on-surface-variant hover:text-on-surface ml-3">✕</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-on-surface-variant text-sm bg-surface-container-lowest border border-surface-container rounded-2xl">
          Loading professional profile...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Statutory Verification Status Card (Read-Only) */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <h2 className="font-serif text-base font-bold text-on-surface mb-1">Bar Council Credentials</h2>
            <p className="text-xs text-on-surface-variant mb-4">
              Bar Council enrollment ID and official verification status are strictly managed through state regulatory records.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Enrollment Number (Read-Only)
                </span>
                <span className="font-mono text-sm font-bold text-on-tertiary-container">{profile.bar_council_id || 'TS/1402/2014'}</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  State Bar Council (Read-Only)
                </span>
                <span className="text-xs font-semibold text-on-surface">{profile.state_bar_council || 'Bar Council of Telangana'}</span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                  Verification Status
                </span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Verified Advocate
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 self-start">
                    <span className="material-symbols-outlined text-sm">hourglass_top</span>
                    Pending Verification
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Editable Chamber Details */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-2xl p-6 space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
            <h2 className="font-serif text-base font-bold text-on-surface">Chamber &amp; Practice Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Areas of Specialization *</label>
                <input
                  type="text"
                  required
                  value={profile.specialization}
                  onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Base Consultation Fee (₹) *</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={profile.consultation_fee}
                  onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Languages Spoken</label>
                <input
                  type="text"
                  value={profile.languages_spoken}
                  onChange={(e) => setProfile({ ...profile, languages_spoken: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Office / Chamber Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Professional Bio &amp; Practice Overview</label>
              <textarea
                rows={4}
                placeholder="Overview of judicial forums practiced (High Court, District Courts, Tribunals), case history, and client advisory experience..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full p-3 rounded-xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface outline-none focus:border-primary-container leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-primary-container hover:bg-on-background text-on-primary text-xs font-bold transition-all shadow-sm"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

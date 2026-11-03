import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || 'Suresh Thakur');
  const [email, setEmail] = useState(user?.email || 'sureshtakur194@gmail.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98490 11223');
  const [city, setCity] = useState(user?.city || 'Hyderabad');
  const [state, setState] = useState(user?.state || 'Telangana');
  const [language, setLanguage] = useState(user?.preferred_language || 'English');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await updateProfile({
        name,
        phone,
        city,
        state,
        preferred_language: language
      });
      setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Could not update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-lg space-y-space-xl">
      {/* Header */}
      <section className="space-y-space-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed">
          <span className="material-symbols-outlined text-sm">person</span>
          <span className="font-label-caps text-label-caps uppercase tracking-wider font-semibold">
            Client Account Settings
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
          My Profile &amp; Preferences
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Manage your personal information, contact details, and default legal jurisdiction.
        </p>
      </section>

      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-semibold ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {statusMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-2xl font-cinzel shadow-sm">
          {name ? name.slice(0, 2).toUpperCase() : 'ST'}
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-on-surface">{name}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-fixed uppercase">
              Client Account
            </span>
          </div>
          <p className="text-sm text-on-surface-variant">{email}</p>
          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">location_on</span>
              {city}, {state}
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">translate</span>
              {language}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-6">
        <h3 className="font-title-md text-title-md font-bold text-on-surface border-b border-surface-container pb-3">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="text-xs font-semibold text-on-surface">Full Legal Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1 focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-body-sm mt-1 opacity-70 cursor-not-allowed"
            />
            <span className="text-[11px] text-on-surface-variant">All advocate appointment confirmations are delivered to this address.</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1 focus:outline-none focus:border-primary"
              placeholder="+91 98490 11223"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1 focus:outline-none focus:border-primary"
              placeholder="e.g. Hyderabad, Visakhapatnam"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface">State Jurisdiction</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1 focus:outline-none focus:border-primary"
            >
              <option value="Telangana">Telangana (TS Stamp Act &amp; Tenancy Norms)</option>
              <option value="Andhra Pradesh">Andhra Pradesh (AP Stamp Rules &amp; Model Tenancy)</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Delhi NCR">Delhi NCR</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-on-surface">Preferred Document Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1 focus:outline-none focus:border-primary"
            >
              <option value="English">English</option>
              <option value="Telugu">Telugu (తెలుగు)</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
            </select>
          </div>
        </div>

        {/* Connected Services */}
        <div className="pt-4 border-t border-surface-container space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Connected Accounts &amp; Notifications</h4>
          <div className="p-3 rounded-lg bg-surface-container-low/60 border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-primary">mail</span>
              <div>
                <p className="text-xs font-semibold text-on-surface">Consultation Notification Delivery</p>
                <p className="text-[11px] text-on-surface-variant">Active destination: <b>sureshtakur194@gmail.com</b></p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-surface-container">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary text-body-sm font-semibold shadow-xs hover:bg-primary transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">save</span>
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}


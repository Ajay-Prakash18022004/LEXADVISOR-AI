import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';

export default function Settings() {
  const { jurisdiction, setJurisdiction } = useDocument();

  const [userName, setUserName] = useState('Adv. Rajesh Varma / Syed Amanullah');
  const [userEmail, setUserEmail] = useState('counsel@lexadvisor.ai');
  const [phone, setPhone] = useState('+91 98490 22338');
  const [city, setCity] = useState('Hyderabad');
  const [barRoll, setBarRoll] = useState('TS/1842/2012');

  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);
  const [autoArchive, setAutoArchive] = useState(true);
  const [sec65BCertification, setSec65BCertification] = useState(true);

  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    triggerToast('Settings and statutory jurisdictional defaults saved successfully.');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">verified</span>
          <span className="font-body-sm text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
            <span>Platform</span>
            <span className="text-outline-variant">/</span>
            <span className="font-semibold text-on-surface">Settings</span>
          </div>
          <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
            Account & Statutory Preferences
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant">
            Manage your regional legal jurisdiction, evidentiary preservation defaults, and notification preferences.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Section 1: Jurisdictional Foundation */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-surface-container-low pb-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">gavel</span>
              </div>
              <div>
                <h3 className="font-title-md text-base font-bold text-on-surface">Regional Statutory Jurisdiction</h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Configures the primary stamp duty tariff schedule, tenancy tribunal rules, and model rent laws applied during AI audits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                onClick={() => setJurisdiction('TS')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                  jurisdiction === 'TS'
                    ? 'border-primary-container bg-surface-container-low shadow-sm ring-1 ring-primary-container'
                    : 'border-surface-container bg-surface-container-lowest hover:bg-surface-container-low/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-sm font-bold text-on-surface">Telangana (TS) Jurisdiction</span>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    jurisdiction === 'TS' ? 'border-primary-container bg-primary-container' : 'border-outline'
                  }`}>
                    {jurisdiction === 'TS' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Telangana Stamp Act Schedule I-A (Item 35), GHMC Hyderabad Municipal By-laws, and Telangana Model Tenancy Ordinance 2021.
                </p>
              </label>

              <label
                onClick={() => setJurisdiction('AP')}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-2 ${
                  jurisdiction === 'AP'
                    ? 'border-primary-container bg-surface-container-low shadow-sm ring-1 ring-primary-container'
                    : 'border-surface-container bg-surface-container-lowest hover:bg-surface-container-low/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-title-md text-sm font-bold text-on-surface">Andhra Pradesh (AP) Jurisdiction</span>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    jurisdiction === 'AP' ? 'border-primary-container bg-primary-container' : 'border-outline'
                  }`}>
                    {jurisdiction === 'AP' && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                </div>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  AP Stamp Tariff Rules, Visakhapatnam & Vijayawada Municipal Corporation codes, and AP Rented Premises Framework.
                </p>
              </label>
            </div>
          </div>

          {/* Section 2: User Profile & Bar Standing */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-surface-container-low pb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">badge</span>
              </div>
              <div>
                <h3 className="font-title-md text-base font-bold text-on-surface">User Profile & Enrolment Records</h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Information displayed on formal consultation briefs and notice exports.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Full Name / Legal Designation
                </label>
                <input
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Registered Email Address
                </label>
                <input
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Contact Phone (WhatsApp Enabled)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Bar Council Roll / Verification Identifier
                </label>
                <input
                  value={barRoll}
                  onChange={(e) => setBarRoll(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Evidentiary Telemetry & Certifications */}
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-surface-container-low pb-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container text-on-surface flex items-center justify-center">
                <span className="material-symbols-outlined text-lg">security</span>
              </div>
              <div>
                <h3 className="font-title-md text-base font-bold text-on-surface">Evidentiary Preservation & Security</h3>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Compliance settings for Indian Evidence Act Section 65B electronic certificate generation.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-body-sm text-xs font-semibold text-on-surface">
                    Automated SHA-256 Section 65B Evidentiary Certification
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">
                    Generates electronic signature and hash block on every exported legal notice and rent receipt.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={sec65BCertification}
                  onChange={(e) => setSec65BCertification(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-container"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low cursor-pointer">
                <div className="flex flex-col">
                  <span className="font-body-sm text-xs font-semibold text-on-surface">
                    Multi-Channel Notice Alerts (WhatsApp & Email)
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant">
                    Dispatches proactive reminders before 30-day statutory notice windows expire.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWhatsapp}
                  onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-container"
                />
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => triggerToast('Preferences restored to default state.')}
              className="px-5 py-2.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-xs font-semibold hover:bg-surface-container transition-colors"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary font-body-sm text-xs font-bold hover:bg-on-background transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Save Statutory Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


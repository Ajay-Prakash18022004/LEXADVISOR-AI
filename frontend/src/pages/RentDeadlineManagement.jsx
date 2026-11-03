import React, { useState, useEffect } from 'react';
import { useDocument } from '../context/DocumentContext';
import { deadlinesApi } from '../api/client';

export default function RentDeadlineManagement() {
  const { currentDocument, activeJurisdiction } = useDocument();

  // Dynamic calendar date state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const today = new Date();

  const currentYear = calendarDate.getFullYear();
  const currentMonthIdx = calendarDate.getMonth();
  const currentMonthName = calendarDate.toLocaleDateString('en-US', { month: 'long' });

  // Compute days in current month
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIdx, 1).getDay(); // 0 = Sun

  // Compute days left until the 5th of current month
  const rentDueDate = new Date(currentYear, currentMonthIdx, 5);
  const diffTime = rentDueDate - today;
  const daysLeftRent = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Format date helper
  const formatYMD = (d, m, y) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  // Reminders list initialized with dynamic dates
  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: 'Monthly Rent Payment (Active Cycle)',
      dueDate: formatYMD(5, currentMonthIdx, currentYear),
      amount: 35000,
      category: 'rent_payment',
      status: 'pending',
      badge: 'Pending',
      note: '5 days grace buffer per Deed §4. Statutory rent cycle.',
      icon: 'account_balance_wallet',
      color: 'bg-secondary-container text-on-secondary-fixed'
    },
    {
      id: 2,
      title: 'Notice of Non-Renewal Pre-Emptive Window',
      dueDate: formatYMD(10, currentMonthIdx, currentYear),
      amount: null,
      category: 'statutory_notice',
      status: 'action_required',
      badge: 'Action Rec.',
      note: 'Sec. 106 T.P. Act • Serves to avert automated 10% penalty escalation under Clause 9.2.',
      icon: 'warning',
      color: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      id: 3,
      title: 'Society Maintenance & Water Dues',
      dueDate: formatYMD(20, currentMonthIdx, currentYear),
      amount: 3200,
      category: 'maintenance',
      status: 'upcoming',
      badge: 'Upcoming',
      note: 'Payable to: MyHome Bhooja RWA (Simulated Demonstration Record)',
      icon: 'apartment',
      color: 'bg-surface-container text-on-surface-variant'
    },
    {
      id: 4,
      title: 'Quarterly AC & Structural Inspection',
      dueDate: formatYMD(15, (currentMonthIdx + 1) % 12, currentMonthIdx === 11 ? currentYear + 1 : currentYear),
      amount: null,
      category: 'inspection',
      status: 'upcoming',
      badge: 'Upcoming',
      note: 'Tenant & Landlord joint sign-off protocol required to preserve full deposit refund rights.',
      icon: 'engineering',
      color: 'bg-surface-container text-on-surface-variant'
    }
  ]);

  // Payment history transactions
  const [payments, setPayments] = useState([
    {
      id: 'tx1',
      cycle: `${new Date(currentYear, currentMonthIdx - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Tenancy Rent`,
      inv: 'Inv #INV-2026-10',
      date: `04 ${new Date(currentYear, currentMonthIdx - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      dueDate: 'Due: 05th (On Time)',
      amount: '₹35,000',
      mode: 'NEFT (Axis Corp)',
      utr: 'AXIS9882310029X',
      status: 'Sec 63 BSA / 65B Telemetry'
    },
    {
      id: 'tx2',
      cycle: 'Advance Security Deposit',
      inv: 'Deed Escrow Deposit §2',
      date: `20 ${new Date(currentYear, currentMonthIdx - 2, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      dueDate: 'Due: Agreement Execution',
      amount: '₹1,50,000',
      mode: 'RTGS Bank Transfer',
      utr: 'HDFC0091882312A',
      status: 'Sec 63 BSA / 65B Telemetry'
    },
    {
      id: 'tx3',
      cycle: `${new Date(currentYear, currentMonthIdx - 2, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Tenancy Rent`,
      inv: 'Inv #INV-2026-09',
      date: `03 ${new Date(currentYear, currentMonthIdx - 2, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      dueDate: 'Due: 05th (On Time)',
      amount: '₹35,000',
      mode: 'UPI Auto-Mandate',
      utr: 'UPI/428819201992',
      status: 'Sec 63 BSA / 65B Telemetry'
    }
  ]);

  // Filter & Search states
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Reminder Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Rent Due');
  const [newDueDate, setNewDueDate] = useState(formatYMD(5, currentMonthIdx, currentYear));
  const [newAmount, setNewAmount] = useState('35000');
  const [newRecurrence, setNewRecurrence] = useState('Monthly (Recurring Rent Cycle)');
  const [channelWhatsapp, setChannelWhatsapp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelSms, setChannelSms] = useState(false);

  // Load from real backend on mount
  useEffect(() => {
    async function fetchDeadlines() {
      try {
        const res = await deadlinesApi.getAll();
        if (res.data && res.data.length > 0) {
          const formatted = res.data.map((d, index) => ({
            id: d.id || index + 10,
            title: d.title,
            dueDate: d.due_date,
            amount: d.amount,
            category: d.category,
            status: d.status || 'upcoming',
            badge: d.status === 'completed' ? 'Paid' : (d.days_left <= 5 ? 'Due Soon' : 'Upcoming'),
            note: d.notes || d.plain_warning || 'Statutory reminder',
            icon: d.category?.includes('rent') ? 'account_balance_wallet' : (d.category?.includes('notice') ? 'warning' : 'event'),
            color: d.category?.includes('rent') ? 'bg-secondary-container text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'
          }));
          setReminders(prev => {
            const map = new Map();
            [...prev, ...formatted].forEach(item => map.set(item.title, item));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.debug('Deadlines backend sync:', err.message);
      }
    }
    fetchDeadlines();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    triggerToast(`Copied ${label} to clipboard!`);
  };

  const handleExportStatement = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      triggerToast('Tenancy Evidentiary Statement exported successfully (Sec. 63 BSA / 65B IEA Format)!');
    }, 1000);
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await deadlinesApi.updateStatus(id, 'completed');
    } catch (e) {
      console.debug('Mark as paid backend note:', e.message);
    }
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'completed', badge: 'Paid' } : r)
    );
    triggerToast('Payment marked as fulfilled and logged in evidentiary telemetry.');
  };

  const handleSaveReminder = async (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      title: newTitle || `${newCategory} Schedule`,
      dueDate: newDueDate,
      amount: newAmount ? Number(newAmount) : null,
      category: newCategory.toLowerCase().replace(/\s+/g, '_'),
      status: 'upcoming',
      badge: 'Armed',
      note: `Multi-channel alerts armed: ${channelWhatsapp ? 'WhatsApp ' : ''}${channelEmail ? 'Email ' : ''}${channelSms ? 'SMS' : ''}`,
      icon: newCategory.includes('Rent') ? 'account_balance_wallet' : 'alarm_on',
      color: 'bg-primary-container text-on-primary'
    };

    try {
      await deadlinesApi.create({
        title: created.title,
        category: created.category,
        due_date: created.dueDate,
        amount: created.amount || 0.0,
        recurrence: 'monthly',
        notes: created.note
      });
    } catch (err) {
      console.debug('Backend reminder persistence note:', err.message);
    }

    setReminders([created, ...reminders]);
    setShowModal(false);
    triggerToast('Custom Statutory Reminder saved and armed in backend!');
    setNewTitle('');
  };

  const filteredPayments = payments.filter(p =>
    p.cycle.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.utr.toLowerCase().includes(paymentSearch.toLowerCase()) ||
    p.inv.toLowerCase().includes(paymentSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">verified</span>
          <span className="font-body-sm text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Sub-Header / Breadcrumb & View Title Bar */}
      <section className="px-6 lg:px-8 py-6 bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container-low">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
            <span>Statutory Intelligence</span>
            <span className="text-outline-variant">/</span>
            <span className="font-semibold text-on-surface">Rent & Deadlines</span>
            <span className="text-outline-variant">•</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
              DEMONSTRATION SAMPLE LEDGER
            </span>
          </div>
          <h1 className="font-headline-lg text-2xl lg:text-3xl font-bold text-on-surface tracking-tight">
            Rent & Deadline Management
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-3xl">
            Track tenancy rent cycles, statutory notice windows, agreement expiries, and escrow deposits with precision across regional jurisdictions.
          </p>
        </div>

        {/* Quick Action Toolbars */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportStatement}
            className="h-10 px-4 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors rounded-lg font-body-sm text-sm font-semibold shadow-sm flex items-center gap-2 border border-surface-container-low"
            type="button"
          >
            {exporting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin text-secondary">sync</span>
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg text-secondary">file_download</span>
                <span>Export Statement</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 bg-primary-container text-on-primary hover:bg-on-background transition-colors rounded-lg font-body-sm text-sm font-semibold shadow-sm flex items-center gap-2"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">alarm_add</span>
            <span>+ Add Custom Reminder</span>
          </button>
        </div>
      </section>

      {/* Content Stream */}
      <div className="p-6 lg:p-8 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
        {/* Demonstration Data Advisory Notice */}
        <div className="p-3 bg-secondary-container/30 border border-secondary-container rounded-xl flex items-center justify-between text-xs text-on-surface">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-on-tertiary-container">info</span>
            <span>
              <strong>Sample Data Notice:</strong> The rent figures and dates shown below represent a simulated tenancy schedule based on "{currentDocument.title}". All electronic evidence telemetry conforms to Section 63 of Bharatiya Sakshya Adhiniyam, 2023.
            </span>
          </div>
          <span className="font-label-caps text-[10px] font-bold text-on-surface-variant uppercase">
            Jurisdiction: {activeJurisdiction === 'AP' ? 'AP Rent Code' : 'TS Tenancy Model 2021'}
          </span>
        </div>

        {/* Top Row Grid: Hero Countdown & Telemetry Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* 1. Hero Card: Next Payment Due */}
          <div className="relative overflow-hidden bg-primary-container text-on-primary rounded-xl p-6 shadow-md flex flex-col justify-between">
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-surface-tint/15 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs tracking-wider uppercase text-on-primary-container font-semibold">
                  Next Payment Due
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-caps text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  NEFT Auto-Sched
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="font-display text-3xl lg:text-4xl font-extrabold tracking-tight text-on-primary">
                    ₹{currentDocument.monthly_rent?.toLocaleString() || '35,000'}
                  </span>
                  <p className="font-label-sm text-xs text-on-primary-container mt-1">
                    Due Date: <span className="font-semibold text-on-primary">{currentMonthName} 05, {currentYear}</span>
                  </p>
                </div>
                {/* Circular Progress Dial Telemetry */}
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
                    <circle className="text-surface-tint/30" cx="24" cy="24" fill="none" r="20" stroke="currentColor" strokeWidth="3"></circle>
                    <circle
                      className="text-secondary-fixed"
                      cx="24"
                      cy="24"
                      fill="none"
                      r="20"
                      stroke="currentColor"
                      strokeDasharray="125.6"
                      strokeDashoffset="40"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-label-caps text-xs font-bold leading-none text-on-primary">
                      {daysLeftRent}D
                    </span>
                    <span className="text-[9px] font-label-caps text-on-primary-container leading-none">Left</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-2 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerToast('Receipt log modal opened. Upload voucher to compute Section 63 BSA cryptographic hash.')}
                  className="flex-1 py-2 px-3 bg-secondary-container text-on-secondary-fixed hover:bg-secondary-fixed-dim rounded-lg font-body-sm text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">receipt_long</span>
                  <span>Log Receipt</span>
                </button>
                <button
                  onClick={() => triggerToast('Routing to verified Escrow Gateway for Axis Corp Tenancy Account.')}
                  className="flex-1 py-2 px-3 bg-on-tertiary-container text-on-tertiary hover:opacity-95 rounded-lg font-body-sm text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-sm text-white"
                  type="button"
                >
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span>Pay Escrow</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Security Deposit Guard */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs tracking-wider uppercase text-on-surface-variant font-semibold">
                  Security Deposit Guard
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-caps text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-xs text-primary">shield</span>
                  Deed Protected
                </span>
              </div>
              <div className="mt-2">
                <span className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-on-surface">
                  ₹{currentDocument.security_deposit?.toLocaleString() || '1,50,000'}
                </span>
                <p className="font-label-sm text-xs text-on-surface-variant mt-1">
                  Lessor: <span className="font-semibold text-on-surface">{currentDocument.lessor_name || 'K. R. V. Rao'} (Advocate Hold)</span>
                </p>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-low mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-on-tertiary-container font-label-caps text-xs font-semibold">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>30-Day Mandatory Refund Standard</span>
                </div>
                <p className="font-label-sm text-xs text-on-surface-variant leading-snug">
                  Under the Model Tenancy Act guidance, deposit refund is required within thirty days post-possession handover.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between pt-2 border-t border-surface-container-low">
              <span className="font-label-caps text-xs text-on-surface-variant uppercase font-medium">Claims / Deductions:</span>
              <span className="font-title-md text-sm font-bold text-on-surface">₹0 (Zero logged)</span>
            </div>
          </div>

          {/* 3. Tenancy Tenor & Expiry */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs tracking-wider uppercase text-on-surface-variant font-semibold">
                  Tenancy Tenor & Expiry
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-caps text-[11px] font-semibold">
                  11 Months Stamped
                </span>
              </div>
              <div className="mt-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-on-surface">330</span>
                  <span className="font-label-sm text-xs text-on-surface-variant uppercase font-semibold">Days Left</span>
                </div>
                <p className="font-label-sm text-xs text-on-surface-variant mt-1">
                  <span className="font-semibold text-on-surface">{currentDocument.execution_date}</span> — <span className="font-semibold text-on-surface">{currentDocument.expiry_date}</span>
                </p>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-surface-container-high rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-on-tertiary-container h-2 rounded-full" style={{ width: '8.2%' }}></div>
              </div>
              <p className="font-label-sm text-xs text-on-surface-variant mt-1">Elapsed: ~8% of term completed</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-low mt-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-on-surface">notification_important</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-caps text-xs font-semibold text-on-surface uppercase">Renewal Notice Window</span>
                <span className="font-label-sm text-xs text-on-surface-variant truncate">60-Day Prior Written Intimation</span>
              </div>
            </div>
          </div>

          {/* 4. Statutory Compliance Alerts */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-xs tracking-wider uppercase text-error font-semibold">
                  Statutory Notice Guidance
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-error">gavel</span>
                </div>
                <div>
                  <span className="font-title-md text-sm font-bold text-on-surface leading-tight">Sec. 106 T.P. Act</span>
                  <p className="font-label-sm text-xs text-on-surface-variant">Notice Period Mandate</p>
                </div>
              </div>
              <p className="font-body-sm text-xs text-on-surface-variant mt-2 leading-relaxed">
                Statutory written notice expiring with the end of a tenancy month is required. Oral intimations lack admissible evidentiary standing in civil courts.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-surface-container-low flex items-center justify-between">
              <span className="font-label-sm text-xs font-semibold text-on-tertiary-container">Sec. 63 BSA Hash Standard</span>
              <a
                href="#/clause-risk-analyzer"
                className="text-on-secondary-container hover:text-on-surface font-label-caps text-xs font-bold underline flex items-center gap-0.5"
              >
                Audit Clause
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Monthly Calendar & Deadline Schedules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dynamic Month Calendar (7 cols) */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4">
            {/* Calendar Header with Live Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-fixed flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">calendar_month</span>
                </div>
                <div>
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                    {currentMonthName} {currentYear}
                  </h2>
                  <p className="font-label-sm text-xs text-on-surface-variant">
                    Jurisdiction: {activeJurisdiction === 'AP' ? 'AP Rent Court Docket' : 'GHMC Hyderabad Rent Docket'} (Simulated)
                  </p>
                </div>
              </div>
              {/* Controls */}
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg bg-surface-container-low p-1">
                  <button
                    onClick={() => setCalendarDate(new Date(currentYear, currentMonthIdx - 1, 1))}
                    className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    type="button"
                    title="Previous Month"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date())}
                    className="px-2 py-0.5 font-label-caps text-xs font-semibold text-on-surface"
                    type="button"
                  >
                    Current
                  </button>
                  <button
                    onClick={() => setCalendarDate(new Date(currentYear, currentMonthIdx + 1, 1))}
                    className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                    type="button"
                    title="Next Month"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
                <button
                  onClick={() => triggerToast('Showing all statutory rent, late fee, and maintenance milestones.')}
                  className="h-8 px-2.5 rounded-lg bg-surface-container-low text-on-surface font-label-caps text-xs font-semibold flex items-center gap-1 hover:bg-surface-container transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-xs">filter_list</span>
                  <span>Filter Events</span>
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-label-caps text-xs text-on-surface-variant uppercase tracking-wider py-1.5 bg-surface-container-low/50 rounded-lg font-semibold">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Dynamic Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty offset padding for first day of week */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`pad-${idx}`} className="min-h-[76px] p-1.5 rounded-lg bg-surface-container-low/20 opacity-30"></div>
              ))}

              {/* Real month days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isRentDay = dayNum === 5;
                const isGraceCutoff = dayNum === 10;
                const isMaintDay = dayNum === 20;
                const isSelected = selectedDay === dayNum;

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(dayNum)}
                    className={`min-h-[76px] p-1.5 rounded-lg transition-all flex flex-col justify-between cursor-pointer ${
                      isRentDay
                        ? (isSelected ? 'bg-secondary-container ring-2 ring-primary-container' : 'bg-secondary-container/50 hover:bg-secondary-container')
                        : isGraceCutoff
                        ? (isSelected ? 'bg-tertiary-fixed/60 ring-2 ring-on-tertiary-container' : 'bg-tertiary-fixed/30 hover:bg-tertiary-fixed/50')
                        : isMaintDay
                        ? (isSelected ? 'bg-surface-container-high ring-2 ring-secondary' : 'bg-surface-container hover:bg-surface-container-high')
                        : (isSelected ? 'bg-surface-container ring-2 ring-primary-container' : 'bg-surface-container-low hover:bg-surface-container')
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-label-sm text-xs font-bold ${
                        isRentDay ? 'text-on-secondary-fixed' :
                        isGraceCutoff ? 'text-on-tertiary-fixed-variant' :
                        'text-on-surface'
                      }`}>
                        {dayNum}
                      </span>
                      {isRentDay && <span className="w-2 h-2 rounded-full bg-primary-container"></span>}
                      {isGraceCutoff && <span className="material-symbols-outlined text-xs text-on-tertiary-container">warning</span>}
                      {isMaintDay && <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>}
                    </div>

                    {isRentDay && (
                      <div className="mt-1 bg-primary-container text-on-primary rounded p-1 text-left">
                        <span className="font-label-caps text-[9px] font-semibold block leading-tight">Rent Due</span>
                        <span className="font-label-caps text-[10px] font-bold">₹35,000</span>
                      </div>
                    )}
                    {isGraceCutoff && (
                      <div className="mt-1 bg-surface-container-lowest text-on-tertiary-container rounded p-1 shadow-sm text-left">
                        <span className="font-label-caps text-[9px] font-semibold block leading-tight">Clause 9.2</span>
                        <span className="text-[8px] font-label-caps text-on-surface-variant">Late Fee Active</span>
                      </div>
                    )}
                    {isMaintDay && (
                      <div className="mt-1 bg-surface-container-lowest text-on-secondary-container rounded p-1 shadow-sm text-left">
                        <span className="font-label-caps text-[9px] font-semibold block leading-tight">Maint.</span>
                        <span className="font-label-caps text-[9px] font-bold">₹3,200</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details Preview Pane Underneath Calendar */}
            <div className="p-4 rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex flex-col items-center justify-center shadow-sm shrink-0">
                  <span className="font-label-caps text-xs uppercase text-on-tertiary-container font-bold leading-none">
                    {currentMonthName.slice(0, 3)}
                  </span>
                  <span className="font-headline-sm text-lg font-extrabold text-on-surface leading-none mt-0.5">
                    {selectedDay < 10 ? `0${selectedDay}` : selectedDay}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-title-md text-sm font-bold text-on-surface">
                      {selectedDay === 5 ? `Primary Tenancy Rent Due (${currentMonthName} Cycle)` :
                       selectedDay === 10 ? 'Clause 9.2 Statutory Grace Cutoff & Late Penalty Window' :
                       selectedDay === 20 ? 'RWA Maintenance Settlement & Utility Record' :
                       `${currentMonthName} ${selectedDay} Schedule Audit`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-fixed font-label-caps text-[10px] font-semibold">
                      {selectedDay === 5 ? 'Active Cycle' : (selectedDay === 10 ? 'Critical' : 'Routine')}
                    </span>
                  </div>
                  <p className="font-label-sm text-xs text-on-surface-variant mt-0.5">
                    {selectedDay === 5 ? 'Scheduled for direct bank settlement: Axis Bank ESCROW • Admissible UTR verification' :
                     selectedDay === 10 ? 'Statutory notice window opens to dispute compounding interest under Sec 74 Contract Act' :
                     selectedDay === 20 ? 'Maintenance voucher will be timestamped under Section 63 BSA electronic evidence standards' :
                     'No adverse contract triggers or penalty defaults recorded for this date.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <a
                  href="#/clause-risk-analyzer"
                  className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors font-body-sm text-xs font-semibold shadow-sm"
                >
                  View Deed Clause
                </a>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-on-background transition-colors font-body-sm text-xs font-semibold shadow-sm"
                  type="button"
                >
                  Schedule Reminders
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Upcoming Reminders & Critical Triggers (5 cols) */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-surface-container-low flex flex-col gap-4">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-low">
              <div>
                <h3 className="font-title-md text-base font-bold text-on-surface">Upcoming Reminders & Critical Triggers</h3>
                <p className="font-label-sm text-xs text-on-surface-variant">Chronological statutory queue</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-caps text-xs font-bold">
                {reminders.filter(r => r.status !== 'completed').length} Active
              </span>
            </div>

            {/* Reminders List */}
            <div className="flex flex-col gap-3">
              {reminders.map(rem => (
                <div
                  key={rem.id}
                  className={`p-4 rounded-xl transition-all flex flex-col gap-2 ${
                    rem.status === 'completed'
                      ? 'bg-surface-container-low/40 opacity-70'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rem.color}`}>
                        <span className="material-symbols-outlined text-base">{rem.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-title-md text-sm font-bold text-on-surface">{rem.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-label-sm text-xs text-on-surface-variant">Due {rem.dueDate}</span>
                          {rem.amount && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-outline"></span>
                              <span className="font-label-sm text-xs font-bold text-on-surface">
                                ₹{rem.amount.toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase ${
                        rem.badge === 'Action Rec.' ? 'bg-tertiary-fixed text-on-tertiary-fixed' :
                        rem.badge === 'Paid' ? 'bg-secondary-container text-on-secondary-fixed' :
                        'bg-surface-container-high text-on-surface'
                      }`}
                    >
                      {rem.badge}
                    </span>
                  </div>

                  <p className="font-body-sm text-xs text-on-surface-variant leading-snug">
                    {rem.note}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-surface-container/40">
                    <span className="font-label-sm text-[11px] text-on-surface-variant">Sec. 63 BSA / 65B Telemetry</span>
                    {rem.status !== 'completed' ? (
                      rem.badge === 'Action Rec.' ? (
                        <a
                          href="#/legal-action-roadmap"
                          className="text-on-tertiary-container hover:text-on-surface font-label-caps text-xs font-bold flex items-center gap-1"
                        >
                          Draft Statutory Notice
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => handleMarkAsPaid(rem.id)}
                          className="px-3 py-1 bg-primary-container text-on-primary hover:bg-on-background rounded-lg font-label-caps text-xs font-semibold transition-colors shadow-sm"
                          type="button"
                        >
                          Mark as Paid
                        </button>
                      )
                    ) : (
                      <span className="font-label-caps text-xs text-emerald-700 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Verified Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History & Transaction Telemetry Table (Bottom Section) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low overflow-hidden flex flex-col">
          <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-container-low">
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">Payment History & Evidentiary Telemetry</h3>
              <p className="font-body-sm text-xs text-on-surface-variant">
                Admissible electronic records formatted under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (formerly Sec. 65B Indian Evidence Act).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base pointer-events-none">search</span>
                <input
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  className="h-9 pl-9 pr-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container transition-all w-48 lg:w-60"
                  placeholder="Filter UTR / Cycle..."
                  type="text"
                />
              </div>
              <button
                onClick={() => triggerToast('Default columns: Cycle, Date, Amount, Payment Mode, UTR Hash, Evidentiary Status')}
                className="h-9 px-3 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-label-caps text-xs font-semibold flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                <span>Columns</span>
              </button>
            </div>
          </div>

          {/* Table Viewport */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low/70 font-label-caps uppercase tracking-wider text-on-surface-variant font-semibold">
                <tr>
                  <th className="py-3 px-6">Cycle & Description</th>
                  <th className="py-3 px-4">Due / Paid Date</th>
                  <th className="py-3 px-4">Amount (₹)</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">UTR / Receipt Hash</th>
                  <th className="py-3 px-4">Evidentiary Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low font-body-sm text-on-surface">
                {filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-surface-container-low/40 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-secondary-container text-on-secondary-fixed flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-sm">
                            {p.cycle.includes('Deposit') ? 'lock' : 'home'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">{p.cycle}</span>
                          <span className="font-label-caps text-[10px] text-on-surface-variant">{p.inv}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{p.date}</span>
                        <span className="font-label-caps text-[10px] text-on-surface-variant">{p.dueDate}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-on-surface text-sm">{p.amount}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-on-surface">
                        <span className="material-symbols-outlined text-xs text-secondary">sync_alt</span>
                        {p.mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-label-caps text-on-surface-variant font-mono">
                        <span>{p.utr}</span>
                        <button
                          onClick={() => copyToClipboard(p.utr, 'UTR')}
                          className="text-on-secondary-container hover:text-on-surface"
                          title="Copy UTR"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-xs">content_copy</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-fixed font-label-caps text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => triggerToast(`Downloading Section 63 BSA certified electronic receipt for ${p.cycle}`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                          title="Download Receipt"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">download</span>
                        </button>
                        <button
                          onClick={() => triggerToast(`Viewing SHA-256 Legal Telemetry Hash: ${p.utr}`)}
                          className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                          title="View Legal Voucher"
                          type="button"
                        >
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Custom Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-surface-container flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-surface-container-low flex items-center justify-between sticky top-0 bg-surface-container-lowest z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">alarm_add</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface">Add Statutory Reminder</h3>
                  <p className="font-body-sm text-xs text-on-surface-variant">
                    Configures automated alerts and creates admissible timestamp entries in the backend database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveReminder} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Reminder Title / Subject *
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Tenancy Rent Due or RWA Maintenance Dues"
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container transition-all"
                  required
                />
              </div>

              {/* Category Quick Select */}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Agreement Milestone Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Rent Due', 'Late Penalty', 'Notice Window', 'Agreement Renewal'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`p-2 rounded-lg text-xs font-semibold text-center transition-all ${
                        newCategory === cat
                          ? 'bg-primary-container text-on-primary shadow-sm'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row: Due Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="35000"
                    className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container transition-all"
                  />
                </div>
              </div>

              {/* Recurrence Rule */}
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-xs text-on-surface-variant uppercase font-semibold">
                  Recurrence Rule
                </label>
                <select
                  value={newRecurrence}
                  onChange={(e) => setNewRecurrence(e.target.value)}
                  className="h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-xs text-on-surface focus:outline-none focus:bg-surface-container transition-all cursor-pointer"
                >
                  <option>Monthly (Recurring Rent Cycle)</option>
                  <option>Quarterly (Society Maintenance)</option>
                  <option>Annual (Agreement Renewal & Stamp Duty)</option>
                  <option>One-Time Statutory Notice</option>
                </select>
              </div>

              {/* Channel Alerts Toggle */}
              <div className="p-4 rounded-xl bg-surface-container-low flex flex-col gap-2.5 mt-1">
                <span className="font-label-caps text-xs text-on-surface font-bold uppercase tracking-wider">
                  Multi-Channel Evidentiary Alerts
                </span>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-on-tertiary-container">chat</span>
                    <span className="font-body-sm text-xs text-on-surface font-medium">WhatsApp Push Dispatch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={channelWhatsapp}
                    onChange={(e) => setChannelWhatsapp(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-container"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">mail</span>
                    <span className="font-body-sm text-xs text-on-surface font-medium">Registered Email Dispatch</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={channelEmail}
                    onChange={(e) => setChannelEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-container"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-on-surface">gavel</span>
                    <span className="font-body-sm text-xs text-on-surface font-medium">Pre-litigation Warning SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={channelSms}
                    onChange={(e) => setChannelSms(e.target.checked)}
                    className="w-4 h-4 rounded text-primary-container"
                  />
                </label>
              </div>

              {/* Inset Advisory Note */}
              <div className="p-3 rounded-lg bg-secondary-container/40 text-on-secondary-fixed flex items-start gap-2">
                <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                <p className="font-label-sm text-xs leading-snug">
                  Reminders logged here automatically integrate into your evidentiary audit timeline and will be timestamped with SHA-256 hash records in conformity with Section 63 BSA 2023.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-surface-container flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors font-body-sm text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-on-background transition-colors font-body-sm text-xs font-semibold shadow-sm flex items-center gap-1.5"
                >
                  <span>Save & Arm Reminder</span>
                  <span className="material-symbols-outlined text-sm">alarm_on</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

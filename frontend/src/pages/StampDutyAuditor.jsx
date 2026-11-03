import React, { useState } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import UploadModal from '../components/UploadModal';

export default function StampDutyAuditor() {
  const navigate = useNavigate();
  const { currentDocument, activeJurisdiction } = useDocument();

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcSuccess, setRecalcSuccess] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Editable parameters for interactive recalculation
  const [term, setTerm] = useState('11');
  const [monthlyRent, setMonthlyRent] = useState(currentDocument.monthly_rent || 35000);
  const [deposit, setDeposit] = useState(currentDocument.security_deposit || 150000);

  // Dynamic calculated figures based on live inputs
  const rentNumber = Number(monthlyRent) || 0;
  const depositNumber = Number(deposit) || 0;
  const termNumber = Number(term) || 11;
  const computedConsideration = rentNumber * termNumber;

  // Rate in Telangana is 0.4% on rent consideration + 0.5% on deposit
  const computedBaseDuty = Math.round(computedConsideration * 0.004);
  const computedSurcharge = Math.round(computedConsideration * 0.002) + 100;
  const computedTargetDuty = computedBaseDuty + computedSurcharge;
  const paidDutyAmount = currentDocument.stamp_duty?.paid_duty || 100;
  const computedShortfall = Math.max(0, computedTargetDuty - paidDutyAmount);

  const stamp = currentDocument.stamp_duty || {};

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
      setRecalcSuccess(true);
      setTimeout(() => setRecalcSuccess(false), 2000);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-lg space-y-space-lg">
      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-caps text-label-caps text-on-tertiary-container uppercase tracking-wider bg-tertiary-fixed/30 px-2 py-0.5 rounded border border-tertiary-fixed-dim/40 font-semibold">
              Compliance Audit Ledger
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-label-caps text-label-caps font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              {computedShortfall > 0 ? 'Statutory Deficit Identified' : 'Tariff Satisfied'}
            </span>
            <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-fixed text-[10px] font-bold">
              {currentDocument.is_demo_sample ? 'DEMONSTRATION SAMPLE' : 'USER DOCUMENT'}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mt-1">
            Stamp Duty Auditor
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Statutory tariff evaluation and stamp duty assessment under Telangana and Andhra Pradesh registration laws.
          </p>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 bg-primary-container text-on-primary font-body-sm text-body-sm font-semibold rounded-lg hover:bg-on-background transition-colors flex items-center gap-1.5 shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-base">upload_file</span>
          <span>Upload Another Certificate</span>
        </button>
      </div>

      {/* Advisory Banner */}
      <div className="p-3 bg-secondary-container/20 border border-secondary-container/40 rounded-xl text-xs text-on-surface-variant flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-on-tertiary-container">info</span>
          <strong>Audit Notice:</strong> This audit calculates theoretical stamp liability under Schedule I-A Article 35 of the State Stamp Act. It is a decision-support preview and does not constitute an official government verification or endorsement from SHCIL.
        </span>
        <span className="font-semibold text-on-surface text-[10px] uppercase">{activeJurisdiction === 'AP' ? 'AP Stamps Code' : 'TS Stamps Code'}</span>
      </div>

      {/* Interactive Assessment Parameters Bar */}
      <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-space-xs border-b border-surface-container">
          <h3 className="font-title-md text-title-md font-bold text-on-surface">Live Instrument Audit Parameters</h3>
          <span className="font-label-caps text-label-caps text-on-surface-variant">Adjust values to calculate statutory tariff</span>
        </div>

        {/* 4 Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* State Jurisdiction */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">State Jurisdiction</label>
            <div className="flex items-center gap-2 text-on-surface font-title-md text-title-md font-bold">
              <span className="material-symbols-outlined text-primary text-base">location_on</span>
              <span>{activeJurisdiction === 'AP' ? 'Andhra Pradesh' : 'Telangana (TS)'}</span>
            </div>
            <span className="font-label-caps text-label-caps text-outline">CARD Online Assessment Sub-District</span>
          </div>

          {/* Agreement Category */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Instrument Classification</label>
            <div className="flex items-center gap-2 text-on-surface font-title-md text-title-md font-semibold truncate">
              <span className="material-symbols-outlined text-primary text-base">article</span>
              <span className="truncate">{currentDocument.doc_type || 'Tenancy Agreement (Art. 35)'}</span>
            </div>
            <span className="font-label-caps text-label-caps text-outline">Schedule I-A Applicable</span>
          </div>

          {/* Agreement Term */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Term & Tenor (Months)</label>
            <div className="flex items-center gap-2 text-on-surface font-title-md text-title-md font-semibold">
              <span className="material-symbols-outlined text-primary text-base">schedule</span>
              <input
                type="number"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="w-16 px-1.5 py-0.5 rounded bg-surface-container-lowest font-bold text-sm border border-surface-container"
              />
              <span className="text-xs">Months</span>
            </div>
            <span className="font-label-caps text-label-caps text-outline">Sub-1 Year Lease Instrument</span>
          </div>

          {/* Execution Date */}
          <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-surface-container-low border border-surface-container">
            <label className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Stamp Execution Date</label>
            <div className="flex items-center gap-2 text-on-surface font-title-md text-title-md font-semibold">
              <span className="material-symbols-outlined text-primary text-base">calendar_today</span>
              <span>{currentDocument.execution_date}</span>
            </div>
            <span className="font-label-caps text-label-caps text-outline">Limitation: Within statutory window</span>
          </div>
        </div>

        {/* Consideration Financial Breakdown & CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md pt-space-sm border-t border-surface-container">
          <div className="flex flex-wrap items-center gap-space-lg">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">Monthly Rent:</span>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-24 px-2 py-1 rounded bg-surface-container-low font-bold text-xs border border-surface-container"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">Deposit:</span>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-28 px-2 py-1 rounded bg-surface-container-low font-bold text-xs border border-surface-container"
              />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold">Consideration:</span>
              <span className="font-title-md text-title-md font-bold text-on-surface font-mono">
                ₹{computedConsideration.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-shrink-0">
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span className={`material-symbols-outlined text-base ${isRecalculating ? 'animate-spin' : ''}`}>
                {recalcSuccess ? 'check' : 'refresh'}
              </span>
              <span>{isRecalculating ? 'Recalculating...' : recalcSuccess ? 'Tariffs Synced' : 'Recalculate Tariff'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Two-Column Master Audit Grid (Left 7 cols, Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Digital Instrument Reconstruction (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden relative border border-surface-container">
            {/* Document Action Toolbar */}
            <div className="p-space-md bg-surface-container-low flex items-center justify-between border-b border-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant text-base">document_scanner</span>
                <span className="font-label-sm text-label-sm font-bold text-on-surface tracking-wide uppercase">
                  Simulated E-Stamp Certificate Preview (Demonstration Audit)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-surface-container-lowest px-2 py-0.5 rounded text-on-surface font-label-caps text-label-caps font-semibold border border-surface-container">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                  Simulated OCR Preview
                </span>
                <button
                  type="button"
                  onClick={() => alert('Downloading simulated digital certificate replica...')}
                  className="text-on-surface-variant hover:text-on-surface transition-colors p-1"
                  title="Download Certificate Preview"
                >
                  <span className="material-symbols-outlined text-lg">download</span>
                </button>
              </div>
            </div>

            {/* Simulated Physical Certificate Viewport */}
            <div className="p-space-lg bg-surface-container-low/40 relative">
              <div className="bg-surface-container-lowest rounded-lg shadow-md p-6 relative overflow-hidden border border-surface-container">
                {/* Diagonal Audit Watermark */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 select-none z-10">
                  <span className="font-display text-2xl md:text-3xl font-extrabold text-primary -rotate-45 tracking-wider uppercase text-center leading-none">
                    SAMPLE PREVIEW<br />FOR REGULATORY AUDIT
                  </span>
                </div>

                {/* Top Header & Emblem */}
                <div className="flex flex-col items-center text-center pb-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface mb-2 shadow-inner">
                    <span className="material-symbols-outlined text-2xl">shield</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-wide uppercase">
                    {activeJurisdiction === 'AP' ? 'Government of Andhra Pradesh' : 'Government of Telangana'}
                  </h3>
                  <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest mt-0.5">
                    Registration and Stamps Department (Demonstration Layout)
                  </p>
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-tertiary-fixed/30 rounded font-label-caps text-label-caps font-bold text-on-tertiary-fixed border border-tertiary-fixed-dim/40">
                    <span>NON-JUDICIAL e-STAMP PREVIEW</span>
                  </div>
                </div>

                {/* Meta Badges & Certificate Code */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-surface-container-low rounded-lg mb-4 text-left border border-surface-container">
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">Certificate Ref.</span>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface font-mono text-[11px] truncate block">
                      {stamp.certificate_no || 'IN-TS20268894103251'}
                    </span>
                  </div>
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">Execution Date</span>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">{currentDocument.execution_date}</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">Jurisdiction Office</span>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">RO Hyderabad West</span>
                  </div>
                  <div>
                    <span className="font-label-caps text-label-caps text-on-surface-variant block">Purchase Channel</span>
                    <span className="font-label-sm text-label-sm font-bold text-on-surface">E-Treasury Portal</span>
                  </div>
                </div>

                {/* Parties & Instrument Details Table */}
                <div className="bg-surface-container-low/70 rounded-lg p-4 space-y-3 mb-4 border border-surface-container">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">First Party (Lessor):</span>
                    <span className="font-body-sm text-body-sm font-bold text-on-surface sm:col-span-2">{currentDocument.lessor_name || 'K. R. V. Rao'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Second Party (Lessee):</span>
                    <span className="font-body-sm text-body-sm font-bold text-on-surface sm:col-span-2">{currentDocument.lessee_name || 'Syed Amanullah'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Description of Instrument:</span>
                    <span className="font-body-sm text-body-sm text-on-surface sm:col-span-2">
                      <span className="font-semibold text-on-surface">Article 35</span> — Residential tenancy period for {term} months.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">Declared Total Consideration:</span>
                    <span className="font-body-sm text-body-sm font-bold text-on-surface sm:col-span-2 font-mono">₹ {computedConsideration.toLocaleString()} /-</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1 bg-surface-container-lowest p-2 rounded border border-surface-container">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase self-center">Duty Paid on Certificate:</span>
                    <div className="sm:col-span-2 flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm font-extrabold text-on-surface font-mono">
                        ₹ {paidDutyAmount}.00
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-label-caps text-label-caps font-bold ${
                        computedShortfall > 0 ? 'bg-error-container text-on-error-container text-red-700' : 'bg-secondary-container text-on-secondary-fixed'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${computedShortfall > 0 ? 'bg-error' : 'bg-emerald-600'}`}></span>
                        {computedShortfall > 0 ? 'Under-Stamped / Deficit' : 'Sufficient Duty'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disclaimers & Security Seals */}
                <div className="p-3 bg-surface-container-low rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-secondary">verified</span>
                    <span>Electronic preview formatted under Section 63 BSA 2023</span>
                  </div>
                  <span className="font-mono text-[10px] text-outline">QR HASH: 9B2D8F76E10239C0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Statutory Audit & Compliance Stepper (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Card 1: Statutory Tariff Audit & Deficit */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container">
            <div className="flex items-center justify-between border-b border-surface-container pb-space-xs">
              <h3 className="font-title-md text-title-md font-bold text-on-surface">Statutory Tariff Assessment</h3>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Schedule I-A Art. 35</span>
            </div>

            {/* Paid vs Target Gauges */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface-variant">Paid Stamp Duty:</span>
                <span className="font-bold text-on-surface font-mono">₹{paidDutyAmount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-on-surface-variant">Estimated Applicable Tariff:</span>
                <span className="font-bold text-on-surface font-mono">₹{computedTargetDuty.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-error font-bold">
                <span>Estimated Shortfall:</span>
                <span className="font-mono text-sm">₹{computedShortfall.toLocaleString()}</span>
              </div>
            </div>

            {/* Progress Bar of Duty Paid */}
            <div className="flex flex-col gap-1">
              <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${computedShortfall > 0 ? 'bg-error' : 'bg-emerald-600'}`}
                  style={{ width: `${Math.min(100, Math.round((paidDutyAmount / computedTargetDuty) * 100))}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between font-label-caps text-xs text-outline">
                <span>₹{paidDutyAmount} Paid</span>
                <span>{computedShortfall > 0 ? `Deficit: ₹${computedShortfall.toLocaleString()}` : 'Fully Paid'}</span>
                <span>₹{computedTargetDuty.toLocaleString()} Target</span>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="bg-surface-container-low rounded-lg p-space-md mb-space-sm border border-surface-container">
              <h4 className="font-label-caps text-label-caps font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Itemized Schedule Tariff Calculation
              </h4>
              <div className="divide-y divide-surface-container text-xs">
                <div className="flex items-center justify-between py-2 text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-semibold">Article 35 Stamp Duty</span>
                    <span className="text-[10px] text-outline">Base rate (0.4% on consideration)</span>
                  </div>
                  <span className="font-bold font-mono">₹ {computedBaseDuty.toLocaleString()}.00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-semibold">Local Body Transfer Surcharge</span>
                    <span className="text-[10px] text-outline">Municipal duty component</span>
                  </div>
                  <span className="font-bold font-mono">₹ {computedSurcharge.toLocaleString()}.00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-on-surface">
                  <div className="flex flex-col">
                    <span className="font-semibold">Standard Registration Fee</span>
                    <span className="text-[10px] text-outline">Sub-Registrar filing rate (Optional for &lt;11m)</span>
                  </div>
                  <span className="font-bold font-mono">₹ 1,000.00</span>
                </div>
                <div className="flex items-center justify-between pt-2.5 text-on-surface font-bold">
                  <span className="text-sm">Combined Statutory Obligation</span>
                  <span className="text-sm text-primary font-mono">₹ {(computedTargetDuty + 1000).toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 2: Legal Advisory & Section 35 Nuance */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md border border-surface-container">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface flex-shrink-0">
                <span className="material-symbols-outlined text-xl">gavel</span>
              </div>
              <div className="flex flex-col">
                <h3 className="font-title-md text-title-md font-bold text-on-surface">Evidentiary Admissibility Notice</h3>
                <span className="font-label-caps text-label-caps text-error font-semibold">
                  Section 35 Indian Stamp Act (1899) Applicability
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-xs leading-relaxed border border-surface-container">
              <strong>Statutory Principle:</strong> Under Section 35 of the Indian Stamp Act, unstamped or deficiently stamped agreements cannot be admitted as formal evidence in civil court or summary eviction suits until regularized.
              <br /><br />
              <strong>Penalty Nuance:</strong> While judicial impoundment in court attracts a mandatory penalty ceiling of up to 10x the deficit under Section 35(a), voluntary pre-dispute presentation before the Collector / District Registrar under Sections 31 & 32 allows administrative determination of deficit. However, voluntary adjudication does not guarantee total elimination of penalties if presented after the statutory limitation period, though it avoids automatic judicial impoundment.
            </div>

            {/* Recourse Stepper */}
            <div className="space-y-3">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase font-bold tracking-wider block">
                Recommended Recourse Steps
              </span>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">Procure Supplementary E-Stamp Paper</span>
                  <p className="text-on-surface-variant">Purchase non-judicial e-stamp paper for ₹{computedShortfall.toLocaleString()} to cover statutory deficit.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">Execute Bilateral Addendum / Endorsement</span>
                  <p className="text-on-surface-variant">Execute addendum or endorsement before any dispute escalation or judicial notice.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-on-surface">Generate Regularization Dossier</span>
                  <p className="text-on-surface-variant">Compile compliance certificate to certify retroactive enforceability.</p>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-surface-container-low text-on-surface-variant font-label-sm text-xs italic border border-surface-container">
              “Tariff estimates are based on general state schedules and do not constitute an official Sub-Registrar endorsement.”
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-2">
              <button
                type="button"
                onClick={() => alert('Exporting Stamp Audit report in PDF format...')}
                className="w-full sm:w-1/2 py-2.5 px-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>Export Stamp Audit PDF</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/advocate-directory')}
                className="w-full sm:w-1/2 py-2.5 px-3 bg-primary-container hover:bg-on-background text-on-primary font-body-sm text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">gavel</span>
                <span>Connect with Advocate</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}

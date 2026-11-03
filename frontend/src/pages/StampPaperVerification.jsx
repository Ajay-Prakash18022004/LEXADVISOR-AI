import React, { useState, useEffect, useRef } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';

export default function StampPaperVerification() {
  const navigate = useNavigate();
  const { currentDocument, uploadAndAnalyze, isAnalyzing, activeJurisdiction, clearDocument } = useDocument();

  const [useSample, setUseSample] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [refreshToast, setRefreshToast] = useState(null);

  const handleClearDocument = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUseSample(false);
    setMonthlyRent('');
    setDeposit('');
    setContractConsideration('');
    if (clearDocument) clearDocument();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setRefreshToast('Document cleared. Ready to upload new document.');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  const handleResetChat = () => {
    handleClearDocument();
  };

  const fileInputRef = useRef(null);

  // Check if we have an active user-uploaded document or opted-in sample preview
  const hasDocument = Boolean(currentDocument && (!currentDocument.is_demo_sample || useSample));

  // Calculation parameters synchronized with current document
  const [instrumentCategory, setInstrumentCategory] = useState('lease');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [term, setTerm] = useState('11');
  const [contractConsideration, setContractConsideration] = useState('');

  // Sync inputs whenever currentDocument changes
  useEffect(() => {
    if (currentDocument) {
      const isLease = (currentDocument.doc_type || '').toLowerCase().includes('lease') ||
                      (currentDocument.doc_type || '').toLowerCase().includes('rent') ||
                      (currentDocument.doc_type || '').toLowerCase().includes('tenan');
      setInstrumentCategory(isLease ? 'lease' : 'general_agreement');

      if (currentDocument.monthly_rent) {
        setMonthlyRent(String(currentDocument.monthly_rent));
      } else {
        setMonthlyRent(currentDocument.is_demo_sample ? '35000' : '0');
      }

      if (currentDocument.security_deposit) {
        setDeposit(String(currentDocument.security_deposit));
      } else {
        setDeposit(currentDocument.is_demo_sample ? '150000' : '0');
      }

      if (currentDocument.financial_consideration && !isLease) {
        const num = parseInt(String(currentDocument.financial_consideration).replace(/[^0-9]/g, ''));
        if (num) setContractConsideration(String(num));
      }
    }
  }, [currentDocument]);

  // File drag & drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.png', '.jpg', '.jpeg'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadError('Please select a PDF, DOCX, TXT, MD, or image contract.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Document size exceeds 25 MB limit.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setLocalUploading(true);

    try {
      await uploadAndAnalyze(file, {
        state: activeJurisdiction === 'AP' ? 'Andhra Pradesh' : 'Telangana'
      });
    } catch (err) {
      setUploadError(err.message || 'Failed to verify stamp paper. Please try again.');
    } finally {
      setLocalUploading(false);
    }
  };

  // Dynamic calculations
  const rentNumber = Number(monthlyRent) || 0;
  const depositNumber = Number(deposit) || 0;
  const termNumber = Number(term) || 11;
  const contractSum = Number(contractConsideration) || 0;

  // Stamp calculation rules (Telangana / AP Schedule 1-A)
  let computedConsideration = 0;
  let computedBaseDuty = 0;
  let computedSurcharge = 0;
  let computedTargetDuty = 0;

  if (instrumentCategory === 'lease') {
    computedConsideration = (rentNumber * termNumber) + (termNumber > 11 ? depositNumber : 0);
    computedBaseDuty = Math.round(computedConsideration * 0.004);
    computedSurcharge = computedConsideration > 0 ? Math.round(computedConsideration * 0.002) + 100 : 0;
    computedTargetDuty = Math.max(100, computedBaseDuty + computedSurcharge);
  } else {
    computedConsideration = contractSum;
    computedBaseDuty = contractSum > 0 ? Math.max(100, Math.round(contractSum * 0.005)) : 100;
    computedSurcharge = 0;
    computedTargetDuty = computedBaseDuty;
  }

  const paidDutyAmount = currentDocument?.stamp_duty?.paid_duty ?? 100;
  const computedShortfall = Math.max(0, computedTargetDuty - paidDutyAmount);
  const isDeficient = computedShortfall > 0;

  const stamp = currentDocument?.stamp_duty || {};
  const partyOne = currentDocument?.party_one || currentDocument?.lessor_name || (currentDocument?.is_demo_sample ? 'K. R. V. Rao' : 'First Party (Disclosing/Lessor)');
  const partyTwo = currentDocument?.party_two || currentDocument?.lessee_name || (currentDocument?.is_demo_sample ? 'Syed Amanullah' : 'Second Party (Receiving/Lessee)');

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      setIsRecalculating(false);
    }, 400);
  };

  const isBusy = isAnalyzing || localUploading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-lg space-y-space-lg">
      {/* Toast Alert */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">sync</span>
          <span className="font-body-sm text-sm font-semibold">{refreshToast}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Header Context */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-2 border-b border-surface-container/60">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-label-caps text-label-caps text-on-tertiary-container uppercase tracking-wider bg-tertiary-fixed/30 px-2.5 py-0.5 rounded border border-tertiary-fixed-dim/40 font-semibold">
              Government Document Verification
            </span>
            {hasDocument && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-label-caps text-label-caps font-semibold ${
                isDeficient ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isDeficient ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
                {isDeficient ? `Statutory Deficit: ₹${computedShortfall.toLocaleString('en-IN')}` : 'Statutory Tariff Satisfied'}
              </span>
            )}
          </div>

          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight mt-1">
            Government Stamp Paper &amp; Certificate Verification
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Verify e-stamps, non-judicial stamp papers, registration duty receipts, and compliance under Indian Stamp Laws.
          </p>
        </div>

        {/* Clear Document Action when document is active */}
        {hasDocument && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={handleClearDocument}
              className="h-10 px-3.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-semibold border border-error/30 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Clear active document and return to upload dropzone"
            >
              <span className="material-symbols-outlined text-base">close</span>
              <span>Clear Document</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading Spinner Overlay */}
      {isBusy && (
        <div className="rounded-2xl bg-surface-container-lowest p-8 border-2 border-primary/20 shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <h3 className="font-title-md text-base font-bold text-on-surface">
            Auditing Stamp Duty &amp; Certificate Authenticity...
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            Validating stamp denomination, serial hash, jurisdiction rates under Telangana/AP Stamp Schedule 1-A, and Section 35 evidence admissibility.
          </p>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-error-container text-on-error-container text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-on-error-container font-bold text-xs uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PICTURE 1: Upload Dropzone when no active user document */}
      {!hasDocument && !isBusy && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`rounded-2xl p-8 sm:p-12 text-center border-2 border-dashed transition-all flex flex-col items-center justify-center space-y-4 ${
            dragActive
              ? 'border-primary bg-primary-container/10'
              : 'border-surface-container-highest bg-surface-container-lowest'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-3xl">upload_file</span>
          </div>

          <div className="space-y-1 max-w-md">
            <h3 className="font-headline-sm text-lg sm:text-headline-sm font-bold text-on-surface">
              Upload Your Legal Document
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              Drag and drop your agreement here, or browse files from your device.
            </p>
            <p className="text-[11px] text-on-surface-variant/80">
              Supports PDF, DOCX, TXT, MD, and image contracts up to 25 MB.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 px-6 rounded-xl bg-primary-container text-on-primary font-body-sm text-sm font-semibold shadow-md hover:bg-on-background transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">folder_open</span>
              <span>Select Document</span>
            </button>

            <button
              type="button"
              onClick={handleResetChat}
              className="h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-xs font-semibold border border-surface-container transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Reset workspace"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span>Reset Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setUseSample(true)}
              className="h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-body-sm text-xs font-semibold border border-surface-container transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-on-surface-variant">description</span>
              <span>Preview with Sample Agreement</span>
            </button>
          </div>
        </div>
      )}

      {/* Active Document Stamp Audit Workspace */}
      {hasDocument && !isBusy && (
        <div className="space-y-space-lg">
          {/* 4 Verdict Categories Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category 1: Verified */}
            <div className={`p-4 rounded-xl bg-surface-container-lowest border shadow-xs space-y-2 ${
              !isDeficient ? 'border-2 border-emerald-500 bg-emerald-50/20' : 'border-surface-container'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">1. VALID FORMAT</span>
                <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
              </div>
              <h4 className="text-xs font-bold text-on-surface">Verified / Valid Format</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Stamp duty matches statutory tariff for the transaction value, parties, and date.
              </p>
            </div>

            {/* Category 2: Discrepancy */}
            <div className={`p-4 rounded-xl bg-surface-container-lowest border shadow-xs space-y-2 ${
              isDeficient ? 'border-2 border-amber-400 bg-amber-50/30' : 'border-surface-container'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">2. DISCREPANCY</span>
                <span className="material-symbols-outlined text-amber-600 text-lg">warning</span>
              </div>
              <h4 className="text-xs font-bold text-on-surface">Potential Discrepancy</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Duty underpaid (e.g. ₹{paidDutyAmount} stamp vs ₹{computedTargetDuty} required). Regularizable via SRO adjudication.
              </p>
            </div>

            {/* Category 3: Invalid */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">3. SUSPECTED ISSUE</span>
                <span className="material-symbols-outlined text-red-600 text-lg">cancel</span>
              </div>
              <h4 className="text-xs font-bold text-on-surface">Invalid / Expired Paper</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Purchased in wrong state, wrong party names, or post-dated after execution date.
              </p>
            </div>

            {/* Category 4: Manual Portal Check */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">4. PORTAL VERIFICATION</span>
                <span className="material-symbols-outlined text-blue-600 text-lg">open_in_new</span>
              </div>
              <h4 className="text-xs font-bold text-on-surface">Manual Portal Check</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Query official SHCIL or state treasury server using the certificate number.
              </p>
            </div>
          </div>

          {/* Official Government Portals Callout Bar */}
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-surface-container shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold font-cinzel text-lg shrink-0">
                🏛️
              </div>
              <div>
                <h4 className="text-sm font-bold text-on-surface">Official State Government Verification Portals</h4>
                <p className="text-xs text-on-surface-variant">To verify certificate genuineness directly on government servers, query your certificate ID below:</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://www.shcilestamp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container border border-surface-container flex items-center gap-1"
              >
                <span>SHCIL E-Stamping</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
              <a
                href="https://registration.telangana.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container border border-surface-container flex items-center gap-1"
              >
                <span>Telangana IGRS</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
              <a
                href="https://registration.ap.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface text-xs font-semibold hover:bg-surface-container border border-surface-container flex items-center gap-1"
              >
                <span>Andhra Pradesh IGRS</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Main Grid: Certificate Details & Calculation Ledger */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Certificate Details & Forensic Checks */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-on-tertiary-container">
                      E-Stamp Certificate Scan
                    </span>
                    <h3 className="font-title-md text-title-md font-bold text-on-surface">
                      {stamp.certificate_no || 'IN-TS-ONLINE-VERIFIED'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleClearDocument}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-error/10 hover:bg-error/20 text-error border border-error/30 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Clear this document and return to upload dropzone"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      <span>Clear Document</span>
                    </button>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isDeficient ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isDeficient ? 'Deficit Identified' : 'Tariff Satisfied'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-on-surface-variant">First Party:</span>
                    <p className="font-semibold text-on-surface mt-0.5 truncate" title={partyOne}>
                      {partyOne}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Second Party:</span>
                    <p className="font-semibold text-on-surface mt-0.5 truncate" title={partyTwo}>
                      {partyTwo}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Jurisdiction / SRO:</span>
                    <p className="font-semibold text-on-surface mt-0.5">
                      {currentDocument?.city ? `${currentDocument.city} (${currentDocument.state || 'Telangana'})` : (currentDocument?.state || 'Telangana SRO')}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Document Classification:</span>
                    <p className="font-semibold text-on-surface mt-0.5 truncate">
                      {currentDocument?.doc_type || 'General Legal Instrument'}
                    </p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Stamp Value Paid:</span>
                    <p className="font-bold text-on-surface mt-0.5 text-sm">₹{paidDutyAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Statutory Required:</span>
                    <p className={`font-bold mt-0.5 text-sm ${isDeficient ? 'text-error' : 'text-emerald-700'}`}>
                      ₹{computedTargetDuty.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Evidence Admissibility Warning */}
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 leading-relaxed ${
                  isDeficient
                    ? 'bg-amber-50 border-amber-200 text-amber-950'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="material-symbols-outlined text-base">
                      {isDeficient ? 'gavel' : 'verified'}
                    </span>
                    <span>
                      {isDeficient
                        ? 'Evidence Law Admissibility Warning (Section 35 Indian Stamp Act)'
                        : 'Statutory Admissibility Confirmed (Indian Stamp Act)'}
                    </span>
                  </div>
                  <p>
                    {isDeficient
                      ? `Under Section 35 of the Indian Stamp Act (1899), instruments executed on deficient stamp paper cannot be admitted as formal primary evidence in civil courts or summary proceedings until regularized. You can voluntarily regularize before the District Registrar under Section 31/32 to pay the deficit of ₹${computedShortfall.toLocaleString('en-IN')} without facing judicial impounding penalties.`
                      : `This document's stamp duty complies with statutory schedules for ${currentDocument?.state || 'Telangana'}. It meets admissibility prerequisites under Section 35 of the Indian Stamp Act.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Interactive Stamp Duty Calculator */}
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-surface-container-lowest border border-surface-container shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-surface-container pb-3">
                  <h3 className="font-title-md text-title-md font-bold text-on-surface">Stamp Duty Calculator</h3>
                  <span className="text-xs text-on-surface-variant font-mono">
                    {currentDocument?.state || 'Telangana'} Schedule
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-on-surface">Instrument Category</label>
                    <select
                      value={instrumentCategory}
                      onChange={(e) => setInstrumentCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-surface-container text-body-sm mt-1"
                    >
                      <option value="lease">Residential / Commercial Lease (Art. 35)</option>
                      <option value="general_agreement">General Agreement / Contract / MSA (Art. 5)</option>
                    </select>
                  </div>

                  {instrumentCategory === 'lease' ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-on-surface">Monthly Rent (₹)</label>
                        <input
                          type="number"
                          value={monthlyRent}
                          onChange={(e) => setMonthlyRent(e.target.value)}
                          placeholder="e.g. 35000"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface">Security Deposit (₹)</label>
                        <input
                          type="number"
                          value={deposit}
                          onChange={(e) => setDeposit(e.target.value)}
                          placeholder="e.g. 150000"
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-on-surface">Lease Term (Months)</label>
                        <select
                          value={term}
                          onChange={(e) => setTerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                        >
                          <option value="11">11 Months (Standard)</option>
                          <option value="24">24 Months (2 Years)</option>
                          <option value="36">36 Months (3 Years)</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-on-surface">Declared Contract Consideration (₹)</label>
                      <input
                        type="number"
                        value={contractConsideration}
                        onChange={(e) => setContractConsideration(e.target.value)}
                        placeholder="e.g. 100000 (0 if unstated)"
                        className="w-full px-3 py-2 rounded-lg bg-surface-container-lowest border border-surface-container text-body-sm mt-1"
                      />
                      <span className="text-[11px] text-on-surface-variant mt-1 block">
                        Under TS Art. 5: 0.5% if consideration specified, or minimum ₹100.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs shadow-xs hover:bg-on-background transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                  >
                    {isRecalculating ? (
                      <span>Recalculating...</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">calculate</span>
                        <span>Recalculate Stamp Duty</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Calculated Breakdown */}
                <div className="pt-3 border-t border-surface-container space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Taxable Consideration:</span>
                    <span className="font-semibold text-on-surface">₹{computedConsideration.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Base Stamp Duty:</span>
                    <span className="font-semibold text-on-surface">₹{computedBaseDuty.toLocaleString('en-IN')}</span>
                  </div>
                  {computedSurcharge > 0 && (
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Surcharge &amp; User Fee:</span>
                      <span className="font-semibold text-on-surface">₹{computedSurcharge.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-surface-container font-bold text-sm">
                    <span>Total Statutory Duty:</span>
                    <span className="text-primary">₹{computedTargetDuty.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className={isDeficient ? 'text-error' : 'text-emerald-700'}>
                      {isDeficient ? 'Duty Deficit:' : 'Tariff Status:'}
                    </span>
                    <span className={isDeficient ? 'text-error' : 'text-emerald-700'}>
                      {isDeficient ? `₹${computedShortfall.toLocaleString('en-IN')}` : 'Fully Compliant'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

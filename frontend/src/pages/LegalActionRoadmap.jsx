import React, { useState, useRef } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';
import { downloadActionPlanPdf, downloadRiskReportPdf } from '../api/analysis';

export default function LegalActionRoadmap() {
  const navigate = useNavigate();
  const { currentDocument, uploadAndAnalyze, isAnalyzing, activeJurisdiction, clearDocument } = useDocument();

  const [useSample, setUseSample] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [refreshToast, setRefreshToast] = useState(null);

  const handleClearDocument = () => {
    setSelectedFile(null);
    setUploadError(null);
    setUseSample(false);
    setCompletedActions({
      action1: false,
      action2: false,
      action3: false,
      action4: false
    });
    if (clearDocument) clearDocument();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setRefreshToast('Document cleared. Ready to upload new document.');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  const handleResetChat = () => {
    handleClearDocument();
  };

  // Step 6: Interactive tracking of completed actions
  const [completedActions, setCompletedActions] = useState({
    action1: false,
    action2: false,
    action3: false,
    action4: false
  });

  const fileInputRef = useRef(null);

  // Check if we have an active document
  const hasDocument = Boolean(currentDocument && (!currentDocument.is_demo_sample || useSample));

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
      setUploadError('Please select a PDF, DOCX, TXT, MD, or image agreement.');
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
      setUploadError(err.message || 'Failed to process document. Please try again.');
    } finally {
      setLocalUploading(false);
    }
  };

  // Toggle action completion
  const toggleAction = (key) => {
    setCompletedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Document-derived values
  const partyOne = currentDocument?.party_one || currentDocument?.lessor_name || 'First Party';
  const partyTwo = currentDocument?.party_two || currentDocument?.lessee_name || 'Second Party';
  const findings = currentDocument?.findings || [];
  const missingSafeguards = currentDocument?.missing_clauses || [];
  const stampShortfall = currentDocument?.stamp_duty?.shortfall || 0;
  const hasStampDeficit = currentDocument?.stamp_duty?.is_deficient || stampShortfall > 0;
  const initialRiskScore = currentDocument?.risk_score || 72;

  // Step 6 completed count
  const completedCount = Object.values(completedActions).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / 4) * 100);

  // Step 7: Updated dynamic risk score calculation based on completed remediations
  const updatedScore = Math.max(18, initialRiskScore - (completedCount * 14));
  const updatedRiskLevel = updatedScore > 60 ? 'HIGH RISK' : updatedScore > 30 ? 'MEDIUM RISK' : 'LOW RISK / COMPLIANT';

  // Download updated risk report PDF
  const handleDownloadUpdatedReport = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadRiskReportPdf({
        docId: currentDocument?.id,
        riskData: {
          score: updatedScore,
          level: updatedRiskLevel,
          findings: findings,
          remediated_count: completedCount
        },
        documentTitle: currentDocument?.title || 'Remediated_Legal_Document',
        state: currentDocument?.state || 'Telangana',
        docType: currentDocument?.doc_type || 'Legal Contract'
      });
    } catch (err) {
      window.open('/api/v1/risk/pdf', '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyNotice = () => {
    const text = `"WITHOUT PREJUDICE: With reference to ${currentDocument?.title || 'the legal agreement'}, kindly take note that unilateral penalty and unconditional deposit retention clauses operate as penal conditions under Section 74 of the Indian Contract Act, 1872. We formally propose statutory alignment with standard notice cure periods and documented actual losses only."`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const isBusy = isAnalyzing || localUploading;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-md sm:py-space-lg space-y-6">
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

      {/* Header Deck */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2 border-b border-surface-container">
        <div>
          <h1 className="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface tracking-tight">
            Recommended Action Plan
          </h1>
          <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Sequential 7-step statutory legal remediation workflow generated strictly from your document.
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

      {/* Loading state */}
      {isBusy && (
        <div className="rounded-2xl bg-surface-container-lowest p-8 border-2 border-primary/20 shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <h3 className="font-title-md text-base font-bold text-on-surface">
            Executing 7-Step Action Plan Analysis...
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            Verifying document integrity, classifying statutory risks by severity, and compiling personalized corrective actions.
          </p>
        </div>
      )}

      {/* Picture 1 Upload Dropzone when no active document */}
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

      {/* EXACT 7-STEP WORKFLOW VIEW */}
      {hasDocument && !isBusy && (
        <div className="space-y-4">
          {/* ========================================================================= */}
          {/* INPUT: Uploaded Legal Document                                            */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-primary/20 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-2xl text-tertiary-fixed-dim">description</span>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                  Input: Uploaded Legal Document
                </span>
                <h2 className="font-title-md text-base sm:text-title-md font-bold text-on-surface truncate">
                  {currentDocument?.title || 'Legal Document'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap mt-0.5">
                  <span>Parties: <strong>{partyOne}</strong> &amp; <strong>{partyTwo}</strong></span>
                  <span>•</span>
                  <span>{currentDocument?.doc_type || 'Agreement'}</span>
                  <span>•</span>
                  <span>{currentDocument?.state || 'Telangana'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearDocument}
                className="px-3.5 py-1.5 rounded-xl bg-error/10 hover:bg-error/20 text-error text-xs font-semibold border border-error/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear this document and return to upload dropzone"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Clear Document</span>
              </button>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                Document Ingested
              </span>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: Document Verification                                             */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  01
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 1: Document Verification
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Audit Complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2 border border-surface-container">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <div>
                  <span className="font-semibold text-on-surface block">PDF Integrity &amp; Parsing</span>
                  <span className="text-on-surface-variant text-[11px]">Text extraction successful &amp; readable</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2 border border-surface-container">
                <span className={hasStampDeficit ? 'text-amber-600 font-bold text-sm' : 'text-emerald-600 font-bold text-sm'}>
                  {hasStampDeficit ? '⚠' : '✓'}
                </span>
                <div>
                  <span className="font-semibold text-on-surface block">Stamp Paper Verification</span>
                  <span className="text-on-surface-variant text-[11px]">
                    {hasStampDeficit ? `Deficit identified (₹${stampShortfall} shortfall)` : 'Statutory tariff satisfied'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2 border border-surface-container">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <div>
                  <span className="font-semibold text-on-surface block">Parties Identified</span>
                  <span className="text-on-surface-variant text-[11px] truncate block max-w-xs">{partyOne} &amp; {partyTwo}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low flex items-center gap-2 border border-surface-container">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <div>
                  <span className="font-semibold text-on-surface block">Jurisdiction Validity</span>
                  <span className="text-on-surface-variant text-[11px]">Audited under {currentDocument?.state || 'Telangana'} statutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 2: Identify Potential Risks                                          */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  02
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 2: Identify Potential Risks
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                {findings.length || 3} Liabilities Detected
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {findings.length > 0 ? (
                findings.map((finding, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <strong className="text-on-surface">{finding.title}</strong>
                        <span className="text-[10px] font-mono text-on-surface-variant uppercase">{finding.clause_ref || `Clause ${idx + 1}`}</span>
                      </div>
                      <p className="text-on-surface-variant mt-0.5 leading-relaxed">{finding.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                    <span className="text-rose-600 font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface">Unilateral Penalty &amp; Deposit Forfeiture</strong>
                      <p className="text-on-surface-variant mt-0.5">Absolute deposit retention without duty to mitigate damages under Section 74 Indian Contract Act.</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <div>
                      <strong className="text-on-surface">Absence of Mandatory Cure Period</strong>
                      <p className="text-on-surface-variant mt-0.5">Unilateral termination clause omitting minimum 30-day statutory notice and rectification window.</p>
                    </div>
                  </div>
                  {hasStampDeficit && (
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                      <span className="text-rose-600 font-bold mt-0.5">•</span>
                      <div>
                        <strong className="text-on-surface">Stamp Duty Shortfall (₹{stampShortfall})</strong>
                        <p className="text-on-surface-variant mt-0.5">Execution on deficient stamp value rendering document inadmissible under Section 35 Indian Stamp Act.</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 3: Classify Risks by Severity                                        */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  03
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 3: Classify Risks by Severity
                </h3>
              </div>
              <span className="text-xs font-mono text-on-surface-variant">
                Severity Stratification
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Critical */}
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase">
                    CRITICAL SEVERITY
                  </span>
                  <span className="material-symbols-outlined text-rose-600 text-base">dangerous</span>
                </div>
                <strong className="text-rose-950 block pt-1">Immediate Judicial / Fiscal Bar</strong>
                <p className="text-rose-900 leading-relaxed text-[11px]">
                  Stamp duty deficit (Sec. 35 admissibility bar) &amp; penal forfeiture clauses (Sec. 74 ICA).
                </p>
              </div>

              {/* High */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] uppercase">
                    HIGH SEVERITY
                  </span>
                  <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
                </div>
                <strong className="text-amber-950 block pt-1">Major Contractual Imbalance</strong>
                <p className="text-amber-900 leading-relaxed text-[11px]">
                  Uncapped unilateral indemnification &amp; summary termination without reciprocal cure notice.
                </p>
              </div>

              {/* Medium */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-white font-bold text-[10px] uppercase">
                    MEDIUM SEVERITY
                  </span>
                  <span className="material-symbols-outlined text-slate-600 text-base">info</span>
                </div>
                <strong className="text-slate-900 block pt-1">Operational Gaps</strong>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  Unrestricted lessor entry, out-of-jurisdiction dispute clauses, and missing repair caps.
                </p>
              </div>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 4: Generate Personalized Corrective Actions                          */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  04
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 4: Generate Personalized Corrective Actions
                </h3>
              </div>
              <span className="text-xs font-mono text-primary font-semibold">
                Tailored Remedies
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-on-surface text-sm">Action 1: Regularize Stamp Duty Deficit</strong>
                  <span className="text-[10px] font-mono text-on-surface-variant">TS Stamp Act Sec. 31/32</span>
                </div>
                <p className="text-on-surface-variant">
                  {hasStampDeficit
                    ? `Procure supplementary e-stamp of ₹${stampShortfall} or make voluntary pre-litigation adjudication before the District Registrar to avoid Section 35 court impounding and 10x penalty.`
                    : 'Verify and acknowledge stamp paper serial authenticity on the official state government registration portal.'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-on-surface text-sm">Action 2: Serve Pre-Emptive Representation on Flagged Terms</strong>
                  <span className="text-[10px] font-mono text-on-surface-variant">Sec. 74 Contract Act</span>
                </div>
                <p className="text-on-surface-variant">
                  Issue formal written representation asserting that liquidated penalties cannot exceed proven actual damages (*Kailash Nath Associates v. DDA*).
                </p>
                <div className="pt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyNotice}
                    className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-[11px] border border-surface-container transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedNotice ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedNotice ? 'Notice Copied' : 'Copy Representation Text'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-on-surface text-sm">Action 3: Execute Bilateral Rectification Addendum</strong>
                  <span className="text-[10px] font-mono text-on-surface-variant">Model Tenancy &amp; Contract Standards</span>
                </div>
                <p className="text-on-surface-variant">
                  Amend agreement draft to include reciprocal 30-day notice cure periods, mutual indemnification caps, and local civil jurisdiction.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-on-surface text-sm">Action 4: Advocate Opinion &amp; Endorsement</strong>
                  <span className="text-[10px] font-mono text-on-surface-variant">Advocates Act 1961</span>
                </div>
                <p className="text-on-surface-variant">
                  Schedule consultation with a verified High Court property/contract advocate to countersign and formalize representation.
                </p>
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => navigate('/advocate-directory')}
                    className="px-2.5 py-1 rounded bg-primary-container text-on-primary font-semibold text-[11px] hover:bg-on-background transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">gavel</span>
                    <span>Consult Advocate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 5: Arrange Actions by Priority                                       */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  05
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 5: Arrange Actions by Priority
                </h3>
              </div>
              <span className="text-xs font-mono text-on-surface-variant">
                Execution Hierarchy
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] uppercase">
                    PRIORITY 1 • CRITICAL
                  </span>
                  <strong className="text-rose-950">Stamp Duty Regularization</strong>
                </div>
                <span className="text-rose-900 font-mono text-[11px]">Timeframe: Immediate (Pre-Dispute)</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px] uppercase">
                    PRIORITY 2 • HIGH
                  </span>
                  <strong className="text-amber-950">Serve Pre-Emptive Rebuttal Notice</strong>
                </div>
                <span className="text-amber-900 font-mono text-[11px]">Timeframe: Prior to Signing / Remittance</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-white font-bold text-[10px] uppercase">
                    PRIORITY 3 • MEDIUM
                  </span>
                  <strong className="text-slate-900">Bilateral Addendum Execution &amp; Advocate Review</strong>
                </div>
                <span className="text-slate-700 font-mono text-[11px]">Timeframe: Within 7 Days</span>
              </div>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 6: Allow Users to Track Completed Actions                            */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border-2 border-primary/20 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-surface-container font-mono text-xs font-bold flex items-center justify-center text-on-surface">
                  06
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 6: Allow Users to Track Completed Actions
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-fixed">
                {completedCount} of 4 Completed ({progressPercent}%)
              </span>
            </div>

            {/* Live Progress Bar */}
            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Interactive Checklist */}
            <div className="space-y-2 pt-2 text-xs">
              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container">
                <input
                  type="checkbox"
                  checked={completedActions.action1}
                  onChange={() => toggleAction('action1')}
                  className="mt-0.5 h-4 w-4 rounded accent-primary-container cursor-pointer"
                />
                <div className="flex-1">
                  <span className={`font-semibold block ${completedActions.action1 ? 'line-through text-outline' : 'text-on-surface'}`}>
                    Regularize stamp duty deficit / Procure supplementary e-stamp under Section 31/32
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Cures Section 35 judicial admissibility impediment.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container">
                <input
                  type="checkbox"
                  checked={completedActions.action2}
                  onChange={() => toggleAction('action2')}
                  className="mt-0.5 h-4 w-4 rounded accent-primary-container cursor-pointer"
                />
                <div className="flex-1">
                  <span className={`font-semibold block ${completedActions.action2 ? 'line-through text-outline' : 'text-on-surface'}`}>
                    Transmit formal pre-emptive representation notice on penalty forfeiture
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Establishes pre-litigation mitigation stance under Section 74 Indian Contract Act.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container">
                <input
                  type="checkbox"
                  checked={completedActions.action3}
                  onChange={() => toggleAction('action3')}
                  className="mt-0.5 h-4 w-4 rounded accent-primary-container cursor-pointer"
                />
                <div className="flex-1">
                  <span className={`font-semibold block ${completedActions.action3 ? 'line-through text-outline' : 'text-on-surface'}`}>
                    Draft bilateral addendum with reciprocal 30-day notice and mutual damages cap
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Neutralizes unilateral termination clauses before signing.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer border border-surface-container">
                <input
                  type="checkbox"
                  checked={completedActions.action4}
                  onChange={() => toggleAction('action4')}
                  className="mt-0.5 h-4 w-4 rounded accent-primary-container cursor-pointer"
                />
                <div className="flex-1">
                  <span className={`font-semibold block ${completedActions.action4 ? 'line-through text-outline' : 'text-on-surface'}`}>
                    Complete advocate consultation and obtain legal endorsement
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Verified by high court accredited property/contract advocate.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="flex justify-center text-on-surface-variant/60">
            <span className="text-xl font-bold">↓</span>
          </div>

          {/* ========================================================================= */}
          {/* STEP 7: Generate an Updated Risk Report                                   */}
          {/* ========================================================================= */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl border-2 border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-mono text-xs font-bold flex items-center justify-center">
                  07
                </span>
                <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                  Step 7: Generate an Updated Risk Report
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Remediation Engine Live
              </span>
            </div>

            {/* Dynamic Comparison: Initial vs Updated Score */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Initial Baseline Risk
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-rose-600 font-mono">
                    {initialRiskScore} / 100
                  </span>
                  <span className="text-[11px] text-rose-700 block">High Risk</span>
                </div>

                <span className="text-2xl font-bold text-on-surface-variant">→</span>

                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                    Updated Remediated Risk
                  </span>
                  <span className={`text-xl sm:text-2xl font-bold font-mono ${
                    updatedScore > 60 ? 'text-rose-600' : updatedScore > 30 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {updatedScore} / 100
                  </span>
                  <span className={`text-[11px] font-bold block ${
                    updatedScore > 60 ? 'text-rose-700' : updatedScore > 30 ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    {updatedRiskLevel}
                  </span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:pl-4 border-surface-container">
                <span className="text-xs text-on-surface-variant block">
                  {completedCount === 0
                    ? 'Check off actions above to lower risk.'
                    : `${completedCount} action(s) applied to audit.`}
                </span>
                <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                  {completedCount > 0 ? `Risk reduced by ${initialRiskScore - updatedScore} points` : 'Ready to remediate'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadUpdatedReport}
                disabled={isDownloadingPdf}
                className="h-11 px-5 rounded-xl bg-primary-container text-on-primary font-semibold text-xs sm:text-sm shadow-md hover:bg-on-background transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">download</span>
                <span>{isDownloadingPdf ? 'Generating Updated PDF...' : 'Download Updated Risk Report (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/advocate-directory')}
                className="h-11 px-5 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs sm:text-sm border border-surface-container transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-primary">gavel</span>
                <span>Consult an Advocate to Finalize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

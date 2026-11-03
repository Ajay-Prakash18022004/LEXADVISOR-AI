import React, { useState, useRef } from 'react';
import { useDocument } from '../context/DocumentContext';

export default function DocumentAnalysis() {
  const { currentDocument, uploadAndAnalyze, isAnalyzing, activeJurisdiction, clearDocument } = useDocument();

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [localUploading, setLocalUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [useSample, setUseSample] = useState(false);
  const [refreshToast, setRefreshToast] = useState(null);

  const handleClearDocument = () => {
    setSelectedFile(null);
    setUploadError(null);
    setShowRawText(false);
    setUseSample(false);
    if (clearDocument) clearDocument();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setRefreshToast('Document cleared. Ready to upload new document.');
    setTimeout(() => setRefreshToast(null), 3000);
  };

  const handleResetChat = () => {
    handleClearDocument();
  };

  const fileInputRef = useRef(null);

  // Check if we have an active, user-uploaded document or if user opted into sample preview
  const hasDocument = Boolean(currentDocument && (!currentDocument.is_demo_sample || useSample) && currentDocument.summary);
  const isSample = Boolean(currentDocument?.is_demo_sample);

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
      setUploadError('Please select a PDF, DOCX, TXT, MD, or image document.');
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
      setUploadError(err.message || 'Failed to analyze document. Please try again.');
    } finally {
      setLocalUploading(false);
    }
  };

  const handleCopySummary = () => {
    if (!currentDocument?.summary) return;
    navigator.clipboard.writeText(currentDocument.summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  // Helper to render markdown-style executive summary with clean typography
  const renderSummaryContent = (summaryText) => {
    if (!summaryText) return null;

    const lines = summaryText.split('\n');
    return (
      <div className="space-y-3 text-sm text-on-surface leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;

          // Heading 3: ### Title
          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="font-title-md text-base sm:text-title-md font-bold text-on-surface pt-3 pb-1 border-b border-surface-container flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">bookmark</span>
                <span>{trimmed.replace('### ', '')}</span>
              </h3>
            );
          }

          // Heading 4 / Subtitle: **Title**
          if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
            return (
              <h4 key={idx} className="font-bold text-on-surface text-sm sm:text-base mt-2.5 text-primary">
                {trimmed.slice(2, -2)}
              </h4>
            );
          }

          // Bullet point: * or -
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const content = trimmed.slice(2);
            const parts = content.split(/(\*\*[^*]+\*\*)/g);
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0"></span>
                <span className="flex-1 text-on-surface">
                  {parts.map((p, i) => {
                    if (p.startsWith('**') && p.endsWith('**')) {
                      return <strong key={i} className="font-bold text-on-surface">{p.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{p}</span>;
                  })}
                </span>
              </div>
            );
          }

          // Regular paragraph
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={idx} className="text-on-surface leading-relaxed">
              {parts.map((p, i) => {
                if (p.startsWith('**') && p.endsWith('**')) {
                  return <strong key={i} className="font-bold text-on-surface">{p.slice(2, -2)}</strong>;
                }
                return <span key={i}>{p}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  const isBusy = isAnalyzing || localUploading;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-space-md lg:px-space-xl py-space-md sm:py-space-lg space-y-space-lg">
      {/* Toast Alert */}
      {refreshToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-on-tertiary-container animate-bounce">
          <span className="material-symbols-outlined text-on-tertiary-container">sync</span>
          <span className="font-body-sm text-sm font-semibold">{refreshToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container/60">
        <div>
          <h1 className="font-headline-md sm:font-headline-lg text-xl sm:text-headline-lg text-on-surface font-bold tracking-tight">
            AI Document Analysis
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            Exact, plain-English legal summary generated strictly based on your attached document.
          </p>
        </div>

        {/* Clear Document Action when document is active */}
        {hasDocument && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Loading State Overlay */}
      {isBusy && (
        <div className="rounded-2xl bg-surface-container-lowest p-8 border-2 border-primary/20 shadow-md flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <h3 className="font-title-md text-base font-bold text-on-surface">
            Analyzing {selectedFile?.name || 'Document'}...
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md">
            Our AI engine is extracting clauses, identifying parties, parsing obligations, and generating an exact legal summary.
          </p>
        </div>
      )}

      {/* Error Message */}
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

      {/* Main Document Summary Workspace */}
      {hasDocument && !isBusy ? (
        <div className="space-y-space-md">
          {/* Active Document Info Strip */}
          <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">description</span>
              </div>
              <div className="min-w-0">
                <h2 className="font-title-md text-base sm:text-title-md font-bold text-on-surface truncate">
                  {currentDocument.title || currentDocument.original_name || 'Attached Document'}
                </h2>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant flex-wrap mt-0.5">
                  {currentDocument.doc_type && (
                    <span className="px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">
                      {currentDocument.doc_type}
                    </span>
                  )}
                  {currentDocument.file_size && <span>{currentDocument.file_size}</span>}
                  <span>•</span>
                  <span>Uploaded {currentDocument.upload_date || 'Recently'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearDocument}
                className="px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-semibold border border-error/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear this document and return to upload dropzone"
              >
                <span className="material-symbols-outlined text-sm">close</span>
                <span>Clear Document</span>
              </button>
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold border border-surface-container flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy summary to clipboard"
              >
                <span className="material-symbols-outlined text-sm">
                  {copiedSummary ? 'check' : 'content_copy'}
                </span>
                <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
              </button>

              {currentDocument.extracted_text && (
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    showRawText
                      ? 'bg-secondary-container text-on-secondary-fixed border-secondary/30'
                      : 'bg-surface-container-low hover:bg-surface-container text-on-surface border-surface-container'
                  }`}
                  title="Toggle extracted raw text from document"
                >
                  <span className="material-symbols-outlined text-sm">article</span>
                  <span>{showRawText ? 'Hide Document Text' : 'View Document Text'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Facts Extracted from this Document Only */}
          {(currentDocument.party_one || currentDocument.party_two || currentDocument.duration || currentDocument.financial_consideration || currentDocument.notice_period) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentDocument.party_one && (
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-xs">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    First Party
                  </span>
                  <span className="font-bold text-sm text-on-surface mt-1 block truncate">
                    {currentDocument.party_one}
                  </span>
                </div>
              )}

              {currentDocument.party_two && (
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-xs">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Second Party
                  </span>
                  <span className="font-bold text-sm text-on-surface mt-1 block truncate">
                    {currentDocument.party_two}
                  </span>
                </div>
              )}

              {currentDocument.duration && currentDocument.duration !== 'As stipulated in contract' && (
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-xs">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Duration / Term
                  </span>
                  <span className="font-bold text-sm text-on-surface mt-1 block truncate">
                    {currentDocument.duration}
                  </span>
                </div>
              )}

              {currentDocument.financial_consideration && currentDocument.financial_consideration !== 'As stipulated in contract' && (
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-xs">
                  <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">
                    Consideration / Rent
                  </span>
                  <span className="font-bold text-sm text-on-surface mt-1 block truncate">
                    {currentDocument.financial_consideration}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* EXACT DOCUMENT SUMMARY (Hero Card) */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-7 border-2 border-surface-container shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-cinzel font-bold text-sm shadow-xs">
                  §
                </div>
                <div>
                  <h3 className="font-title-md text-base sm:text-title-md font-bold text-on-surface">
                    Exact Document Summary
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Generated exclusively from the attached agreement text
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                Verified Analysis
              </span>
            </div>

            {/* Markdown Body */}
            <div className="py-2">
              {renderSummaryContent(currentDocument.summary)}
            </div>
          </div>

          {/* Collapsible Raw Text Inspector */}
          {showRawText && currentDocument.extracted_text && (
            <div className="bg-surface-container-lowest rounded-2xl p-5 sm:p-7 border border-surface-container shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">description</span>
                  <h3 className="font-title-md text-sm sm:text-base font-bold text-on-surface">
                    Extracted Document Text
                  </h3>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  {currentDocument.extracted_text.length} characters
                </span>
              </div>
              <div className="p-4 rounded-xl bg-surface-container-low max-h-96 overflow-y-auto font-mono text-xs text-on-surface leading-relaxed whitespace-pre-wrap select-text border border-surface-container">
                {currentDocument.extracted_text}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Upload Dropzone (shown if no document or if user wants to analyze a file) */}
      {(!hasDocument && !isBusy) && (
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
    </div>
  );
}

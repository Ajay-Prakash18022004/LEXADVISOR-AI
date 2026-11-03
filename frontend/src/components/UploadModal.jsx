import React, { useState, useRef } from 'react';
import { useDocument } from '../context/DocumentContext';
import { useNavigate } from 'react-router-dom';

export default function UploadModal({ isOpen, onClose }) {
  const { uploadAndAnalyze, activeJurisdiction } = useDocument();
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('general_agreement');
  const [state, setState] = useState(activeJurisdiction === 'AP' ? 'Andhra Pradesh' : 'Telangana');
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.txt', '.md'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setUploadError('Invalid format. Please upload a PDF, DOCX, TXT, MD, JPG, or PNG document.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File exceeds 25 MB limit.');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select or drop a legal instrument first.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const numRent = parseFloat(rent);
      const numDeposit = parseFloat(deposit);
      const consideration = (!isNaN(numRent) ? numRent * 11 : 0) + (!isNaN(numDeposit) ? numDeposit : 0);

      await uploadAndAnalyze(selectedFile, {
        doc_type: docType,
        state: state,
        consideration_amount: consideration > 0 ? consideration : undefined
      });

      setIsUploading(false);
      onClose();
      navigate('/document-analysis');
    } catch (err) {
      setUploadError(err.message || 'Failed to process document. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-xl w-full p-space-xl border border-surface-container relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-space-md border-b border-surface-container">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">cloud_upload</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">Ingest Legal Instrument</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">Statutory Stamp & Risk Intelligence Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Dropzone Area */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-space-md p-space-lg rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-primary-container bg-surface-container-low/80 scale-[1.01]'
              : selectedFile
              ? 'border-secondary bg-surface-container-low/40'
              : 'border-surface-container-high hover:border-outline hover:bg-surface-container-low/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt,.md,.jpg,.jpeg,.png"
            className="hidden"
          />

          {selectedFile ? (
            <div className="flex items-center gap-space-sm text-left">
              <span className="material-symbols-outlined text-3xl text-secondary">check_circle</span>
              <div>
                <p className="font-body-sm text-body-sm font-bold text-on-surface truncate max-w-xs">{selectedFile.name}</p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for statutory parsing
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary-container mb-space-xs">
                <span className="material-symbols-outlined text-2xl">upload_file</span>
              </div>
              <p className="font-body-sm text-body-sm font-semibold text-on-surface">
                Click to browse or drop your lease deed / stamp paper here
              </p>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                Supports PDF, DOCX, JPG, PNG up to 25 MB
              </p>
            </>
          )}
        </div>

        {uploadError && (
          <div className="mt-space-sm p-space-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Config Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-space-md text-left">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold block mb-1">
              Instrument Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-surface-container"
            >
              <option value="general_agreement">General Agreement / Contract (Auto-Detect)</option>
              <option value="residential_tenancy">Residential Tenancy / Lease</option>
              <option value="commercial_lease">Commercial Lease Deed</option>
              <option value="service_agreement">Service Agreement / Vendor Contract</option>
              <option value="employment_agreement">Employment Agreement</option>
              <option value="nda_non_disclosure">Non-Disclosure Agreement (NDA)</option>
              <option value="sale_deed">Sale Deed / Property Transfer</option>
              <option value="power_of_attorney">Power of Attorney / Affidavit</option>
            </select>
          </div>

          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold block mb-1">
              Jurisdiction State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-surface-container"
            >
              <option value="Telangana">Telangana (TS Stamp Act)</option>
              <option value="Andhra Pradesh">Andhra Pradesh (AP Stamp Rules)</option>
            </select>
          </div>

          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold block mb-1">
              Monthly Rent (₹)
            </label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              placeholder="35000"
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-surface-container"
            />
          </div>

          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant uppercase font-semibold block mb-1">
              Security Deposit (₹)
            </label>
            <input
              type="number"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              placeholder="150000"
              className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:bg-surface-container-lowest border border-surface-container"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-space-sm pt-space-lg mt-space-md border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-space-md py-2.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body-sm text-body-sm font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isUploading || !selectedFile}
            className="px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary hover:bg-on-background transition-colors font-body-sm text-body-sm font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                <span>Executing Audit Pipeline...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Audit & Extract Dossier</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


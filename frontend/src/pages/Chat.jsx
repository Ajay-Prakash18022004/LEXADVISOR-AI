import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import { getDocuments } from '../api/documents';
import { getProactiveBrief } from '../api/chat';
import { FileText, Sparkles, Upload, FileCode, CheckCircle2 } from 'lucide-react';

const SAMPLES = {
  ts_rental: {
    id: null,
    filename: 'Telangana_Residential_Tenancy_Agreement.txt',
    doc_type: 'rental_agreement',
    state: 'TS',
    text: `GOVERNMENT OF TELANGANA
e-Stamp Certificate No: IN-TS20268894103251
Certificate Issued Date: 12/03/2026
Purchased By: M/s Sri Rama Krishna Traders
Vendor: Stock Holding Corporation of India Ltd (SHCIL Hyderabad)
Description of Document: Article 49 Tenancy Agreement
Stamp Duty Amount: Rs. 100/-

RESIDENTIAL RENTAL AGREEMENT
This Rental Agreement is made on 15th March 2026 at Hyderabad, Telangana between:
1. Sri K. V. Raman, residing at Plot 45, Jubilee Hills, Hyderabad (hereinafter called the LESSOR); and
2. M/s Sri Rama Krishna Traders, rep by its Managing Partner Sri R. Krishna (hereinafter called the LESSEE).

1. PREMISES: The Lessor agrees to let out Residential Flat No. 302, Green Meadows, Gachibowli, Hyderabad.
2. TERM & RENT: Tenure of 11 months commencing 15/03/2026. Monthly rent of Rs. 35,000/- payable on or before 5th of each calendar month.
3. SECURITY DEPOSIT: Lessee has deposited interest-free refundable deposit of Rs. 1,00,000/-.
4. TERMINATION: Either party may terminate by giving 1 month prior written notice.
5. INDEMNITY: Lessee shall indemnify Lessor against damages caused by willful negligence.
6. JURISDICTION: Subject to exclusive jurisdiction of civil courts at Hyderabad, Telangana.`
  },
  commercial_lease: {
    id: null,
    filename: 'Shamshabad_Commercial_Warehouse_Lease.txt',
    doc_type: 'commercial_lease',
    state: 'TS',
    text: `GOVERNMENT OF TELANGANA
Non-Judicial Stamp Paper
Serial No: TS-2026-004128
Denomination: Rs. 20/-
Purchased By: Unknown Third Party Broker
Purchase Date: 20/04/2026

COMMERCIAL LEASE AGREEMENT
Executed at Hyderabad on 10th January 2026 between Prime Properties Ltd (Lessor) and Zenith Logistics (Lessee).

1. PREMISES & TERM: Commercial warehouse at Shamshabad for 3 years.
2. RENT: Rs. 1,50,000/- per month.
3. LOCK-IN PERIOD: 36 months strict lock-in. If Lessee vacates early, entire 36 months rent is immediately forfeited as penalty.
4. UNILATERAL INDEMNITY: Lessee shall unconditionally indemnify, protect, defend, and hold harmless Lessor from any claims, disputes, tax liabilities, and attorney fees without any limitation or monetary ceiling.
5. TERMINATION: Lessor reserves the sole right to terminate immediately without notice or assigning reasons. Lessee has no right of early exit.
6. DISPUTE RESOLUTION: All disputes shall be litigated exclusively before the High Court of Delhi.`
  },
  ap_service: {
    id: null,
    filename: 'AP_Master_Services_Agreement.txt',
    doc_type: 'service_agreement',
    state: 'AP',
    text: `GOVERNMENT OF ANDHRA PRADESH
e-Stamp Certificate No: IN-AP20267710923418
Certificate Issued Date: 05/02/2026
Purchased By: Amaravati Tech Innovations Pvt Ltd
Vendor: AP Stamps & Registration Department / SHCIL Visakhapatnam
Denomination: Rs. 100/-

MASTER SERVICES AGREEMENT
This Agreement executed on 10/02/2026 at Visakhapatnam, Andhra Pradesh between:
1. Amaravati Tech Innovations Pvt Ltd, Visakhapatnam (Client); and
2. Coastal Cloud Solutions LLP, Vijayawada (Service Provider).

1. SCOPE OF SERVICES: Cloud application development and automated data ingestion pipelines.
2. PAYMENT TERMS: Monthly milestones against GST invoice payable within 30 days.
3. INTELLECTUAL PROPERTY: All custom code shall be work-for-hire assigned to Client.
4. LIMITATION OF LIABILITY: Aggregate liability capped at 6 months fees paid.
5. DISPUTE RESOLUTION: Arbitration seated in Visakhapatnam under Arbitration & Conciliation Act 1996.
6. GOVERNING LAW: Governed by the laws of India and civil courts at Visakhapatnam, Andhra Pradesh.`
  }
};

export default function Chat() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [activeDoc, setActiveDoc] = useState(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load existing user documents on mount
  useEffect(() => {
    async function loadDocs() {
      try {
        const list = await getDocuments();
        setDocuments(list || []);
        // If documents exist, auto-select the first one
        if (list && list.length > 0) {
          selectDocumentById(list[0].id, list);
        } else {
          // Auto-load TS rental sample so user immediately experiences grounded proactive analysis
          loadSample('ts_rental');
        }
      } catch (err) {
        console.error('Failed to load user documents:', err);
        loadSample('ts_rental');
      }
    }
    loadDocs();
  }, []);

  const selectDocumentById = async (id, docList = documents) => {
    setSelectedDocId(id);
    setShowCustomInput(false);
    const found = docList.find((d) => String(d.id) === String(id));
    if (!found) return;

    setLoadingBrief(true);
    try {
      const brief = await getProactiveBrief({ documentId: found.id, documentText: found.extracted_text });
      setActiveDoc({
        id: found.id,
        filename: found.filename,
        docType: found.doc_type,
        state: found.state,
        text: found.extracted_text,
        brief
      });
    } catch (err) {
      console.error('Failed to load proactive brief:', err);
      setActiveDoc({
        id: found.id,
        filename: found.filename,
        docType: found.doc_type,
        state: found.state,
        text: found.extracted_text,
        brief: null
      });
    } finally {
      setLoadingBrief(false);
    }
  };

  const loadSample = async (sampleKey) => {
    const s = SAMPLES[sampleKey];
    if (!s) return;
    setSelectedDocId(`sample_${sampleKey}`);
    setShowCustomInput(false);
    setLoadingBrief(true);

    try {
      const brief = await getProactiveBrief({ documentId: null, documentText: s.text });
      setActiveDoc({
        id: null,
        filename: s.filename,
        docType: s.doc_type,
        state: s.state,
        text: s.text,
        brief
      });
    } catch (err) {
      console.error('Failed to load sample brief:', err);
      setActiveDoc({
        id: null,
        filename: s.filename,
        docType: s.doc_type,
        state: s.state,
        text: s.text,
        brief: null
      });
    } finally {
      setLoadingBrief(false);
    }
  };

  const handleApplyCustomText = async () => {
    if (!customText.trim()) return;
    setLoadingBrief(true);
    try {
      const brief = await getProactiveBrief({ documentId: null, documentText: customText.trim() });
      setActiveDoc({
        id: null,
        filename: 'Custom_Pasted_Agreement.txt',
        docType: brief.doc_type || 'general_agreement',
        state: brief.state || 'Telangana',
        text: customText.trim(),
        brief
      });
      setShowCustomInput(false);
    } catch (err) {
      console.error('Failed to analyze custom text:', err);
    } finally {
      setLoadingBrief(false);
    }
  };

  return (
    <div>
      {/* Document Context Selector Card */}
      <article style={{ marginBottom: '16px', padding: '16px 20px', border: '1px solid var(--line)', borderRadius: '8px', background: 'var(--card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--green)', fontWeight: 700 }}>
              <Sparkles size={14} />
              Proactive Legal Document Analyser
            </div>
            <h2 style={{ margin: '2px 0 0', fontSize: '1.25rem' }}>
              Active Document Context
            </h2>
          </div>

          {/* Quick Sample Chips */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600 }}>Switch Contract:</span>
            <button
              type="button"
              className="sample-btn"
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', marginTop: 0 }}
              onClick={() => loadSample('ts_rental')}
            >
              TS Residential Tenancy
            </button>
            <button
              type="button"
              className="sample-btn"
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', marginTop: 0 }}
              onClick={() => loadSample('commercial_lease')}
            >
              Commercial Lease (High Risk)
            </button>
            <button
              type="button"
              className="sample-btn"
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', marginTop: 0 }}
              onClick={() => loadSample('ap_service')}
            >
              AP Master Services
            </button>
            <button
              type="button"
              className="sample-btn"
              style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', marginTop: 0, borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => setShowCustomInput(!showCustomInput)}
            >
              {showCustomInput ? 'Close Text Input' : '+ Paste Contract Text'}
            </button>
          </div>
        </div>

        {/* Existing User Documents Dropdown (if user uploaded any) */}
        {documents.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="user-doc-select" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              Your Uploaded Documents:
            </label>
            <select
              id="user-doc-select"
              value={selectedDocId}
              onChange={(e) => selectDocumentById(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.filename} ({d.doc_type || 'Contract'} - {d.state || 'TS'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Text Area Modal/Panel */}
        {showCustomInput && (
          <div style={{ marginTop: '14px', padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--line)' }}>
            <label htmlFor="custom-contract-text" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
              Paste Agreement Clauses or Notice Text for Strict Grounded Analysis:
            </label>
            <textarea
              id="custom-contract-text"
              rows="5"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Paste your agreement text here..."
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="secondary"
                style={{ marginTop: 0, padding: '6px 12px', fontSize: '0.82rem' }}
                onClick={() => setShowCustomInput(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ marginTop: 0, padding: '6px 14px', fontSize: '0.82rem' }}
                onClick={handleApplyCustomText}
                disabled={!customText.trim()}
              >
                Set as Active Document
              </button>
            </div>
          </div>
        )}

        {/* Active Document Indicator Bar */}
        {activeDoc && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ color: '#166534', fontWeight: 600 }}>Active Document:</span>
              <strong style={{ color: '#0f172a' }}>{activeDoc.filename}</strong>
              <span style={{ color: '#64748b' }}>({activeDoc.state} &bull; {activeDoc.docType})</span>
            </div>
            <div style={{ color: '#166534', fontWeight: 500, fontSize: '0.78rem' }}>
              Strict Grounding Enabled &bull; Answers based ONLY on this text
            </div>
          </div>
        )}
      </article>

      {/* Main Chat Window */}
      <ChatWindow activeDoc={activeDoc} loadingBrief={loadingBrief} />
    </div>
  );
}

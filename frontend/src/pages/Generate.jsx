import React, { useState } from 'react';
import client from '../api/client';

export default function Generate() {
  const [activeType, setActiveType] = useState('notice');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Notice Fields
  const [sender, setSender] = useState('Sri R. K. Varma, Hyderabad');
  const [recipient, setRecipient] = useState('M/s Cloud Matrix Pvt Ltd, Bangalore');
  const [disputeType, setDisputeType] = useState('Breach of Tenancy & Unpaid Rent');
  const [amount, setAmount] = useState('Rs. 1,80,000/-');
  const [deadlineDays, setDeadlineDays] = useState(15);
  const [state, setState] = useState('TS');
  const [facts, setFacts] = useState('Tenant failed to pay monthly rent of Rs. 60,000 for 3 consecutive months despite repeated reminders.');

  // Agreement Fields
  const [docType, setDocType] = useState('rental_agreement');
  const [partyOne, setPartyOne] = useState('Sri K. V. Raman (Lessor), Hyderabad');
  const [partyTwo, setPartyTwo] = useState('M/s Krishna Logistics (Lessee), Hyderabad');
  const [details, setDetails] = useState('Monthly rent Rs. 40,000/-, security deposit Rs. 1,20,000/-, tenure 11 months.');

  const handleGenerateNotice = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await client.post('/generate/notice', {
        sender,
        recipient,
        dispute_type: disputeType,
        facts,
        amount,
        deadline_days: parseInt(deadlineDays) || 15,
        state
      });
      setResult(res.data);
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAgreement = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await client.post('/generate/document', {
        doc_type: docType,
        party_one: partyOne,
        party_two: partyTwo,
        details,
        state
      });
      setResult(res.data);
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <article>
        <h2>AI Legal Document & Notice Drafter</h2>
        <p className="note">
          Draft legally enforceable agreements and statutory demand notices conforming to Indian law, with automatic ReportLab PDF generation.
        </p>

        <div className="btn-group" style={{ marginBottom: '16px' }}>
          <button
            type="button"
            className={activeType === 'notice' ? '' : 'secondary'}
            onClick={() => { setActiveType('notice'); setResult(null); }}
          >
            Draft Legal Notice
          </button>
          <button
            type="button"
            className={activeType === 'agreement' ? '' : 'secondary'}
            onClick={() => { setActiveType('agreement'); setResult(null); }}
          >
            Draft Binding Agreement
          </button>
        </div>

        {activeType === 'notice' ? (
          <form onSubmit={handleGenerateNotice}>
            <div className="form-row">
              <div>
                <label className="note">Sender / Client</label>
                <input type="text" value={sender} onChange={(e) => setSender(e.target.value)} required />
              </div>
              <div>
                <label className="note">Recipient / Defaulting Party</label>
                <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="note">Dispute Category</label>
                <input type="text" value={disputeType} onChange={(e) => setDisputeType(e.target.value)} required />
              </div>
              <div>
                <label className="note">Claim Amount</label>
                <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="note">Notice Period (Days)</label>
                <input type="number" value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)} />
              </div>
              <div>
                <label className="note">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="TS">Telangana</option>
                  <option value="AP">Andhra Pradesh</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label className="note">Default Facts & Covenants</label>
              <textarea rows="3" value={facts} onChange={(e) => setFacts(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Drafting Legal Notice...' : 'Draft Formal RPAD Notice'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleGenerateAgreement}>
            <div className="form-row">
              <div>
                <label className="note">Document Type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                  <option value="rental_agreement">Rental Agreement</option>
                  <option value="commercial_lease">Commercial Lease Deed</option>
                  <option value="service_agreement">Services Agreement</option>
                  <option value="nda_non_disclosure">NDA</option>
                </select>
              </div>
              <div>
                <label className="note">State</label>
                <select value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="TS">Telangana</option>
                  <option value="AP">Andhra Pradesh</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="note">First Party</label>
                <input type="text" value={partyOne} onChange={(e) => setPartyOne(e.target.value)} required />
              </div>
              <div>
                <label className="note">Second Party</label>
                <input type="text" value={partyTwo} onChange={(e) => setPartyTwo(e.target.value)} required />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label className="note">Key Commercial & Performance Terms</label>
              <textarea rows="3" value={details} onChange={(e) => setDetails(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Generating Agreement...' : 'Draft Binding Agreement'}
            </button>
          </form>
        )}
      </article>

      {result && (
        <article style={{ marginTop: '20px' }}>
          <h2>{result.title}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '6px', maxHeight: '350px', overflowY: 'auto', fontFamily: 'inherit', fontSize: '0.92rem' }}>
            {result.content}
          </pre>
          <div style={{ marginTop: '14px' }}>
            <a href={`http://localhost:8000${result.pdf_download_url}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <button type="button">Download Generated PDF</button>
            </a>
          </div>
        </article>
      )}
    </div>
  );
}

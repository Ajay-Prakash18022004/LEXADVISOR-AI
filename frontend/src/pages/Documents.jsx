import React, { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../api/documents';
import { runAnalysisForDocId } from '../api/analysis';
import FileUpload from '../components/FileUpload';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('rental_agreement');
  const [state, setState] = useState('TS');
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setStatus('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setStatus('Uploading and parsing document into ChromaDB...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('doc_type', docType);
    formData.append('state', state);

    try {
      await uploadDocument(formData);
      setSelectedFile(null);
      setStatus('Document uploaded successfully.');
      fetchDocs();
    } catch (err) {
      setStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this document?')) {
      await deleteDocument(id);
      fetchDocs();
    }
  };

  const handleRunAnalysis = async (id) => {
    setStatus(`Running full pipeline on Document #${id}...`);
    try {
      await runAnalysisForDocId(id);
      setStatus(`Analysis complete for Document #${id}.`);
      fetchDocs();
    } catch (err) {
      setStatus(`Analysis error: ${err.message}`);
    }
  };

  return (
    <div>
      <article>
        <h2>Document Repository</h2>
        <p className="note">
          Upload PDF or DOCX files for secure RAG vector storage in ChromaDB and automated legal analysis.
        </p>

        <form onSubmit={handleUpload}>
          <FileUpload onFileSelect={setSelectedFile} selectedFile={selectedFile} />
          
          <div className="form-row">
            <div>
              <label className="note">State</label>
              <select value={state} onChange={(e) => setState(e.target.value)}>
                <option value="TS">Telangana</option>
                <option value="AP">Andhra Pradesh</option>
              </select>
            </div>
            <div>
              <label className="note">Document Category</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}>
                <option value="rental_agreement">Rental Agreement</option>
                <option value="commercial_lease">Commercial Lease</option>
                <option value="service_agreement">Services Agreement</option>
                <option value="employment_agreement">Employment Agreement</option>
                <option value="general_agreement">General Contract</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={uploading}>
            {uploading ? 'Processing & Indexing...' : 'Upload & Store in ChromaDB'}
          </button>
        </form>

        {status && <div className="note" style={{ marginTop: '10px' }}>{status}</div>}
      </article>

      <article style={{ marginTop: '20px' }}>
        <h2>Stored Documents ({docs.length})</h2>
        {loading ? (
          <p className="note">Loading repository...</p>
        ) : docs.length === 0 ? (
          <p className="note">No documents uploaded yet. Upload your first document above.</p>
        ) : (
          <div style={{ marginTop: '14px' }}>
            {docs.map((doc) => (
              <div key={doc.id} className="check" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{doc.filename}</strong>
                  <div className="note">
                    Type: {doc.doc_type} &bull; State: {doc.state} &bull; Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {doc.has_stamp_report && <span className="badge badge-pass">Stamp Audited</span>}
                    {doc.has_risk_report && <span className="badge badge-warning">Risks Analyzed</span>}
                    {doc.has_action_plan && <span className="badge badge-pass">Action Plan Ready</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: 0 }}
                    onClick={() => handleRunAnalysis(doc.id)}
                  >
                    Run Audit
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: 0, color: 'var(--red)' }}
                    onClick={() => handleDelete(doc.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}

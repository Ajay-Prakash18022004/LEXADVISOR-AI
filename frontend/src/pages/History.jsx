import React, { useState, useEffect } from 'react';
import { getCustomerHistory, deleteHistoryDoc } from '../api/analysis';
import StampReportCard from '../components/StampReportCard';
import RiskReport from '../components/RiskReport';
import ActionPlan from '../components/ActionPlan';

export default function History() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeReportDoc, setActiveReportDoc] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getCustomerHistory();
      setHistoryItems(data);
    } catch (err) {
      console.error(err);
      setStatusMsg('Failed to load analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleViewReport = (item) => {
    if (item.report_data) {
      setSelectedReport(item.report_data);
      setActiveReportDoc(item);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } else {
      alert('Detailed cached report is not available for this record.');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this analysis record from customer history?')) return;
    try {
      await deleteHistoryDoc(docId);
      if (activeReportDoc && activeReportDoc.id === docId) {
        setSelectedReport(null);
        setActiveReportDoc(null);
      }
      fetchHistory();
      setStatusMsg('Analysis history record deleted.');
    } catch (err) {
      alert(`Error deleting record: ${err.message}`);
    }
  };

  return (
    <div>
      <article>
        <h2>Customer Document Analysis History</h2>
        <p className="note">
          Review past audits for common citizens and clients. View instant risk scores, stamp paper validity verdicts, deficit penalties, and reload the full advisory report anytime.
        </p>

        {statusMsg && (
          <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '6px', fontSize: '0.85rem', color: '#166534' }}>
            {statusMsg}
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          {loading ? (
            <p className="note">Loading customer audit logs...</p>
          ) : historyItems.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <p className="note">No past analyses found. Run an audit on the Decision Hub to see history saved here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {historyItems.map((item) => {
                const isSelected = activeReportDoc && activeReportDoc.id === item.id;
                const riskLevel = item.risk_level || (item.risk_score > 60 ? 'HIGH' : item.risk_score > 35 ? 'MEDIUM' : 'LOW');

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid var(--line)',
                      background: isSelected ? '#f0f9ff' : '#ffffff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{item.filename}</strong>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background:
                              riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
                                ? '#fee2e2'
                                : riskLevel === 'MEDIUM'
                                ? '#fef3c7'
                                : '#dcfce7',
                            color:
                              riskLevel === 'CRITICAL' || riskLevel === 'HIGH'
                                ? '#991b1b'
                                : riskLevel === 'MEDIUM'
                                ? '#92400e'
                                : '#166534',
                            fontWeight: 700
                          }}
                        >
                          RISK: {riskLevel} ({item.risk_score || 0}/100)
                        </span>

                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: item.stamp_status === 'VALID' ? '#dcfce7' : item.stamp_status === 'DEFICIENT' ? '#fee2e2' : '#f1f5f9',
                            color: item.stamp_status === 'VALID' ? '#166534' : item.stamp_status === 'DEFICIENT' ? '#991b1b' : '#475569',
                            fontWeight: 600
                          }}
                        >
                          STAMP: {item.stamp_status || 'UNKNOWN'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '14px', marginTop: '6px', fontSize: '0.82rem', color: '#64748b', flexWrap: 'wrap' }}>
                        <span><strong>State:</strong> {item.state || 'N/A'}</span>
                        <span><strong>Type:</strong> {item.doc_type?.replace('_', ' ') || 'Agreement'}</span>
                        <span><strong>Analyzed On:</strong> {new Date(item.analyzed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {item.report_data && (
                        <button
                          type="button"
                          onClick={() => handleViewReport(item)}
                          style={{
                            marginTop: 0,
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            background: isSelected ? '#0284c7' : '#0f172a'
                          }}
                        >
                          {isSelected ? 'Viewing Report' : 'Open Full Report'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => handleDelete(item.id)}
                        style={{
                          marginTop: 0,
                          padding: '6px 12px',
                          fontSize: '0.82rem',
                          color: '#dc2626',
                          borderColor: '#fca5a5'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </article>

      {/* Render selected past report */}
      {selectedReport && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#0f172a' }}>
              Historical Report for: {activeReportDoc?.filename}
            </h3>
            <button
              type="button"
              className="secondary"
              onClick={() => { setSelectedReport(null); setActiveReportDoc(null); }}
              style={{ marginTop: 0, padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Close Report
            </button>
          </div>

          {selectedReport.stamp && <StampReportCard stamp={selectedReport.stamp} />}
          {selectedReport.risk && (
            <RiskReport
              risk={selectedReport.risk}
              documentTitle={activeReportDoc ? activeReportDoc.filename : 'Past Contract Audit'}
              state={activeReportDoc ? activeReportDoc.state : 'Telangana'}
              docType={activeReportDoc ? activeReportDoc.doc_type : 'Agreement'}
              docId={activeReportDoc ? activeReportDoc.id : null}
            />
          )}
          {selectedReport.plan && <ActionPlan plan={selectedReport.plan} />}
        </div>
      )}
    </div>
  );
}

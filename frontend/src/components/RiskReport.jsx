import React, { useState, useMemo } from 'react';
import { FileText, Download, BarChart3, AlertTriangle, CheckCircle, ShieldAlert, Filter, Layers } from 'lucide-react';
import { downloadRiskReportPdf } from '../api/analysis';

export default function RiskReport({
  risk,
  documentTitle = 'Contract Risk Audit',
  state = 'Telangana',
  docType = 'Legal Agreement',
  docId = null
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL', 'HIGH', 'MEDIUM', 'MISSING'
  const [activeTab, setActiveTab] = useState('CHARTS'); // 'CHARTS', 'LIST', 'BOTH'

  if (!risk) return null;

  const overallClass = risk.overall_risk ? risk.overall_risk.toLowerCase() : 'medium';
  const overallLabel = (risk.overall_risk_level || risk.overall_risk || 'medium').toUpperCase();

  const identifiedRisks = risk.identified_risks || [];
  const missingClauses = risk.missing_clauses || [];

  // Counts & Calculations
  const highRisks = useMemo(
    () => identifiedRisks.filter((r) => (r.severity || '').toLowerCase() === 'high'),
    [identifiedRisks]
  );
  const medRisks = useMemo(
    () => identifiedRisks.filter((r) => (r.severity || '').toLowerCase() === 'medium'),
    [identifiedRisks]
  );
  const lowRisks = useMemo(
    () => identifiedRisks.filter((r) => (r.severity || '').toLowerCase() === 'low'),
    [identifiedRisks]
  );

  const totalIssues = identifiedRisks.length + missingClauses.length;
  const highPct = totalIssues ? Math.round((highRisks.length / totalIssues) * 100) : 0;
  const medPct = totalIssues ? Math.round((medRisks.length / totalIssues) * 100) : 0;
  const missingPct = totalIssues ? Math.round((missingClauses.length / totalIssues) * 100) : 0;
  const lowPct = totalIssues ? Math.max(0, 100 - highPct - medPct - missingPct) : 0;

  // Category Distribution Analysis
  const categories = useMemo(() => {
    const map = {
      'Liability & Indemnity': { count: 0, high: 0, items: [] },
      'Termination & Lock-in': { count: 0, high: 0, items: [] },
      'Financial & Security Deposit': { count: 0, high: 0, items: [] },
      'Statutory & Stamp Admissibility': { count: 0, high: 0, items: [] },
      'Jurisdiction & Disputes': { count: 0, high: 0, items: [] },
      'Omitted Protective Safeguards': { count: 0, high: 0, items: [] }
    };

    identifiedRisks.forEach((r) => {
      const catKey = (r.category || '').toLowerCase();
      const title = (r.title || '').toLowerCase();
      const isHigh = (r.severity || '').toLowerCase() === 'high';

      if (catKey.includes('indemn') || catKey.includes('liabilit') || title.includes('indemn') || title.includes('liabilit')) {
        map['Liability & Indemnity'].count += 1;
        if (isHigh) map['Liability & Indemnity'].high += 1;
        map['Liability & Indemnity'].items.push(r);
      } else if (catKey.includes('terminat') || title.includes('terminat') || title.includes('lock-in') || title.includes('lock in')) {
        map['Termination & Lock-in'].count += 1;
        if (isHigh) map['Termination & Lock-in'].high += 1;
        map['Termination & Lock-in'].items.push(r);
      } else if (catKey.includes('financ') || title.includes('deposit') || title.includes('rent') || title.includes('escalat')) {
        map['Financial & Security Deposit'].count += 1;
        if (isHigh) map['Financial & Security Deposit'].high += 1;
        map['Financial & Security Deposit'].items.push(r);
      } else if (catKey.includes('statut') || title.includes('stamp') || title.includes('section 35')) {
        map['Statutory & Stamp Admissibility'].count += 1;
        if (isHigh) map['Statutory & Stamp Admissibility'].high += 1;
        map['Statutory & Stamp Admissibility'].items.push(r);
      } else if (catKey.includes('jurisdict') || title.includes('court') || title.includes('arbitrat') || title.includes('delhi')) {
        map['Jurisdiction & Disputes'].count += 1;
        if (isHigh) map['Jurisdiction & Disputes'].high += 1;
        map['Jurisdiction & Disputes'].items.push(r);
      } else {
        map['Liability & Indemnity'].count += 1;
        if (isHigh) map['Liability & Indemnity'].high += 1;
        map['Liability & Indemnity'].items.push(r);
      }
    });

    if (missingClauses.length > 0) {
      map['Omitted Protective Safeguards'].count += missingClauses.length;
      map['Omitted Protective Safeguards'].high += missingClauses.filter(m => (m.criticality || '').toLowerCase() === 'high').length;
    }

    return Object.entries(map).filter(([_, data]) => data.count > 0);
  }, [identifiedRisks, missingClauses]);

  const maxCatCount = Math.max(...categories.map(([_, d]) => d.count), 1);

  // PDF Download Handler
  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      setDownloadMsg('Compiling court-ready risk report PDF...');
      await downloadRiskReportPdf({
        docId,
        riskData: risk,
        documentTitle,
        state,
        docType
      });
      setDownloadMsg('Risk report PDF downloaded successfully!');
      setTimeout(() => setDownloadMsg(''), 4000);
    } catch (err) {
      setDownloadMsg(`Download failed: ${err.message || 'Please retry.'}`);
    } finally {
      setDownloading(false);
    }
  };

  // Filtered lists
  const filteredIdentifiedRisks = useMemo(() => {
    if (filterSeverity === 'ALL') return identifiedRisks;
    if (filterSeverity === 'HIGH') return highRisks;
    if (filterSeverity === 'MEDIUM') return medRisks;
    if (filterSeverity === 'MISSING') return [];
    return identifiedRisks;
  }, [identifiedRisks, highRisks, medRisks, filterSeverity]);

  const showMissing = filterSeverity === 'ALL' || filterSeverity === 'MISSING';

  return (
    <article className="risk-analyzer-card" style={{ border: '1px solid var(--line)', borderRadius: '10px', padding: '24px', background: 'var(--card)' }}>
      {/* Top Header & PDF Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px', borderBottom: '1px solid var(--line)', paddingBottom: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', fontWeight: 700, marginBottom: '4px' }}>
            <ShieldAlert size={14} color="var(--red)" />
            Contract Risk Engine & Visual Vulnerability Audit
          </div>
          <h2 style={{ margin: 0, fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Risk Analyser Report
          </h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
            Target: <strong>{documentTitle}</strong> &bull; Jurisdiction: <strong>{state}</strong>
          </div>
        </div>

        {/* PDF Download Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 18px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(185, 28, 28, 0.25)',
              transition: 'all 0.2s ease',
              marginTop: 0
            }}
          >
            {downloading ? (
              <>
                <span className="spinner" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText size={16} />
                <Download size={15} />
                Download Risk Report (PDF)
              </>
            )}
          </button>
          {downloadMsg && (
            <span style={{ fontSize: '0.78rem', color: downloadMsg.includes('failed') ? 'var(--red)' : 'var(--green)', fontWeight: 500 }}>
              {downloadMsg}
            </span>
          )}
        </div>
      </div>

      {/* Vulnerability Score & Gauge Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) 2fr', gap: '16px', alignItems: 'center', background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)', marginBottom: '18px' }}>
        <div>
          <div className="score" style={{ alignItems: 'baseline' }}>
            <b className={overallClass} style={{ fontSize: '3rem', lineHeight: 1 }}>{risk.risk_score}</b>
            <span style={{ fontSize: '1.2rem', color: 'var(--muted)', fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ marginTop: '4px' }}>
            <span className={`badge badge-${overallClass}`} style={{ fontSize: '0.85rem', padding: '3px 10px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
              {overallLabel} RISK PROFILE
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px' }}>
            {highRisks.length} Critical &bull; {medRisks.length} Moderate &bull; {missingClauses.length} Missing Rules
          </div>
        </div>

        {/* Graphical Risk Meter / Gauge Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
            <span style={{ color: '#16a34a' }}>SAFE (0-35)</span>
            <span style={{ color: '#d97706' }}>MODERATE (36-64)</span>
            <span style={{ color: '#dc2626' }}>CRITICAL (65-100)</span>
          </div>
          <div style={{ height: '14px', width: '100%', background: '#e2e8f0', borderRadius: '7px', position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(5, risk.risk_score))}%`,
                background: risk.risk_score >= 65 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : risk.risk_score >= 36 ? 'linear-gradient(90deg, #10b981, #f59e0b)' : 'linear-gradient(90deg, #10b981, #34d399)',
                borderRadius: '7px',
                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
            <span>Contract Vulnerability Threshold</span>
            <span>Current Exposure: <strong>{risk.risk_score}%</strong></span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 BAR CHARTS FOR RISKS SECTION (Directly Addresses User Requirement) */}
      {/* ========================================================================= */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.98rem' }}>
            <BarChart3 size={18} color="var(--ink)" />
            <span>Risk Distribution & Severity Bar Charts</span>
          </div>
          <div style={{ display: 'inline-flex', gap: '6px', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--muted)', alignSelf: 'center' }}>Click bar to filter list below:</span>
          </div>
        </div>

        {/* 1. SEVERITY BREAKDOWN BAR CHART */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
            <span>Severity Proportions</span>
            <span>{totalIssues} Total Issues Detected</span>
          </div>

          {/* Stacked Proportional Bar */}
          <div style={{ height: '26px', display: 'flex', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--line)', background: '#f1f5f9' }}>
            {highRisks.length > 0 && (
              <div
                style={{
                  width: `${highPct}%`,
                  background: '#ef4444',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`High Severity: ${highRisks.length} (${highPct}%)`}
                onClick={() => setFilterSeverity('HIGH')}
              >
                {highPct >= 12 ? `${highRisks.length} High (${highPct}%)` : `${highRisks.length}`}
              </div>
            )}
            {medRisks.length > 0 && (
              <div
                style={{
                  width: `${medPct}%`,
                  background: '#f59e0b',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Medium Severity: ${medRisks.length} (${medPct}%)`}
                onClick={() => setFilterSeverity('MEDIUM')}
              >
                {medPct >= 12 ? `${medRisks.length} Med (${medPct}%)` : `${medRisks.length}`}
              </div>
            )}
            {missingClauses.length > 0 && (
              <div
                style={{
                  width: `${missingPct}%`,
                  background: '#8b5cf6',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                title={`Missing Protections: ${missingClauses.length} (${missingPct}%)`}
                onClick={() => setFilterSeverity('MISSING')}
              >
                {missingPct >= 12 ? `${missingClauses.length} Missing (${missingPct}%)` : `${missingClauses.length}`}
              </div>
            )}
            {totalIssues === 0 && (
              <div style={{ width: '100%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                100% Safe / Compliant
              </div>
            )}
          </div>

          {/* Interactive Severity Legend / Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`sample-btn ${filterSeverity === 'ALL' ? 'active' : ''}`}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '14px',
                background: filterSeverity === 'ALL' ? 'var(--ink)' : 'transparent',
                color: filterSeverity === 'ALL' ? 'var(--bg)' : 'var(--muted)',
                marginTop: 0
              }}
              onClick={() => setFilterSeverity('ALL')}
            >
              All Items ({totalIssues})
            </button>
            <button
              type="button"
              className={`sample-btn ${filterSeverity === 'HIGH' ? 'active' : ''}`}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '14px',
                borderColor: '#ef4444',
                background: filterSeverity === 'HIGH' ? '#ef4444' : 'rgba(239, 68, 68, 0.08)',
                color: filterSeverity === 'HIGH' ? '#fff' : '#b91c1c',
                marginTop: 0
              }}
              onClick={() => setFilterSeverity('HIGH')}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', marginRight: '6px' }} />
              High / Critical ({highRisks.length})
            </button>
            <button
              type="button"
              className={`sample-btn ${filterSeverity === 'MEDIUM' ? 'active' : ''}`}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '14px',
                borderColor: '#f59e0b',
                background: filterSeverity === 'MEDIUM' ? '#f59e0b' : 'rgba(245, 158, 11, 0.08)',
                color: filterSeverity === 'MEDIUM' ? '#fff' : '#b45309',
                marginTop: 0
              }}
              onClick={() => setFilterSeverity('MEDIUM')}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginRight: '6px' }} />
              Medium / Moderate ({medRisks.length})
            </button>
            <button
              type="button"
              className={`sample-btn ${filterSeverity === 'MISSING' ? 'active' : ''}`}
              style={{
                fontSize: '0.75rem',
                padding: '4px 10px',
                borderRadius: '14px',
                borderColor: '#8b5cf6',
                background: filterSeverity === 'MISSING' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.08)',
                color: filterSeverity === 'MISSING' ? '#fff' : '#6d28d9',
                marginTop: 0
              }}
              onClick={() => setFilterSeverity('MISSING')}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6', display: 'inline-block', marginRight: '6px' }} />
              Missing Protections ({missingClauses.length})
            </button>
          </div>
        </div>

        {/* 2. RISK CATEGORY BREAKDOWN (HORIZONTAL BAR CHARTS) */}
        <div style={{ marginTop: '18px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', marginBottom: '10px' }}>
            Risk Density by Contract Category
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map(([catName, data]) => {
              const widthPct = Math.round((data.count / maxCatCount) * 100);
              const barColor = data.high > 0 ? '#ef4444' : '#f59e0b';
              return (
                <div key={catName} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) 1fr 60px', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
                    {catName}
                  </div>
                  {/* Horizontal Bar */}
                  <div style={{ height: '14px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--line)' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(8, widthPct)}%`,
                        background: barColor,
                        borderRadius: '3px',
                        transition: 'width 0.6s ease'
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: data.high > 0 ? 'var(--red)' : 'var(--amber)' }}>
                    {data.count} issue{data.count > 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plain-English Executive Summary */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '6px', padding: '12px 14px', fontSize: '0.88rem', margin: '12px 0 16px', lineHeight: '1.45' }}>
        <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
          💡 Proactive Layman Summary of This Document:
        </strong>
        {risk.plain_english_summary || risk.summary}
      </div>

      {/* Action Roadmap */}
      {risk.what_steps_to_take && risk.what_steps_to_take.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
          <strong style={{ color: '#14532d', fontSize: '0.88rem' }}>🛠️ Exact Steps You Should Take Right Now:</strong>
          <ol style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.85rem', color: '#14532d', lineHeight: '1.45' }}>
            {risk.what_steps_to_take.map((s, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Missing Protective Rules Table / Cards */}
      {showMissing && missingClauses.length > 0 && (
        <div style={{ marginTop: '14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px 14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.9rem', color: '#78350f' }}>
              ⚠️ Missing Protective Rules in This Agreement ({missingClauses.length})
            </strong>
            <span style={{ fontSize: '0.75rem', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px', color: '#92400e', fontWeight: 600 }}>
              Insert before signing
            </span>
          </div>

          <div>
            {missingClauses.map((m, idx) => (
              <div key={idx} style={{ marginBottom: '8px', fontSize: '0.88rem', paddingBottom: '6px', borderBottom: idx < missingClauses.length - 1 ? '1px dashed #fde68a' : 'none' }}>
                <span className={`badge badge-${m.criticality}`} style={{ marginRight: '6px' }}>{m.criticality}</span>
                <strong style={{ color: '#78350f' }}>{m.clause_name}</strong>
                <div style={{ color: '#92400e', fontSize: '0.82rem', marginTop: '2px' }}>
                  {m.why_needed_in_plain_words || m.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Identified Unfair Traps & Dangerous Covenants */}
      {filteredIdentifiedRisks.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--ink)' }}>
              Identified Contract Covenants ({filteredIdentifiedRisks.length})
            </strong>
            {filterSeverity !== 'ALL' && (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                Filtered: <strong>{filterSeverity}</strong> ({filteredIdentifiedRisks.length} shown)
              </span>
            )}
          </div>

          {filteredIdentifiedRisks.map((item, idx) => (
            <div key={idx} className="risk" style={{ marginTop: '8px', padding: '12px', background: 'var(--card)', borderRadius: '6px', border: '1px solid var(--line)', borderLeft: `4px solid ${item.severity === 'high' ? 'var(--red)' : 'var(--amber)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.92rem' }}>#{idx + 1}. {item.title || item.clause_name}</strong>
                <span className={`badge badge-${item.severity}`}>{item.severity}</span>
              </div>

              {item.clause_excerpt && item.clause_excerpt !== 'N/A' && (
                <div style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'var(--muted)', margin: '6px 0', background: 'rgba(0,0,0,0.03)', padding: '6px 8px', borderRadius: '4px' }}>
                  "{item.clause_excerpt}"
                </div>
              )}

              {item.plain_english_danger && (
                <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--red)', lineHeight: '1.4' }}>
                  <strong>⚠️ Why this hurts you:</strong> {item.plain_english_danger}
                </p>
              )}

              {item.statutory_reference && (
                <div className="note" style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  <strong>Statutory Basis:</strong> {item.statutory_reference}
                </div>
              )}

              <div className="note" style={{ color: 'var(--green)', marginTop: '4px', fontSize: '0.82rem' }}>
                <strong>Safe Revision Demand:</strong> {item.suggested_revision || item.remedy}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

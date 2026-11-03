import React from 'react';

export default function StampReportCard({ stamp }) {
  if (!stamp) return null;

  const markLevel = stamp.risk_level ? stamp.risk_level.toLowerCase() : 'low';
  const markText = markLevel === 'low' ? 'AUTHENTIC' : markLevel === 'medium' ? 'SUSPECT' : 'DEFICIENT';
  const scoreVal = stamp.score !== undefined ? stamp.score : (stamp.confidence_score !== undefined ? stamp.confidence_score : 100);
  const fields = stamp.fields || {};
  const metadata = stamp.metadata || {};

  const dutyPaid = metadata.duty_amount_paid !== undefined ? metadata.duty_amount_paid : (fields.denomination || 0);
  const minRequired = metadata.minimum_duty_required !== undefined ? metadata.minimum_duty_required : (stamp.minimum_duty_required || 100);
  const deficit = stamp.deficit_cure_amount || metadata.shortfall_deficit || Math.max(0, minRequired - dutyPaid);
  const penalty = stamp.statutory_penalty_estimate || metadata.section_35_penalty || (deficit * 10);
  const isDeficient = deficit > 0 || markLevel === 'high';

  return (
    <article className="stamp-card">
      <div className={`mark ${markLevel}`}>{markText}</div>
      <h2>1. Exact Stamp Duty & Authenticity Report</h2>
      <div className="score">
        <b>{scoreVal}</b>
        <div className="score-label">
          / 100 Authenticity Confidence &bull;{' '}
          <span className={markLevel} style={{ fontWeight: 600, textTransform: 'uppercase' }}>
            {stamp.risk_level} Risk
          </span>
        </div>
      </div>

      {stamp.plain_english_verdict && (
        <div style={{
          background: isDeficient ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${isDeficient ? '#fecaca' : '#bbf7d0'}`,
          color: isDeficient ? '#7f1d1d' : '#14532d',
          padding: '12px 14px',
          borderRadius: '6px',
          fontSize: '0.9rem',
          lineHeight: '1.5',
          margin: '12px 0'
        }}>
          <strong>💡 Plain-English Summary:</strong><br />
          {stamp.plain_english_verdict}
        </div>
      )}

      <div className="meta-grid">
        <div className="meta-item">
          <span>State Jurisdiction</span>
          <strong>{metadata.state || fields.state || 'Telangana'}</strong>
        </div>
        <div className="meta-item">
          <span>Certificate / UIN</span>
          <strong>{fields.serial_or_uin || metadata.certificate_number || 'N/A'}</strong>
        </div>
        <div className="meta-item">
          <span>Duty Paid on Stamp</span>
          <strong>₹{dutyPaid}</strong>
        </div>
        <div className="meta-item">
          <span>Statutory Min Required</span>
          <strong>₹{minRequired}</strong>
        </div>
        <div className="meta-item">
          <span>Shortfall Deficit</span>
          <strong style={{ color: deficit > 0 ? 'var(--red)' : 'var(--green)' }}>₹{deficit}</strong>
        </div>
        <div className="meta-item">
          <span>Sec 35 (10x) Penalty</span>
          <strong style={{ color: penalty > 0 ? 'var(--red)' : 'var(--muted)' }}>₹{penalty}</strong>
        </div>
      </div>

      {stamp.what_steps_to_take && stamp.what_steps_to_take.length > 0 && (
        <div style={{ marginTop: '14px', background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px 14px' }}>
          <strong style={{ color: 'var(--ink)', fontSize: '0.88rem' }}>🛠️ Exact Steps to Take to Cure:</strong>
          <ol style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '0.85rem', lineHeight: '1.45' }}>
            {stamp.what_steps_to_take.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      <div style={{ marginTop: '14px' }}>
        {(stamp.checks || []).map((check, idx) => (
          <div key={idx} className="check">
            <span className={`badge badge-${check.status}`}>
              {check.status.replace('_', ' ')}
            </span>
            <strong>{check.name}</strong>: {check.detail}
          </div>
        ))}
      </div>
    </article>
  );
}

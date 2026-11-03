import React from 'react';

export default function ActionPlan({ plan }) {
  if (!plan) return null;

  const urgencyClass = plan.action_urgency ? plan.action_urgency.toLowerCase() : 'moderate';

  return (
    <article>
      <h2>3. Strategic Legal Action Roadmap</h2>
      <div style={{ marginBottom: '14px' }}>
        <span className={`badge ${urgencyClass}`} style={{ fontSize: '0.85rem', padding: '3px 10px' }}>
          {plan.action_urgency} ACTION REQUIRED
        </span>
        <p style={{ margin: '8px 0', color: 'var(--muted)' }}>{plan.summary}</p>
      </div>

      <div>
        {(plan.steps || []).map((step, idx) => (
          <div key={idx} className="step">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <strong>Step {step.step_number}: {step.title}</strong>
              <span className={`badge badge-${step.priority}`}>{step.priority} priority</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '4px' }}>
              <strong>Timeframe:</strong> {step.timeframe} &bull; <strong>Statutory Basis:</strong> {step.legal_basis}
            </div>
            <p style={{ margin: '4px 0', fontSize: '0.92rem' }}>{step.description}</p>
            <div className="note">
              <strong>Deliverable:</strong> {step.deliverable}
            </div>
          </div>
        ))}
      </div>

      {plan.sample_notice_outline && (
        <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--line)', borderRadius: '6px' }}>
          <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--ink)' }}>
            Draft Notice Framework
          </strong>
          <p style={{ margin: '4px 0', fontWeight: 600, fontSize: '0.92rem' }}>
            {plan.sample_notice_outline.subject}
          </p>
          <ul style={{ margin: '6px 0', paddingLeft: '18px', fontSize: '0.88rem', color: 'var(--muted)' }}>
            {(plan.sample_notice_outline.key_points || []).map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
          <div className="note">
            Suggested Demand Notice Period: <strong>{plan.sample_notice_outline.suggested_demand_period_days} calendar days</strong> (RPAD Delivery)
          </div>
        </div>
      )}

      {plan.advocate_consultation_brief && (
        <div style={{ marginTop: '14px' }} className="note">
          <strong>Brief for Local Advocate:</strong> {plan.advocate_consultation_brief}
        </div>
      )}
    </article>
  );
}

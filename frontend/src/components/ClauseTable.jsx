import React from 'react';

export default function ClauseTable({ clauses }) {
  if (!clauses || clauses.length === 0) return null;

  return (
    <article>
      <h2>Extracted Contract Clauses</h2>
      <div style={{ marginTop: '12px' }}>
        {clauses.map((clause, idx) => (
          <div key={idx} className="check">
            <span className={`badge badge-${clause.risk_flag || 'safe'}`}>
              {clause.clause_type}
            </span>
            <strong>{clause.title}</strong>
            <p style={{ margin: '4px 0', fontSize: '0.92rem' }}>"{clause.text}"</p>
            <div className="note">{clause.explanation}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

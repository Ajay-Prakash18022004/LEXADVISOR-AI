import React from 'react';

export default function AdvocateCard({ advocate }) {
  return (
    <div className="advocate-card">
      <div className="advocate-info">
        <h3>{advocate.name}</h3>
        <p>
          <strong>{advocate.specialization}</strong> &bull; {advocate.city}, {advocate.state}
        </p>
        {advocate.address && <p className="note">{advocate.address}</p>}
        <p className="note">
          Bar Council: {advocate.bar_council_id || 'Enrolled'} &bull; Experience: {advocate.experience_years} years &bull; Rating: ⭐ {advocate.rating}
        </p>
      </div>
      <div className="advocate-action">
        <div className="advocate-fee">₹{advocate.consultation_fee?.toFixed(0)}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '6px' }}>Consultation</div>
        <a href={`tel:${advocate.phone}`} style={{ textDecoration: 'none' }}>
          <button className="secondary" style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: 0 }}>
            Call Chamber
          </button>
        </a>
      </div>
    </div>
  );
}

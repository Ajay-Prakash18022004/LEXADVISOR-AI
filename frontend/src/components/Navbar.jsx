import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const navItems = [
    { label: 'Decision Hub', path: '/' },
    { label: '⏳ Deadlines & Rent', path: '/deadlines' },
    { label: '📂 Analysis History', path: '/history' },
    { label: '⚖️ Advocates & Appointments', path: '/advocates' },
    { label: '💬 AI Legal Chatbot', path: '/chat' },
    { label: '📄 Notice Drafter', path: '/generate' },
  ];

  return (
    <header className="top">
      <h1>LexAdvisor AI</h1>
      <p>Proactive legal decision-support system. Audits stamp duty authenticity, flags unilateral contract risks, and formulates step-by-step enforcement roadmaps.</p>

      <nav className="nav-tabs" role="tablist">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`tab-btn ${location.pathname === item.path ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

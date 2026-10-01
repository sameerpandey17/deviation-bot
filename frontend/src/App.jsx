import React from 'react';
import DeviationForm from './components/DeviationForm.jsx';
import CopilotPanel from './components/CopilotPanel.jsx';

/* Inline SVGs — single consistent stroke weight (1.5px), no emoji */
export function IconGrid() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

export default function App() {
  return (
    <>
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="nav">
        {/* Brand */}
        <a className="nav-brand" href="#">
          <div className="nav-brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <span className="nav-brand-name">AIVOA</span>
            <span className="nav-brand-sub">AI for a Better Tomorrow</span>
          </div>
        </a>

        {/* Navigation links */}
        <div className="nav-links">
          {['QMS', 'Dashboard', 'Deviations', 'CAPAs', 'Change Control', 'Audits', 'Documents', 'Reports'].map(link => (
            <a
              key={link}
              href="#"
              className={`nav-link${link === 'Deviations' ? ' active' : ''}`}
            >
              {link}
            </a>
          ))}
        </div>

        {/* Right slot */}
        <div className="nav-right">
          <div className="nav-company">
            <span className="nav-company-dot" />
            Vasudha Pharma Chem Limited
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
          <button className="nav-icon-btn" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span className="nav-notif-dot" />
          </button>
          <button className="nav-avatar" aria-label="User menu">MH</button>
        </div>
      </nav>

      {/* ── Two-panel layout ─────────────────────────────────────────────── */}
      <main className="page">
        <DeviationForm />
        <CopilotPanel />
      </main>
    </>
  );
}

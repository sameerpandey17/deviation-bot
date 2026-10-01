import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

const SEVERITY_BADGE = {
  Minor: 'badge-minor',
  Major: 'badge-major',
  Critical: 'badge-critical',
};

export default function RiskAssessment({ risk, isLatest = true }) {
  const [expanded, setExpanded] = useState(isLatest);

  if (!risk || (!risk.severity && !risk.reason)) {
    return null;
  }

  // Collapsed view for older assessments in thread
  if (!expanded && !isLatest) {
    return (
      <div
        className="risk-card-collapsed"
        onClick={() => setExpanded(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(true)}
      >
        <div className="risk-collapsed-info">
          <ShieldAlert size={14} className="risk-collapsed-icon" />
          <span className="risk-collapsed-title">
            Earlier assessment: <strong>{risk.severity || 'Assessed'}</strong> {risk.impact ? `· ${risk.impact}` : ''}
          </span>
        </div>
        <button type="button" className="risk-expand-btn" aria-label="Expand earlier risk assessment">
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`risk-card-bubble ${!isLatest ? 'is-older' : ''}`}>
      <div className="risk-card-head">
        <div className="risk-card-title-group">
          <ShieldAlert size={15} className="risk-shield-icon" />
          <span className="risk-card-title">AI Copilot Risk Assessment</span>
        </div>
        <div className="risk-badges">
          {risk.severity && (
            <span className={`badge ${SEVERITY_BADGE[risk.severity] || 'badge-draft'}`}>
              {risk.severity}
            </span>
          )}
          {risk.impact && (
            <span className="badge badge-impact">
              {risk.impact}
            </span>
          )}
          {!isLatest && (
            <button
              type="button"
              className="risk-collapse-toggle"
              onClick={() => setExpanded(false)}
              aria-label="Collapse assessment"
            >
              <ChevronUp size={14} />
            </button>
          )}
        </div>
      </div>

      {risk.reason && (
        <div className="risk-section">
          <span className="risk-key">Reason</span>
          <p className="risk-val">{risk.reason}</p>
        </div>
      )}

      {risk.next_action && (
        <div className="risk-section">
          <span className="risk-key">Recommended Next Action</span>
          <p className="risk-val">{risk.next_action}</p>
        </div>
      )}

      {risk.containment && (
        <div className="risk-section">
          <span className="risk-key">Immediate Containment</span>
          <p className="risk-val">{risk.containment}</p>
        </div>
      )}

      {risk.root_cause_hints && risk.root_cause_hints.length > 0 && (
        <div className="risk-section">
          <span className="risk-key">Possible Root-Cause Hints</span>
          <ul className="risk-list">
            {risk.root_cause_hints.map((hint, idx) => (
              <li key={idx}>{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

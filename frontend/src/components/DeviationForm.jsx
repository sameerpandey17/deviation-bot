import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Calendar,
  Search,
  RotateCcw,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Package,
  FlaskConical,
} from 'lucide-react';
import { saveDeviation } from '../api.js';
import { markSaved, resetAll, clearChangedFields } from '../store.js';

const SOURCES = ['Manufacturing', 'QC Laboratory', 'Warehouse', 'Utilities', 'Audit', 'Supplier', 'Other'];
const IMPACTS = ['Product Quality', 'Patient Safety', 'Regulatory Compliance', 'Data Integrity', 'EHS', 'No Impact'];
const SEVERITIES = ['Minor', 'Major', 'Critical'];
const DOSAGE_FORMS = ['Tablet', 'Capsule', 'Injection', 'Syrup', 'Cream', 'Powder', 'Other'];

/**
 * DeviationForm — Left panel (Display-only QMS record).
 * All inputs are read-only / disabled.
 * Populated exclusively by AIVOA Copilot from right panel.
 * Independent scroll with pinned Reset and Save actions.
 */
export default function DeviationForm() {
  const dispatch = useDispatch();
  const {
    form,
    aiFilledFields,
    changedFields,
    risk,
    formStatus,
    saved,
    deviationId,
    missing_fields,
  } = useSelector((s) => s.deviation);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const aiSet = new Set(aiFilledFields || []);
  const changedSet = new Set(changedFields || []);
  const missingSet = new Set(missing_fields || []);

  // Flash highlight timeout (1.5 seconds)
  useEffect(() => {
    if (changedFields && changedFields.length > 0) {
      const timer = setTimeout(() => {
        dispatch(clearChangedFields());
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [changedFields, dispatch]);

  /* Required fields gating Save */
  const canSave = Boolean(
    form.title &&
    form.date_of_occurrence &&
    form.detailed_description &&
    form.initial_severity &&
    form.initial_impact
  );

  const getFieldClass = (name, baseType = 'field-input') => {
    let classes = [baseType];
    if (aiSet.has(name)) classes.push('ai-filled');
    if (changedSet.has(name)) classes.push('field-flash');
    if (missingSet.has(name)) classes.push('field-missing');
    return classes.join(' ');
  };

  const AiChip = ({ name }) =>
    aiSet.has(name) ? (
      <span className="ai-chip" title="Populated by AI Copilot">
        AI
      </span>
    ) : null;

  const MissingHint = ({ name }) =>
    missingSet.has(name) ? (
      <span className="field-missing-hint">
        <AlertCircle size={11} /> Not found. Tell the copilot.
      </span>
    ) : null;

  const handleSave = async () => {
    if (!canSave || saving || saved) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveDeviation(form, risk);
      dispatch(markSaved(result.id));
    } catch (e) {
      setSaveError(e.message || 'Failed to save deviation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card form-card-container">
      <div className="form-card-scrollable">
        {/* Header */}
        <div className="form-head">
          <div>
            <h1 className="form-title">Log Deviation</h1>
            <p className="form-subtitle">Record any unexpected event, out-of-specification result or non-conformance.</p>
          </div>
          <div className="form-badge-wrap">
            {/* Status Pill */}
            {saved || formStatus === 'saved' ? (
              <span className="pill-status pill-saved">
                <CheckCircle2 size={13} /> Saved · #{deviationId}
              </span>
            ) : formStatus === 'pending_review' ? (
              <span className="pill-status pill-pending">
                <Clock size={13} /> Pending Review
              </span>
            ) : (
              <span className="pill-status pill-awaiting">
                <HelpCircle size={13} /> Awaiting Input
              </span>
            )}
          </div>
        </div>

        {/* ── Section 1: Deviation Information ──────────────────────────── */}
        <p className="section-label">1. DEVIATION INFORMATION</p>

        <div className="field-grid">
          {/* Site / Plant */}
          <div className="field-wrap">
            <label className="field-label">
              Site / Plant <span className="req">*</span>
              <AiChip name="site_plant" />
            </label>
            <div className="field-select-wrap">
              <select
                className={getFieldClass('site_plant', 'field-select')}
                disabled
                value={form.site_plant || 'API Manufacturing Unit'}
              >
                <option value="API Manufacturing Unit">API Manufacturing Unit</option>
              </select>
            </div>
            <MissingHint name="site_plant" />
          </div>

          {/* Date of Occurrence */}
          <div className="field-wrap">
            <label className="field-label">
              Date of Occurrence <span className="req">*</span>
              <AiChip name="date_of_occurrence" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={getFieldClass('date_of_occurrence')}
                disabled
                value={form.date_of_occurrence || ''}
                placeholder="Awaiting AI extraction..."
              />
              <span className="field-icon">
                <Calendar size={14} />
              </span>
            </div>
            <MissingHint name="date_of_occurrence" />
          </div>

          {/* Title / Short Description */}
          <div className="field-wrap">
            <label className="field-label">
              Title / Short Description <span className="req">*</span>
              <AiChip name="title" />
            </label>
            <input
              className={getFieldClass('title')}
              disabled
              value={form.title || ''}
              placeholder="Awaiting AI extraction..."
            />
            <MissingHint name="title" />
          </div>

          {/* Source */}
          <div className="field-wrap">
            <label className="field-label">
              Source <span className="req">*</span>
              <AiChip name="source" />
            </label>
            <div className="field-select-wrap">
              <select
                className={getFieldClass('source', 'field-select')}
                disabled
                value={form.source || ''}
              >
                <option value="">Awaiting AI classification...</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <MissingHint name="source" />
          </div>

          {/* Related Product / Material */}
          <div className="field-wrap">
            <label className="field-label">
              Related Product / Material
              <AiChip name="related_product" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={`${getFieldClass('related_product')} has-left-icon`}
                disabled
                value={form.related_product || ''}
                placeholder="Awaiting AI extraction..."
              />
              <span className="field-icon search-icon">
                <Search size={14} />
              </span>
            </div>
            <MissingHint name="related_product" />
          </div>

          {/* Batch / Lot Number */}
          <div className="field-wrap">
            <label className="field-label">
              Batch / Lot Number
              <AiChip name="batch_lot_number" />
            </label>
            <input
              className={getFieldClass('batch_lot_number')}
              disabled
              value={form.batch_lot_number || ''}
              placeholder="Awaiting AI extraction..."
            />
            <MissingHint name="batch_lot_number" />
          </div>
        </div>

        {/* ── Section 1b: Product Details ────────────────────────────────── */}
        <p className="section-label">
          <FlaskConical size={12} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          1B. PRODUCT DETAILS
        </p>

        <div className="field-grid">
          {/* Product Strength */}
          <div className="field-wrap">
            <label className="field-label">
              Strength / Concentration
              <AiChip name="product_strength" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={getFieldClass('product_strength')}
                disabled
                value={form.product_strength || ''}
                placeholder="e.g. 500 mg, 250 mg/5 mL"
              />
              <span className="field-icon"><FlaskConical size={14} /></span>
            </div>
            <MissingHint name="product_strength" />
          </div>

          {/* Product Amount / Quantity */}
          <div className="field-wrap">
            <label className="field-label">
              Affected Quantity
              <AiChip name="product_amount" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={getFieldClass('product_amount')}
                disabled
                value={form.product_amount || ''}
                placeholder="e.g. 48 kg, 10,000 units"
              />
              <span className="field-icon"><Package size={14} /></span>
            </div>
            <MissingHint name="product_amount" />
          </div>

          {/* Dosage Form */}
          <div className="field-wrap">
            <label className="field-label">
              Dosage Form
              <AiChip name="dosage_form" />
            </label>
            <div className="field-select-wrap">
              <select
                className={getFieldClass('dosage_form', 'field-select')}
                disabled
                value={form.dosage_form || ''}
              >
                <option value="">Awaiting AI classification...</option>
                {DOSAGE_FORMS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <MissingHint name="dosage_form" />
          </div>

          {/* Manufacturing Date */}
          <div className="field-wrap">
            <label className="field-label">
              Manufacturing Date
              <AiChip name="manufacturing_date" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={getFieldClass('manufacturing_date')}
                disabled
                value={form.manufacturing_date || ''}
                placeholder="mm-yyyy"
              />
              <span className="field-icon"><Calendar size={14} /></span>
            </div>
            <MissingHint name="manufacturing_date" />
          </div>

          {/* Expiry Date */}
          <div className="field-wrap">
            <label className="field-label">
              Expiry Date
              <AiChip name="expiry_date" />
            </label>
            <div className="field-icon-wrap">
              <input
                className={getFieldClass('expiry_date')}
                disabled
                value={form.expiry_date || ''}
                placeholder="mm-yyyy"
              />
              <span className="field-icon"><Calendar size={14} /></span>
            </div>
            <MissingHint name="expiry_date" />
          </div>
        </div>

        {/* ── Section 2: Deviation Details ──────────────────────────────── */}
        <p className="section-label">2. DEVIATION DETAILS</p>

        <div className="field-grid">
          {/* Detailed Description */}
          <div className="field-wrap field-full">
            <label className="field-label">
              Detailed Description <span className="req">*</span>
              <AiChip name="detailed_description" />
            </label>
            <textarea
              className={getFieldClass('detailed_description', 'field-textarea')}
              disabled
              rows={5}
              value={form.detailed_description || ''}
              placeholder="AI will synthesize the deviation into a formal QMS description..."
            />
            <div className="field-bottom-meta">
              <MissingHint name="detailed_description" />
              <span className="char-counter">{(form.detailed_description || '').length}/2000</span>
            </div>
          </div>

          {/* Initial Impact */}
          <div className="field-wrap">
            <label className="field-label">
              Initial Impact <span className="req">*</span>
              <AiChip name="initial_impact" />
            </label>
            <div className="field-select-wrap">
              <select
                className={getFieldClass('initial_impact', 'field-select')}
                disabled
                value={form.initial_impact || ''}
              >
                <option value="">Awaiting AI classification...</option>
                {IMPACTS.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
            <MissingHint name="initial_impact" />
          </div>

          {/* Initial Severity */}
          <div className="field-wrap">
            <label className="field-label">
              Initial Severity <span className="req">*</span>
              <AiChip name="initial_severity" />
            </label>
            <div className="field-select-wrap">
              <select
                className={getFieldClass('initial_severity', 'field-select')}
                disabled
                value={form.initial_severity || ''}
              >
                <option value="">Awaiting AI classification...</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <MissingHint name="initial_severity" />
          </div>
        </div>

        {/* Save error message if any */}
        {saveError && (
          <div className="form-save-error">
            <AlertCircle size={14} />
            <span>{saveError}</span>
          </div>
        )}
      </div>

      {/* ── Pinned Bottom Actions ────────────────────────────────────────── */}
      <div className="form-actions-pinned">
        <button
          type="button"
          className="btn btn-ghost btn-reset"
          onClick={() => dispatch(resetAll())}
          title="Clear form, risk, and copilot conversation"
        >
          <RotateCcw size={14} className="btn-reset-icon" /> Reset Form
        </button>
        <div className="form-actions-spacer" />
        <button
          type="button"
          className="btn btn-primary btn-save"
          disabled={!canSave || saving || saved}
          onClick={handleSave}
        >
          <Save size={14} />
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Deviation'}
        </button>
      </div>
    </div>
  );
}

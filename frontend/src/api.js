const BASE_URL = 'http://localhost:8000/api';

/**
 * Unified Copilot chat request
 * @param {object} params
 * @param {string} params.message
 * @param {object} params.currentForm
 * @param {object} params.currentRisk
 * @param {Array}  params.history
 * @param {File}   params.file
 * @returns {Promise<{intent, form, changed_fields, risk, reply, missing_fields}>}
 */
export async function sendCopilotChat({ message = '', currentForm = {}, currentRisk = {}, history = [], file = null }) {
  const fd = new FormData();
  fd.append('message', message || '');
  fd.append('current_form', JSON.stringify(currentForm || {}));
  fd.append('current_risk', JSON.stringify(currentRisk || {}));
  fd.append('history', JSON.stringify(history || []));
  if (file) {
    fd.append('file', file);
  }

  const res = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Chat request failed');
  }
  return res.json();
}

/**
 * Backwards compatibility wrappers
 */
export async function sendChat(message, currentForm) {
  return sendCopilotChat({ message, currentForm });
}

export async function extractFromFile(file, currentForm) {
  return sendCopilotChat({ message: '', currentForm, file });
}

/**
 * POST /api/deviations — save to DB
 * @param {object} form
 * @param {object} risk
 * @returns {Promise<{id, ...}>}
 */
export async function saveDeviation(form, risk) {
  const res = await fetch(`${BASE_URL}/deviations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ form, risk }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Save failed');
  }
  return res.json();
}

/**
 * GET /api/deviations — list saved records
 * @returns {Promise<Array>}
 */
export async function getDeviations() {
  const res = await fetch(`${BASE_URL}/deviations`);
  if (!res.ok) throw new Error('Failed to fetch deviations');
  return res.json();
}

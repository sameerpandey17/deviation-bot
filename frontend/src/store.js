import { createSlice, configureStore } from '@reduxjs/toolkit';

export const EMPTY_FORM = {
  site_plant: null,
  date_of_occurrence: null,
  title: null,
  source: null,
  related_product: null,
  batch_lot_number: null,
  // Product Details
  product_strength: null,
  product_amount: null,
  dosage_form: null,
  manufacturing_date: null,
  expiry_date: null,
  // Deviation Details
  detailed_description: null,
  initial_impact: null,
  initial_severity: null,
};

export const EMPTY_RISK = {
  severity: null,
  impact: null,
  reason: null,
  next_action: null,
  containment: null,
  root_cause_hints: null,
};

export const INITIAL_WELCOME = {
  id: 'welcome-msg',
  role: 'assistant',
  text: 'Ready to process new deviations. You can paste the raw email or notes, or upload a PDF of the deviation report. I will extract the data and run the initial risk assessment.',
  status: 'done',
  isInitial: true,
  timestamp: Date.now(),
};

const initialState = {
  form: { ...EMPTY_FORM },
  aiFilledFields: [],
  changedFields: [],
  risk: { ...EMPTY_RISK },
  messages: [{ ...INITIAL_WELCOME }],
  sending: false,
  pendingFileMeta: null, // { name, size, type }
  missing_fields: [],
  formStatus: 'awaiting_input', // 'awaiting_input' | 'pending_review' | 'saved'
  saved: false,
  deviationId: null,
};

const deviationSlice = createSlice({
  name: 'deviation',
  initialState,
  reducers: {
    messageSending(state, action) {
      const { userMessage, pendingAssistantId } = action.payload;
      state.messages.push(userMessage);
      state.messages.push({
        id: pendingAssistantId,
        role: 'assistant',
        text: '',
        status: 'pending',
        timestamp: Date.now(),
      });
      state.sending = true;
      state.pendingFileMeta = null;
    },

    aiResponseReceived(state, action) {
      const { pendingAssistantId, intent, form, changed_fields, risk, reply, missing_fields } = action.payload;

      // Update pending assistant message
      const msgIndex = state.messages.findIndex(m => m.id === pendingAssistantId);
      if (msgIndex !== -1) {
        state.messages[msgIndex] = {
          ...state.messages[msgIndex],
          status: 'done',
          text: reply,
          intent,
          risk: (intent !== 'question' && risk && risk.severity) ? risk : undefined,
          changedFields: changed_fields || [],
          missingFields: missing_fields || [],
        };
      }

      // Merge form fields if log or edit
      if (intent !== 'question' && form) {
        const filled = new Set(state.aiFilledFields);
        Object.entries(form).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            filled.add(k);
          }
        });
        state.aiFilledFields = Array.from(filled);
        state.changedFields = changed_fields || [];
        state.form = { ...state.form, ...form };
        if (risk && risk.severity) {
          state.risk = { ...state.risk, ...risk };
        }
        state.formStatus = 'pending_review';
        state.saved = false;
      }

      state.missing_fields = missing_fields || [];
      state.sending = false;
    },

    aiResponseError(state, action) {
      const { pendingAssistantId, errorText, retryPayload } = action.payload;
      const msgIndex = state.messages.findIndex(m => m.id === pendingAssistantId);
      if (msgIndex !== -1) {
        state.messages[msgIndex] = {
          ...state.messages[msgIndex],
          status: 'error',
          text: errorText || 'An unexpected error occurred while processing.',
          retryPayload,
        };
      }
      state.sending = false;
    },

    addDirectAssistantMessage(state, action) {
      state.messages.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        text: action.payload.text,
        status: action.payload.isError ? 'error' : 'done',
        timestamp: Date.now(),
      });
    },

    setPendingFile(state, action) {
      state.pendingFileMeta = action.payload;
    },

    clearPendingFile(state) {
      state.pendingFileMeta = null;
    },

    clearChangedFields(state) {
      state.changedFields = [];
    },

    markSaved(state, action) {
      state.saved = true;
      state.formStatus = 'saved';
      state.deviationId = action.payload;
    },

    resetAll(state) {
      state.form = { ...EMPTY_FORM };
      state.aiFilledFields = [];
      state.changedFields = [];
      state.risk = { ...EMPTY_RISK };
      state.messages = [{ ...INITIAL_WELCOME, timestamp: Date.now() }];
      state.sending = false;
      state.pendingFileMeta = null;
      state.missing_fields = [];
      state.formStatus = 'awaiting_input';
      state.saved = false;
      state.deviationId = null;
    },
  },
});

export const {
  messageSending,
  aiResponseReceived,
  aiResponseError,
  addDirectAssistantMessage,
  setPendingFile,
  clearPendingFile,
  clearChangedFields,
  markSaved,
  resetAll,
} = deviationSlice.actions;

export default deviationSlice.reducer;
 
export const store = configureStore({
  reducer: {
    deviation: deviationSlice.reducer,
  },
});

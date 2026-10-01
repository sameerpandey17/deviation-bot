import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FlaskConical,
  Paperclip,
  Send,
  FileText,
  X,
  Zap,
  RotateCcw,
  Sparkles,
  HelpCircle,
  UploadCloud,
} from 'lucide-react';
import { sendCopilotChat } from '../api.js';
import {
  messageSending,
  aiResponseReceived,
  aiResponseError,
  addDirectAssistantMessage,
  setPendingFile,
  clearPendingFile,
} from '../store.js';
import RiskAssessment from './RiskAssessment.jsx';

const ALLOWED_EXT = /\.(pdf|docx?|xlsx?|txt|jpe?g|png)$/i;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CopilotPanel() {
  const dispatch = useDispatch();
  const { form, risk, messages, sending, pendingFileMeta } = useSelector((s) => s.deviation);

  const [input, setInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null); // Keeps actual File object outside Redux
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatThreadRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll logic: scroll to bottom on new message unless user has scrolled up
  useEffect(() => {
    const thread = chatThreadRef.current;
    if (!thread) return;
    const isNearBottom = thread.scrollHeight - thread.scrollTop - thread.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending]);

  // Auto-grow textarea up to 5 lines
  const handleTextChange = (e) => {
    setInput(e.target.value);
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  // Validate attached file
  const handleFileSelection = (file) => {
    if (!file) return;

    if (!ALLOWED_EXT.test(file.name)) {
      dispatch(
        addDirectAssistantMessage({
          text: `Unsupported file format "${file.name}". Please attach a PDF, DOCX, TXT, XLS/XLSX, JPG, or PNG.`,
          isError: true,
        })
      );
      return;
    }

    if (file.size > MAX_BYTES) {
      dispatch(
        addDirectAssistantMessage({
          text: `The file "${file.name}" is too large (${formatFileSize(file.size)}). The maximum allowed size is 10 MB.`,
          isError: true,
        })
      );
      return;
    }

    fileRef.current = file;
    dispatch(
      setPendingFile({
        name: file.name,
        size: file.size,
        type: file.type,
      })
    );
  };

  const removePendingFile = () => {
    fileRef.current = null;
    dispatch(clearPendingFile());
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if dragging completely out of panel
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // Send message
  const handleSend = async (overrideText = null, overrideFile = null) => {
    const textToSend = overrideText !== null ? overrideText : input.trim();
    const fileToSend = overrideFile !== null ? overrideFile : fileRef.current;

    if ((!textToSend && !fileToSend) || sending) return;

    const userMsgId = `usr-${Date.now()}`;
    const pendingAssistantId = `ast-${Date.now() + 1}`;

    const userMessage = {
      id: userMsgId,
      role: 'user',
      text: textToSend,
      attachment: fileToSend
        ? {
            name: fileToSend.name,
            size: fileToSend.size,
            type: fileToSend.type,
          }
        : null,
      timestamp: Date.now(),
    };

    // Prepare history (last 6 messages formatted)
    const historyPayload = messages
      .filter((m) => m.status !== 'pending' && m.status !== 'error')
      .slice(-6)
      .map((m) => ({ role: m.role, text: m.text }));

    dispatch(messageSending({ userMessage, pendingAssistantId }));

    // Clear input & pending file in UI
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    fileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      const response = await sendCopilotChat({
        message: textToSend,
        currentForm: form,
        currentRisk: risk,
        history: historyPayload,
        file: fileToSend,
      });

      dispatch(
        aiResponseReceived({
          pendingAssistantId,
          intent: response.intent,
          form: response.form,
          changed_fields: response.changed_fields,
          risk: response.risk,
          reply: response.reply,
          missing_fields: response.missing_fields,
        })
      );
    } catch (err) {
      dispatch(
        aiResponseError({
          pendingAssistantId,
          errorText: err.message || 'Failed to communicate with AI Copilot.',
          retryPayload: { text: textToSend, file: fileToSend },
        })
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Find index of the latest message with risk data for collapsible older cards
  const latestRiskMsgIndex = [...messages]
    .map((m, idx) => ({ m, idx }))
    .filter(({ m }) => m.risk && m.risk.severity)
    .pop()?.idx;

  return (
    <div
      className={`copilot-panel ${dragOver ? 'drag-active' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ── Drag & Drop Overlay ────────────────────────────────────────── */}
      {dragOver && (
        <div className="copilot-drop-overlay">
          <UploadCloud size={40} className="copilot-drop-icon" />
          <p className="copilot-drop-text">Drop file to attach to Copilot</p>
          <span className="copilot-drop-sub">PDF, DOCX, TXT, XLS/XLSX, JPG, PNG (Max 10 MB)</span>
        </div>
      )}

      {/* ── 3.1 Header ─────────────────────────────────────────────────── */}
      <header className="copilot-header">
        <div className="copilot-header-brand">
          <div className="copilot-header-icon-wrap">
            <FlaskConical size={18} className="copilot-header-icon" />
          </div>
          <div>
            <h2 className="copilot-title">AIVOA Copilot</h2>
            <p className="copilot-subtitle">Drop deviation files or paste text below.</p>
          </div>
        </div>
        <div className="copilot-status-group">
          <span
            className={`copilot-status-dot ${sending ? 'is-pulsing' : 'is-idle'}`}
            title={sending ? 'Copilot is analyzing...' : 'Copilot is ready'}
          />
        </div>
      </header>

      {/* ── 3.2 Chat Thread ────────────────────────────────────────────── */}
      <div className="copilot-thread" ref={chatThreadRef}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isPending = msg.status === 'pending';
          const isError = msg.status === 'error';
          const isLatestRisk = idx === latestRiskMsgIndex;

          return (
            <div key={msg.id || idx} className={`copilot-row ${isUser ? 'is-user' : 'is-assistant'}`}>
              {!isUser && (
                <div className="copilot-avatar" aria-hidden="true">
                  <Zap size={15} />
                </div>
              )}

              <div className={`copilot-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'} ${isError ? 'error-bubble' : ''}`}>
                {/* User file attachment chip inside bubble */}
                {isUser && msg.attachment && (
                  <div className="bubble-attachment-chip">
                    <FileText size={14} className="attachment-icon" />
                    <span className="attachment-name">{msg.attachment.name}</span>
                    <span className="attachment-size">({formatFileSize(msg.attachment.size)})</span>
                  </div>
                )}

                {/* Message body */}
                {isPending ? (
                  <div className="copilot-working-state">
                    <div className="copilot-typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <span className="copilot-working-text">Working on it...</span>
                  </div>
                ) : (
                  <>
                    {msg.text && <p className="copilot-msg-text">{msg.text}</p>}

                    {/* Changed fields chips for edit intent */}
                    {msg.changedFields && msg.changedFields.length > 0 && (
                      <div className="changed-chips-container">
                        <span className="changed-chips-label">Updated fields:</span>
                        <div className="changed-chips-list">
                          {msg.changedFields.map((fName) => (
                            <span key={fName} className="changed-chip">
                              <Sparkles size={11} />
                              {fName.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Embedded Risk Assessment Card */}
                    {msg.risk && (
                      <div className="copilot-embedded-risk">
                        <RiskAssessment risk={msg.risk} isLatest={isLatestRisk} />
                      </div>
                    )}

                    {/* Error state with retry button */}
                    {isError && msg.retryPayload && (
                      <button
                        type="button"
                        className="copilot-retry-btn"
                        onClick={() => handleSend(msg.retryPayload.text, msg.retryPayload.file)}
                      >
                        <RotateCcw size={13} />
                        Retry Request
                      </button>
                    )}

                    {/* Starter chips under the initial welcome bubble */}
                    {msg.isInitial && (
                      <div className="copilot-starter-chips">
                        <button
                          type="button"
                          className="starter-chip"
                          onClick={() => {
                            setInput('During batch reaction in API-2407, reactor temperature exceeded 92°C against approved range of 70 to 80°C for 25 minutes.');
                            textareaRef.current?.focus();
                          }}
                        >
                          <FileText size={13} /> Log a deviation from text
                        </button>
                        <button
                          type="button"
                          className="starter-chip"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <UploadCloud size={13} /> Upload a deviation report
                        </button>
                        <button
                          type="button"
                          className="starter-chip"
                          onClick={() => {
                            setInput('Why was this deviation assigned this severity level?');
                            textareaRef.current?.focus();
                          }}
                        >
                          <HelpCircle size={13} /> Ask about severity
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── 3.3 Composer ───────────────────────────────────────────────── */}
      <footer className="copilot-composer-container">
        <div className="copilot-composer-box">
          {/* Attachment Preview Chip */}
          {pendingFileMeta && (
            <div className="composer-file-preview">
              <div className="composer-file-preview-info">
                <FileText size={14} className="preview-file-icon" />
                <span className="preview-file-name" title={pendingFileMeta.name}>
                  {pendingFileMeta.name}
                </span>
                <span className="preview-file-size">({formatFileSize(pendingFileMeta.size)})</span>
              </div>
              <button
                type="button"
                className="composer-file-remove-btn"
                onClick={removePendingFile}
                aria-label="Remove attached file"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="copilot-composer-row">
            {/* Hidden File Picker */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.docx,.xlsx,.xls,.txt,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
              }}
            />

            {/* Paperclip Button */}
            <button
              type="button"
              className="copilot-composer-attach-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach PDF, DOCX, TXT, XLS/XLSX, JPG or PNG (max 10 MB)"
              aria-label="Attach file"
              disabled={sending}
            >
              <Paperclip size={17} />
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or paste a deviation..."
              className="copilot-composer-textarea"
              disabled={sending}
            />

            {/* Send Button */}
            <button
              type="button"
              className="copilot-composer-send-btn"
              onClick={() => handleSend()}
              disabled={(!input.trim() && !pendingFileMeta) || sending}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Branding & Disclaimer */}
        <div className="copilot-composer-footer">
          <p className="copilot-brand-tag">POWERED BY LANGGRAPH</p>
          <p className="copilot-disclaimer-text">AI responses may contain errors. Please verify information.</p>
        </div>
      </footer>
    </div>
  );
}

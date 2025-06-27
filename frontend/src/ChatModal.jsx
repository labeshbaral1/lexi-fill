// ChatModal.js
import { useState, useRef, useEffect } from 'react';
import './ChatModal.css';

export default function ChatModal({
  questions = [],
  currentFieldIdx = 0,
  currentPlaceholderId = null,
  onSubmit,
  isComplete,
  downloadCompleted = false,
  onDownload,
  onUploadAnother,
  onRemoveField,
  inputDisabled,
  placeholderValues = {},
  placeholders = [],
  handlePlaceholderChange,
  onBack // optional, for back button
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setInput(placeholderValues[placeholders[currentFieldIdx]?.id] || '');
    inputRef.current?.focus();
  }, [currentFieldIdx, isComplete]);

  const handleSend = () => {
    if (input.trim()) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  const handleRemove = () => {
    if (typeof onRemoveField === 'function') {
      onRemoveField(placeholders[currentFieldIdx]?.id);
      setInput(''); 
    }
  };

  const handleBack = () => {
    if (currentFieldIdx > 0 && typeof onBack === 'function') {
      onBack();
    }
  };

  const currentQ = questions?.find(q => q.id === placeholders[currentFieldIdx]?.id)?.question
    || placeholders[currentFieldIdx]?.label;

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal ai-modal">
        <div className="chat-modal-header ai-header">
          <span className="ai-title">Lexi-AI</span>
          {currentFieldIdx + 1 < placeholders.length && <span className="ai-progress">{currentFieldIdx + 1} / {placeholders.length}</span>}
        </div>
        <div className="chat-modal-body ai-body">
          {!isComplete ? (
            <>
              <div className="ai-question-row">
                <button
                  className="ai-back-btn"
                  onClick={handleBack}
                  disabled={currentFieldIdx === 0}
                  aria-label="Previous"
                >
                  &#8592;
                </button>
                <div className="chat-question ai-question">{currentQ}</div>
              </div>
              <div className="chat-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    handlePlaceholderChange(placeholders[currentFieldIdx]?.id, e.target.value);
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                  className="chat-input ai-input"
                  placeholder="Type your answer..."
                  disabled={inputDisabled}
                />
                <button
                  onClick={handleRemove}
                  className="chat-remove-button ai-remove-btn"
                  disabled={inputDisabled}
                  title="Remove this field (incorrectly detected)"
                >
                  Nullify Field
                </button>
                <button
                  onClick={handleSend}
                  className="chat-send-button ai-send-btn"
                  disabled={inputDisabled}
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="chat-complete ai-complete">
              {!downloadCompleted ? (
                <>
                  <div className="chat-complete-message ai-complete-msg">All done! Download your completed document.</div>
                  <button
                    onClick={onDownload}
                    className="chat-download-button ai-download-btn"
                  >
                    Download Completed Document
                  </button>
                </>
              ) : (
                <>
                  <div className="chat-complete-message ai-complete-msg">Document downloaded successfully!</div>
                  <button
                    onClick={onUploadAnother}
                    className="chat-download-button ai-download-btn"
                  >
                    Upload Another File
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 

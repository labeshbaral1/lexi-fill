import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import robotIcon from './assets/robot.png';

export default function ChatBot({
  questions = [],
  currentFieldIdx = 0,
  onSubmit,
  onSkip,
  placeholders = [],
  placeholderValues = {},
  onPlaceholderChange,
  inputDisabled = false,
  onDownload,
  onUploadAnother,
  downloadCompleted = false,
  skippedFields = new Set()
}) {
  const [input, setInput] = useState('');
  const [editingFieldId, setEditingFieldId] = useState(null);
  const inputRef = useRef(null);
  const chatHistoryRef = useRef(null);

  const isComplete = currentFieldIdx >= placeholders.length;
  const currentPlaceholder = placeholders[currentFieldIdx];
  const currentQuestion = questions?.find(q => q.id === currentPlaceholder?.id)?.question || currentPlaceholder?.label;

  // Get completed placeholders for history
  const completedPlaceholders = placeholders.slice(0, currentFieldIdx);

  useEffect(() => {
    if (editingFieldId) {
      // If editing a specific field, set its current value
      setInput(placeholderValues[editingFieldId] || '');
    } else if (currentPlaceholder) {
      // If on current field, set its current value
      setInput(placeholderValues[currentPlaceholder.id] || '');
    }
    
    if (inputRef.current && (!isComplete || editingFieldId)) {
      inputRef.current.focus();
    }
  }, [currentFieldIdx, isComplete, currentPlaceholder, placeholderValues, editingFieldId]);

  // Auto-scroll to bottom when new items are added to history
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [completedPlaceholders.length]);

  const handleSend = () => {
    if (input.trim()) {
      if (editingFieldId) {
        // Update existing field
        onPlaceholderChange(editingFieldId, input.trim());
        setEditingFieldId(null);
      } else if (currentPlaceholder) {
        // Submit current field
        onSubmit(input.trim());
      }
      setInput('');
    }
  };

  const handleSkipField = () => {
    if (editingFieldId) {
      // Skip the field being edited
      onSkip(editingFieldId);
      setEditingFieldId(null);
      setInput('');
    } else if (currentPlaceholder && onSkip) {
      // Skip current field
      onSkip(currentPlaceholder.id);
      setInput('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    
    // Only update real-time if we're on the current field (not editing)
    if (!editingFieldId && currentPlaceholder && onPlaceholderChange) {
      onPlaceholderChange(currentPlaceholder.id, value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape' && editingFieldId) {
      // Cancel editing
      setEditingFieldId(null);
      setInput(placeholderValues[currentPlaceholder?.id] || '');
    }
  };

  const handleEditField = (fieldId) => {
    setEditingFieldId(fieldId);
    setInput(placeholderValues[fieldId] || '');
  };

  const cancelEdit = () => {
    setEditingFieldId(null);
    setInput(placeholderValues[currentPlaceholder?.id] || '');
  };

  const getFieldQuestion = (placeholder) => {
    return questions?.find(q => q.id === placeholder.id)?.question || placeholder.label;
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <div className="chatbot-avatar">
            <img src={robotIcon} alt="AI" width={16} height={16} />
          </div>
          <span className="chatbot-title">Lexi-AI</span>
        </div>
        {!isComplete && (
          <span className="chatbot-progress">{currentFieldIdx + 1} / {placeholders.length}</span>
        )}
      </div>

      <div className="chatbot-body">
        {/* Chat History - Show if there are completed items or we're editing */}
        {(completedPlaceholders.length > 0 || editingFieldId) && (
          <div className="chat-history" ref={chatHistoryRef}>
            {completedPlaceholders.map((placeholder) => {
              const isSkipped = skippedFields.has(placeholder.id);
              const value = placeholderValues[placeholder.id];
              const question = getFieldQuestion(placeholder);
              const isCurrentlyEditing = editingFieldId === placeholder.id;

              return (
                <div key={placeholder.id} className={`chat-history-item ${isCurrentlyEditing ? 'editing' : ''}`}>
                  {/* AI Question */}
                  <div className="chat-message ai-message">
                    <div className="chat-avatar">
                      <img src={robotIcon} alt="AI" width={12} height={12} />
                    </div>
                    <div className="chat-content">
                      <strong>{question}</strong>
                    </div>
                  </div>

                  {/* User Response */}
                  <div className="chat-message user-message">
                    <div className="chat-content">
                      {isSkipped ? (
                        <span className="skipped-response">Skipped</span>
                      ) : (
                        <span className="user-response">{value}</span>
                      )}
                      <button 
                        className="edit-button"
                        onClick={() => handleEditField(placeholder.id)}
                        title="Edit this response"
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.50023C18.8978 2.10243 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10243 21.5 2.50023C21.8978 2.89804 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.10243 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Current Question or Editing Interface */}
        {!isComplete && (
          <div className="current-question">
            {editingFieldId ? (
              <div className="editing-context">
                <div className="chatbot-avatar-circle editing">
                  <img src={robotIcon} alt="AI" width={16} height={16} />
                </div>
                <h4>Editing: {getFieldQuestion(placeholders.find(p => p.id === editingFieldId))}</h4>
                <p>Update your response for the [{placeholders.find(p => p.id === editingFieldId)?.label}] placeholder.</p>
              </div>
            ) : (
              <div className="chatbot-context">
                <div className="chatbot-avatar-circle">
                  <img src={robotIcon} alt="AI" width={16} height={16} />
                </div>
                <h4>{currentQuestion}</h4>
                <p>This will be used to fill the [{currentPlaceholder?.label}] placeholder in your document.</p>
              </div>
            )}
          </div>
        )}

        {/* Input Section */}
        {(!isComplete || editingFieldId) && (
          <div className="chatbot-input-section">
            <div className="chatbot-input-row">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="chatbot-input-field"
                placeholder={editingFieldId ? "Update your answer..." : "Type your answer..."}
                disabled={inputDisabled}
              />
              {editingFieldId && (
                <button 
                  onClick={cancelEdit} 
                  className="chatbot-cancel-btn" 
                  disabled={inputDisabled}
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={handleSkipField} 
                className="chatbot-skip-btn" 
                disabled={inputDisabled}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Completion State */}
        {isComplete && !editingFieldId && (
          <div className="chatbot-completion">
            <div className="chatbot-completion-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2"/>
              </svg>
            </div>
            <h3>All done!</h3>
            
            {!downloadCompleted ? (
              <>
                <p>Your document has been completed. You can now download it.</p>
                <button onClick={onDownload} className="chatbot-download-btn">
                  Download Completed Document
                </button>
              </>
            ) : (
                <>
                <p>Want to upload another file?</p>
                <button onClick={onUploadAnother} className="chatbot-upload-another-btn">
                    Upload Another File
              </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
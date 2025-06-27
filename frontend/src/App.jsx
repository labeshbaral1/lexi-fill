import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './App.css'
import ChatBot from './ChatBot'
import robotIcon from './assets/robot.png'

function App() {
  const [uploaded, setUploaded] = useState(false)
  const [downloadCompleted, setDownloadCompleted] = useState(false)
  const [file, setFile] = useState(null)
  const [questions, setQuestions] = useState('')
  const [replacedTemplate, setReplacedTemplate] = useState('')
  const [placeholders, setPlaceholders] = useState([])
  const [placeholderValues, setPlaceholderValues] = useState({})
  const [skippedFields, setSkippedFields] = useState(new Set())
  const [currentFieldIdx, setCurrentFieldIdx] = useState(0)
  const [currentPlaceholderId, setCurrentPlaceholderId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeId, setActiveId] = useState(null)
  const previewRef = useRef(null)
  const [chatOpen, setChatOpen] = useState(true)

  const API_BASE_URL = 'https://lexi-fill.onrender.com'

  useEffect(() => {
    if (currentPlaceholderId) {
      setTimeout(() => {
        const el = document.getElementById(`preview-${currentPlaceholderId}`)
        if (el && previewRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [currentPlaceholderId])

  useEffect(() => {
    if (placeholders.length > 0 && currentFieldIdx < placeholders.length) {
      setCurrentPlaceholderId(placeholders[currentFieldIdx].id)
    } else {
      setCurrentPlaceholderId(null)
    }
  }, [currentFieldIdx, placeholders])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      setFile(selectedFile)
      setError('')
      setSuccess('')
    } else {
      setError('Please select a valid .docx file')
      setFile(null)
    }
  }

  const handleFileUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('document', file)

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const { placeholders: foundPlaceholders, replacedTemplate: template, questions: questions } = response.data
      setQuestions(questions.questions)
      setReplacedTemplate(template)
      setPlaceholders(foundPlaceholders)

      const initialValues = {}
      foundPlaceholders.forEach(placeholder => {
        initialValues[placeholder.id] = ''
      })
      setPlaceholderValues(initialValues)

      setSuccess(`Document uploaded successfully! Found ${foundPlaceholders.length} fields to fill.`)
      setUploaded(true)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || 'Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (value) => {
    if (currentFieldIdx >= placeholders.length) return;

    const currentId = placeholders[currentFieldIdx].id;
    setPlaceholderValues(prev => ({
      ...prev,
      [currentId]: value
    }));

    setCurrentFieldIdx(idx => idx + 1);
  };

  const handleChatBack = () => {
    setCurrentFieldIdx(idx => (idx > 0 ? idx - 1 : 0));
  };

  const handleRemoveField = (fieldId) => {
    setSkippedFields(prev => new Set(prev).add(fieldId));
    setPlaceholderValues(prev => ({
      ...prev,
      [fieldId]: ""
    }));
    
    setCurrentFieldIdx(idx => idx + 1);
  };

  const handlePlaceholderChange = (placeholderId, value) => {
    setPlaceholderValues(prev => ({
      ...prev,
      [placeholderId]: value
    }))
  }

  const handleFocus = (placeholderId) => {
    setActiveId(placeholderId)
    setTimeout(() => {
      const el = document.getElementById(`preview-${placeholderId}`)
      if (el && previewRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const getCompletedTemplateWithAnchors = () => {
    let html = replacedTemplate
    placeholders.forEach(({ id }) => {
      const value = placeholderValues[id] || ''
      let highlightClass = ''
      
      if (id === currentPlaceholderId) {
        highlightClass = 'current-editing'
      } else if (skippedFields.has(id)) {
        highlightClass = 'skipped'
      } else if (value && value.trim() !== '') {
        highlightClass = 'filled'
      }
      // No highlighting for untouched fields only
      
      html = html.replace(
        new RegExp(`<<${id}>>`, 'g'),
        `<span id="preview-${id}" class="placeholder-span ${highlightClass}">${value || '&nbsp;'}</span>`
      )
    })
    return html
  }

  const handleClearAll = () => {
    setFile(null)
    setReplacedTemplate('')
    setPlaceholders([])
    setPlaceholderValues({})
    setSkippedFields(new Set())
    setError('')
    setSuccess('')
    setActiveId(null)
    setCurrentPlaceholderId(null)
    setCurrentFieldIdx(0)
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  const downloadCompletedDocument = () => {
    let completed = replacedTemplate
    Object.entries(placeholderValues).forEach(([id, value]) => {

      const replacementValue = value !== undefined ? value : `[${id}]`
      completed = completed.replace(new RegExp(`<<${id}>>`, 'g'), replacementValue)
    })
    const blob = new Blob([completed], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'completed-document.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    // Set download completed state
    setDownloadCompleted(true)
  }

  const handleUploadAnother = () => {
    // Reset everything back to default state
    setUploaded(false)
    setDownloadCompleted(false)
    setFile(null)
    setReplacedTemplate('')
    setPlaceholders([])
    setPlaceholderValues({})
    setSkippedFields(new Set())
    setCurrentFieldIdx(0)
    setCurrentPlaceholderId(null)
    setQuestions('')
    setError('')
    setSuccess('')
    setActiveId(null)
    const fileInput = document.getElementById('file-input')
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="app-wrapper">
      <div className="app-header-bar">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.895 2 4 2.895 4 4V20C4 21.105 4.895 22 6 22H18C19.105 22 20 21.105 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">Lexi-Fill</span>
          </div>
          <div className="header-actions">
            <button className="help-btn">?</button>
          </div>
        </div>
      </div>
      <div className="container">
        {!uploaded ? 
          <div className="landing-page">
            {/* Main Title */}
            <h2 className="landing-title">Upload Your Legal Document</h2>
            <p className="landing-subtitle">Upload your legal document and fill in the placeholders with precision and ease</p>

            {/* File Upload Area */}
            <div className={`file-drop-zone ${file ? 'uploaded' : ''}`} onClick={() => document.getElementById('file-input').click()}>
              <div className="file-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 2V8H20" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="file-drop-title">Select .docx file</h3>
              <p className="file-drop-subtitle">Drag and drop your file here, or click to browse</p>
              <p className="file-status">{file ? file.name : 'No file chosen'}</p>
              <input
                id="file-input"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="file-input-hidden"
              />
            </div>

            {/* Upload Button */}
            <button
              onClick={handleFileUpload}
              disabled={!file || loading}
              className="upload-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15V3M12 3L8 7M12 3L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L2 19C2 20.1046 2.89543 21 4 21L20 21C21.1046 21 22 20.1046 22 19L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>

            {/* File Requirements */}
            <div className="file-requirements">
              <h4>File Requirements:</h4>
              <div className="requirement-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Microsoft Word (.docx) format only
              </div>
              <div className="requirement-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Maximum file size: 10MB
              </div>
    
            </div>

            <div className="next-steps">
      
              <div className="steps-grid">
                <div className="step-item">
                  <div className="step-icon detect">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h4>Detect Placeholders</h4>
                  <p>Automatically identify all placeholders in your document</p>
                </div>
                
                <div className="step-item">
                  <div className="step-icon ai">
                    <img src={robotIcon} alt="AI" width={24} height={24} />
                  </div>
                  <h4>AI-Powered Filling</h4>
                  <p>Use Lexi-AI to intelligently fill in your placeholders</p>
                </div>
                
                <div className="step-item">
                  <div className="step-icon preview">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h4>Real-time Preview</h4>
                  <p>See your document update in real-time as you fill</p>
                </div>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
          </div>
          
          :
        <div className="document-workspace">
          <div className="main-content">
            {/* Left: Document Info Header + Document Preview (vertical stack) */}
            <div className="left-doc-column">
              <div className="document-header">
                <div className="document-info">
                  <div className="doc-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#6b7280" strokeWidth="2"/>
                      <path d="M14 2V8H20" stroke="#6b7280" strokeWidth="2"/>
                    </svg>
                  </div>
                  <div className="doc-details">
                    <h3 className="doc-name">{file?.name || 'Document'}</h3>
                    <p className="doc-stats">{placeholders.length} placeholders detected</p>
                  </div>
                </div>
                <button 
                  onClick={downloadCompletedDocument} 
                  className="download-btn"
                  disabled={currentFieldIdx < placeholders.length}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15" stroke="currentColor" strokeWidth="2"/>
                    <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 15V3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Download
                </button>
              </div>
              <div className="document-panel">
                {replacedTemplate && (
                  <div className="document-view">
                    <div
                      className="document-content"
                      ref={previewRef}
                      dangerouslySetInnerHTML={{ __html: getCompletedTemplateWithAnchors() }}
                    />
                  </div>
                )}
              </div>
            </div>
            {/* Right: ChatBot - now fills vertical space */}
            <div className="chatbot-panel-vertical">
              <ChatBot
                questions={questions}
                currentFieldIdx={currentFieldIdx}
                onSubmit={handleChatSubmit}
                onSkip={handleRemoveField}
                placeholders={placeholders}
                placeholderValues={placeholderValues}
                onPlaceholderChange={handlePlaceholderChange}
                inputDisabled={loading}
                onDownload={downloadCompletedDocument}
                onUploadAnother={handleUploadAnother}
                downloadCompleted={downloadCompleted}
                skippedFields={skippedFields}
              />
            </div>
          </div>
        </div>

        }
      </div>
    </div>
  )
}

export default App

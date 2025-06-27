import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import ChatModal from './ChatModal.jsx'
import './App.css'

function App() {
  const [uploaded, setUploaded] = useState(false)
  const [downloadCompleted, setDownloadCompleted] = useState(false)
  const [file, setFile] = useState(null)
  const [questions, setQuestions] = useState('')
  const [replacedTemplate, setReplacedTemplate] = useState('')
  const [placeholders, setPlaceholders] = useState([])
  const [placeholderValues, setPlaceholderValues] = useState({})
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
      const highlightClass = id === currentPlaceholderId ? 'current-editing' : ''
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
      <div className="container">
        <div className="app-header">
          <h1 className="app-title">Lexi-Fill</h1>
          <p className="app-subtitle">Upload your legal document and fill in the placeholders</p>
        </div>
        {!uploaded ? 
          <div className="upload-box">
            <h2 className="upload-box-title">Upload Document</h2>
            <div>
              <label htmlFor="file-input" className="file-label">
                Select .docx file
              </label>
              <input
                id="file-input"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                onClick={handleFileUpload}
                disabled={!file || loading}
                className="button button-blue"
              >
                {loading ? 'Processing...' : 'Upload & Process'}
              </button>
              {file && (
                <button
                  onClick={handleClearAll}
                  className="button button-gray"
                >
                  Clear All
                </button>
              )}
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
          </div>
          
          :
        <div className="app-grid">
        <h2 className="preview-title">Document Preview</h2>          
          <div className="flex flex-col gap-6 items-start w-full">
            {placeholders.length > 0 && (
              <ChatModal
                questions={questions}
                currentFieldIdx={currentFieldIdx}
                currentPlaceholderId={currentPlaceholderId}
                onSubmit={handleChatSubmit}
                isComplete={currentFieldIdx >= placeholders.length}
                downloadCompleted={downloadCompleted}
                onDownload={downloadCompletedDocument}
                onUploadAnother={handleUploadAnother}
                inputDisabled={loading}
                placeholderValues={placeholderValues}
                placeholders={placeholders}
                handlePlaceholderChange={handlePlaceholderChange}
                onBack={handleChatBack}
                onRemoveField={handleRemoveField}
              />
            )}
            <div className="preview-wrapper-wide">
              {replacedTemplate && (
                <div className="preview-box-wide" ref={previewRef}>
                  <div className="preview-content-wide">
                    <div
                      className="preview-html"
                      dangerouslySetInnerHTML={{ __html: getCompletedTemplateWithAnchors() }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        }
      </div>
    </div>
  )
}

export default App

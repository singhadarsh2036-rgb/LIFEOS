import { useRef, useState } from 'react'
import { apiFetch } from './api'

function SmartDeadlineDetection({ onClose, onDetected }) {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)

  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const [selected, setSelected] = useState([])

  // -----------------------------------------
  // TOKEN
  // -----------------------------------------
  const getToken = () => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('accessToken') ||
      ''
    )
  }

  // -----------------------------------------
  // FILE VALIDATION
  // -----------------------------------------
  const handleFile = (selectedFile) => {
    if (!selectedFile) return

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ]

    const maxSize = 20 * 1024 * 1024

    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please upload a PDF, PNG, JPG, JPEG or WebP file.')
      return
    }

    if (selectedFile.size > maxSize) {
      setError('File size must be less than 20MB.')
      return
    }

    setError('')
    setFile(selectedFile)
  }

  // -----------------------------------------
  // FILE INPUT
  // -----------------------------------------
  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0]

    if (selectedFile) {
      handleFile(selectedFile)
    }
  }

  // -----------------------------------------
  // DRAG & DROP
  // -----------------------------------------
  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)

    const droppedFile = event.dataTransfer.files?.[0]

    if (droppedFile) {
      handleFile(droppedFile)
    }
  }

  // -----------------------------------------
  // EXTRACT DEADLINES
  // -----------------------------------------
  const extractDeadlines = async () => {
    if (!file && !text.trim()) {
      setError('Upload a document or paste some text first.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)
    setSelected([])

    try {
      const formData = new FormData()

      if (file) {
        formData.append('file', file)
      }

      if (text.trim()) {
        formData.append('text', text.trim())
      }

      const token = getToken()

      const headers = {}

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await apiFetch(
        '/ai/deadlines/extract',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `AI extraction failed (${response.status})`
        )
      }

      const deadlines = Array.isArray(data?.deadlines)
        ? data.deadlines
        : []

      const normalizedDeadlines = deadlines.map((deadline, index) => ({
        ...deadline,
        _id: `${Date.now()}-${index}`,
      }))

      const normalizedResult = {
        ...data,
        deadlines: normalizedDeadlines,
      }

      setResult(normalizedResult)

      // Select all by default
      setSelected(normalizedDeadlines.map((deadline) => deadline._id))

      if (onDetected) {
        onDetected(normalizedResult)
      }
    } catch (err) {
      console.error('Smart Deadline Detection error:', err)

      setError(
        err.message ||
          'Something went wrong while extracting deadlines.'
      )
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // SELECT / UNSELECT
  // -----------------------------------------
  const toggleDeadline = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    )
  }

  // -----------------------------------------
  // SELECT ALL
  // -----------------------------------------
  const selectAll = () => {
    if (!result?.deadlines) return

    setSelected(result.deadlines.map((deadline) => deadline._id))
  }

  // -----------------------------------------
  // CLEAR ALL
  // -----------------------------------------
  const clearAll = () => {
    setSelected([])
  }

  // -----------------------------------------
  // FORMAT CONFIDENCE
  // -----------------------------------------
  const formatConfidence = (value) => {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const number = Number(value)

    if (Number.isNaN(number)) {
      return value
    }

    // Gemini may return 0.01 instead of 1
    if (number > 0 && number <= 1) {
      return `${Math.round(number * 100)}%`
    }

    return `${Math.round(number)}%`
  }

  // -----------------------------------------
  // FORMAT TYPE
  // -----------------------------------------
  const formatType = (type) => {
    if (!type) return 'DEADLINE'

    return String(type)
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toUpperCase()
  }

  // -----------------------------------------
  // FORMAT PRIORITY
  // -----------------------------------------
  const formatPriority = (priority) => {
    if (!priority) return 'MEDIUM'

    return String(priority).toUpperCase()
  }

  // -----------------------------------------
  // PRIORITY CLASS
  // -----------------------------------------
  const getPriorityClass = (priority) => {
    const value = String(priority || '').toLowerCase()

    if (value === 'high' || value === 'urgent' || value === 'critical') {
      return 'smart-priority-high'
    }

    if (value === 'low') {
      return 'smart-priority-low'
    }

    return 'smart-priority-medium'
  }

  // -----------------------------------------
  // CREATE REMINDERS
  // -----------------------------------------
  const createReminders = async () => {
    if (!result?.deadlines?.length) {
      return
    }

    const selectedDeadlines = result.deadlines.filter((deadline) =>
      selected.includes(deadline._id)
    )

    if (selectedDeadlines.length === 0) {
      setError('Select at least one deadline.')
      return
    }

    setCreating(true)
    setError('')

    try {
      const token = getToken()

      const headers = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      let createdCount = 0

      for (const deadline of selectedDeadlines) {
        if (!deadline.date) {
          console.warn(
            'Skipping deadline because date is missing:',
            deadline
          )
          continue
        }

        let time = deadline.time || '09:00'

        // Convert HH:mm:ss → HH:mm
        if (time.length >= 5) {
          time = time.substring(0, 5)
        }

        // If AI somehow returns 6 PM etc., try to convert it
        const twelveHourMatch = String(time).match(
          /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
        )

        if (twelveHourMatch) {
          let hour = Number(twelveHourMatch[1])
          const minute = twelveHourMatch[2]
          const period = twelveHourMatch[3].toUpperCase()

          if (period === 'PM' && hour !== 12) {
            hour += 12
          }

          if (period === 'AM' && hour === 12) {
            hour = 0
          }

          time = `${String(hour).padStart(2, '0')}:${minute}`
        }

        const reminderTime = `${deadline.date}T${time}:00`

        const reminderPayload = {
          title: deadline.title || 'LIFEOS Deadline',
          reminderTime,
          completed: false,
          notificationSent: false,
        }

        const response = await apiFetch(
          '/reminders',
          {
            method: 'POST',
            body: JSON.stringify(reminderPayload),
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)

          throw new Error(
            errorData?.message ||
              `Failed to create reminder for "${deadline.title}"`
          )
        }

        createdCount++
      }

      alert(
        `🎉 ${createdCount} reminder${
          createdCount !== 1 ? 's' : ''
        } created successfully!`
      )

      onClose()
    } catch (err) {
      console.error('Create reminders error:', err)

      setError(
        err.message ||
          'Some reminders could not be created.'
      )
    } finally {
      setCreating(false)
    }
  }

  // -----------------------------------------
  // SCAN AGAIN
  // -----------------------------------------
  const scanAgain = () => {
    setResult(null)
    setSelected([])
    setError('')
    setFile(null)
    setText('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div
      className="smart-deadline-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="smart-deadline-modal">

        {/* ================= HEADER ================= */}

        <div className="smart-deadline-header">

          <div>
            <div className="smart-deadline-eyebrow">
              ✦ AI POWERED
            </div>

            <h2>Smart Deadline Detection</h2>

            <p>
              Upload a document or paste text and LIFEOS will
              find important dates automatically.
            </p>
          </div>

          <button
            type="button"
            className="smart-deadline-close"
            onClick={onClose}
            aria-label="Close Smart Deadline Detection"
          >
            ×
          </button>

        </div>

        {/* ================= ERROR ================= */}

        {error && (
          <div className="smart-deadline-error">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* ================= INPUT AREA ================= */}

        {!result && (
          <>

            <div
              className={`smart-deadline-dropzone ${
                dragging ? 'dragging' : ''
              }`}
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />

              <div className="smart-deadline-upload-icon">
                ↑
              </div>

              <h3>
                {file
                  ? file.name
                  : 'Drop your document here'}
              </h3>

              <p>
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                  : 'PDF, PNG, JPG or WebP · Max 20MB'}
              </p>

              {!file && (
                <button
                  type="button"
                  className="smart-deadline-upload-button"
                  onClick={(event) => {
                    event.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                >
                  Upload File
                </button>
              )}

            </div>

            {/* ================= TEXT INPUT ================= */}

            <div className="smart-deadline-text-section">

              <div className="smart-deadline-divider">
                <span>OR</span>
              </div>

              <label htmlFor="deadline-text">
                Paste text
              </label>

              <textarea
                id="deadline-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Paste a syllabus, assignment notice, college circular, project brief..."
                rows={7}
              />

            </div>

            {/* ================= ACTIONS ================= */}

            <div className="smart-deadline-actions">

              <button
                type="button"
                className="smart-deadline-secondary-button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="smart-deadline-primary-button"
                onClick={extractDeadlines}
                disabled={loading || (!file && !text.trim())}
              >
                {loading ? (
                  <>
                    <span className="smart-spinner" />
                    Scanning...
                  </>
                ) : (
                  <>
                    ✦ Scan for Deadlines
                  </>
                )}
              </button>

            </div>

          </>
        )}

        {/* ================= RESULTS ================= */}

        {result && (
          <div className="smart-deadline-results">

            {/* RESULTS HEADER */}

            <div className="smart-results-header">

              <div className="smart-results-heading">

                <div className="smart-results-success">
                  ✓
                </div>

                <div>
                  <strong>
                    {result.deadlines?.length || 0}{' '}
                    {result.deadlines?.length === 1
                      ? 'deadline'
                      : 'deadlines'}{' '}
                    detected
                  </strong>

                  <p>
                    Review the extracted information before
                    creating reminders.
                  </p>
                </div>

              </div>

              <div className="smart-results-actions">

                <button
                  type="button"
                  onClick={selectAll}
                  disabled={
                    selected.length ===
                    result.deadlines.length
                  }
                >
                  Select all
                </button>

                <button
                  type="button"
                  onClick={clearAll}
                  disabled={selected.length === 0}
                >
                  Clear
                </button>

              </div>

            </div>

            {/* DEADLINE LIST */}

            <div className="smart-deadline-list">

              {result.deadlines?.map((deadline) => {

                const isSelected = selected.includes(
                  deadline._id
                )

                const confidence = formatConfidence(
                  deadline.confidence
                )

                return (
                  <div
                    key={deadline._id}
                    className={`smart-deadline-result-card ${
                      isSelected ? 'selected' : ''
                    }`}
                  >

                    {/* CHECKBOX */}

                    <label className="smart-deadline-checkbox">

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleDeadline(deadline._id)
                        }
                      />

                      <span className="smart-custom-checkbox">
                        {isSelected ? '✓' : ''}
                      </span>

                    </label>

                    {/* CONTENT */}

                    <div className="smart-deadline-result-content">

                      {/* BADGES */}

                      <div className="smart-deadline-badges">

                        <span className="smart-type-badge">
                          {formatType(deadline.type)}
                        </span>

                        <span
                          className={`smart-priority-badge ${getPriorityClass(
                            deadline.priority
                          )}`}
                        >
                          {formatPriority(deadline.priority)}
                        </span>

                      </div>

                      {/* TITLE */}

                      <h3>
                        {deadline.title ||
                          'Untitled Deadline'}
                      </h3>

                      {/* DATE / TIME / CONFIDENCE */}

                      <div className="smart-deadline-meta">

                        {deadline.date && (
                          <span>
                            📅 {deadline.date}
                          </span>
                        )}

                        {deadline.time && (
                          <span>
                            🕐 {deadline.time}
                          </span>
                        )}

                        {confidence && (
                          <span>
                            ✦ {confidence} confidence
                          </span>
                        )}

                      </div>

                      {/* EVIDENCE */}

                      {deadline.evidence && (
                        <div className="smart-deadline-evidence">
                          “{deadline.evidence}”
                        </div>
                      )}

                    </div>

                  </div>
                )
              })}

            </div>

            {/* ================= BOTTOM ACTIONS ================= */}

            <div className="smart-results-footer">

              <div className="smart-selection-count">
                <strong>{selected.length}</strong>
                <span>
                  of {result.deadlines?.length || 0}{' '}
                  selected
                </span>
              </div>

              <div className="smart-footer-actions">

                <button
                  type="button"
                  className="smart-deadline-secondary-button"
                  onClick={scanAgain}
                  disabled={creating}
                >
                  ← Scan Again
                </button>

                <button
                  type="button"
                  className="smart-deadline-primary-button"
                  onClick={createReminders}
                  disabled={
                    creating ||
                    selected.length === 0
                  }
                >
                  {creating ? (
                    <>
                      <span className="smart-spinner" />
                      Creating...
                    </>
                  ) : (
                    <>
                      ✓ Create {selected.length}{' '}
                      {selected.length === 1
                        ? 'Reminder'
                        : 'Reminders'}
                    </>
                  )}
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default SmartDeadlineDetection
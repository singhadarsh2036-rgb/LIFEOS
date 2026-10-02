import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from './api'
import './Calendar.css'

const FESTIVALS_2026 = {
  '2026-10-02': { title: "Mahatma Gandhi's Birthday", type: 'Holiday', tone: 'green' },
  '2026-10-20': { title: 'Dussehra', type: 'Holiday', tone: 'green' },
  '2026-10-26': { title: 'Maharishi Valmiki Jayanti', type: 'Festival', tone: 'red' },
  '2026-10-29': { title: 'Karwa Chauth', type: 'Festival', tone: 'red' },
  '2026-11-08': { title: 'Diwali (Deepavali)', type: 'Holiday', tone: 'green' },
  '2026-11-09': { title: 'Govardhan Puja', type: 'Festival', tone: 'red' },
  '2026-11-11': { title: 'Bhai Dooj', type: 'Festival', tone: 'red' },
  '2026-11-15': { title: 'Chhath Puja', type: 'Festival', tone: 'red' },
  '2026-11-24': { title: 'Guru Nanak Jayanti', type: 'Holiday', tone: 'green' },
  '2026-12-23': { title: "Hazarat Ali's Birthday", type: 'Festival', tone: 'red' },
  '2026-12-24': { title: 'Christmas Eve', type: 'Festival', tone: 'red' },
  '2026-12-25': { title: 'Christmas Day', type: 'Holiday', tone: 'green' },
}

const pad = (n) => String(n).padStart(2, '0')

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const formatDate = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function Calendar() {
  const navigate = useNavigate()

  const today = new Date()
  const todayKey = dateKey(today)

  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(todayKey)

  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)

  const [taskTitle, setTaskTitle] = useState('')
  const [reminderTitle, setReminderTitle] = useState('')
  const [reminderTime, setReminderTime] = useState('09:00')

  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const showMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(''), 2500)
  }

  const loadCalendarData = async () => {
    setLoading(true)

    try {
      const [taskResponse, reminderResponse] = await Promise.all([
        apiFetch('/tasks'),
        apiFetch('/reminders'),
      ])

      if (!taskResponse.ok) throw new Error('Could not load tasks')
      if (!reminderResponse.ok) throw new Error('Could not load reminders')

      const taskData = await taskResponse.json()
      const reminderData = await reminderResponse.json()

      setTasks(Array.isArray(taskData) ? taskData : [])
      setReminders(Array.isArray(reminderData) ? reminderData : [])
    } catch (error) {
      console.error('CALENDAR LOAD ERROR:', error)
      showMessage('Could not load calendar data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData()
  }, [])

  const monthName = month.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })

  const calendarCells = useMemo(() => {
    const year = month.getFullYear()
    const monthIndex = month.getMonth()
    const firstDay = new Date(year, monthIndex, 1).getDay()
    const days = new Date(year, monthIndex + 1, 0).getDate()

    const cells = []

    for (let i = 0; i < firstDay; i++) {
      cells.push(null)
    }

    for (let day = 1; day <= days; day++) {
      cells.push(new Date(year, monthIndex, day))
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [month])

  const getTaskDate = (task) => {
    return task?.dueDate || task?.date || task?.dueAt || null
  }

  const getReminderDate = (reminder) => {
    return reminder?.reminderTime || reminder?.date || null
  }

  const tasksForDate = (key) =>
    tasks.filter((task) => {
      const value = getTaskDate(task)
      return value && String(value).slice(0, 10) === key
    })

  const remindersForDate = (key) =>
    reminders.filter((reminder) => {
      const value = getReminderDate(reminder)
      return value && String(value).slice(0, 10) === key
    })

  const selectedTasks = tasksForDate(selectedDate)
  const selectedReminders = remindersForDate(selectedDate)
  const selectedFestival = FESTIVALS_2026[selectedDate]

  const previousMonth = () => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
  }

  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(todayKey)
  }

  const selectDate = (date) => {
    if (!date) return
    setSelectedDate(dateKey(date))
  }

  const createTask = async (event) => {
    event.preventDefault()

    const title = taskTitle.trim()

    if (!title) return

    setSaving(true)

    try {
      const response = await apiFetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          completed: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create task')
      }

      setTaskTitle('')
      setShowTaskModal(false)

      await loadCalendarData()
      showMessage('Task added successfully')
    } catch (error) {
      console.error('CREATE TASK ERROR:', error)
      showMessage('Could not add task')
    } finally {
      setSaving(false)
    }
  }

  const createReminder = async (event) => {
    event.preventDefault()

    const title = reminderTitle.trim()

    if (!title) return

    const reminderDateTime = `${selectedDate}T${reminderTime}:00`

    if (new Date(reminderDateTime) <= new Date()) {
      showMessage('Please choose a future time')
      return
    }

    setSaving(true)

    try {
      const response = await apiFetch('/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          reminderTime: reminderDateTime,
          completed: false,
          notificationSent: false,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create reminder')
      }

      setReminderTitle('')
      setReminderTime('09:00')
      setShowReminderModal(false)

      await loadCalendarData()
      showMessage('Reminder added successfully')
    } catch (error) {
      console.error('CREATE REMINDER ERROR:', error)
      showMessage('Could not add reminder')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="lifeos-calendar-page">
      <header className="lifeos-calendar-header">
        <div>
          <button
            type="button"
            className="lifeos-calendar-back"
            onClick={() => navigate('/dashboard')}
          >
            ← Dashboard
          </button>

          <div className="lifeos-calendar-kicker">LIFEOS / PLANNER</div>
          <h1>Calendar</h1>
          <p>Plan your days, deadlines and reminders in one place.</p>
        </div>

        <button type="button" className="lifeos-calendar-today" onClick={goToday}>
          Today
        </button>
      </header>

      <main className="lifeos-calendar-layout">
        <section className="lifeos-calendar-card">
          <div className="lifeos-calendar-toolbar">
            <button type="button" onClick={previousMonth} aria-label="Previous month">
              ‹
            </button>

            <strong>{monthName}</strong>

            <button type="button" onClick={nextMonth} aria-label="Next month">
              ›
            </button>
          </div>

          <div className="lifeos-calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="lifeos-calendar-grid">
            {calendarCells.map((date, index) => {
              if (!date) {
                return <div className="lifeos-calendar-empty" key={`empty-${index}`} />
              }

              const key = dateKey(date)
              const dateTasks = tasksForDate(key)
              const dateReminders = remindersForDate(key)
              const festival = FESTIVALS_2026[key]

              return (
                <button
                  type="button"
                  key={key}
                  className={[
                    'lifeos-calendar-cell',
                    key === selectedDate ? 'selected' : '',
                    key === todayKey ? 'today' : '',
                  ].join(' ')}
                  onClick={() => selectDate(date)}
                >
                  <span className="lifeos-calendar-day-number">
                    {date.getDate()}
                  </span>

                  <span className="lifeos-calendar-dots">
                    {dateTasks.length > 0 && (
                      <i className="task-dot" title={`${dateTasks.length} task(s)`} />
                    )}

                    {dateReminders.length > 0 && (
                      <i
                        className="reminder-dot"
                        title={`${dateReminders.length} reminder(s)`}
                      />
                    )}

                    {festival && (
                      <i
                        className={`festival-dot ${festival.tone}`}
                        title={festival.title}
                      />
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="lifeos-calendar-legend">
            <span><i className="task-dot" /> Tasks</span>
            <span><i className="reminder-dot" /> Reminders</span>
            <span><i className="festival-dot green" /> Holiday</span>
            <span><i className="festival-dot red" /> Festival</span>
          </div>
        </section>

        <aside className="lifeos-calendar-side">
          <div className="lifeos-calendar-side-date">
            <span>SELECTED DATE</span>
            <h2>{formatDate(selectedDate)}</h2>
          </div>

          <div className="lifeos-calendar-actions">
            <button
              type="button"
              className="calendar-action task-action"
              onClick={() => setShowTaskModal(true)}
            >
              <span>✓</span>
              <div>
                <strong>Add Task</strong>
                <small>Create a task</small>
              </div>
              <b>+</b>
            </button>

            <button
              type="button"
              className="calendar-action reminder-action"
              onClick={() => setShowReminderModal(true)}
            >
              <span>◷</span>
              <div>
                <strong>Add Reminder</strong>
                <small>Set an alert</small>
              </div>
              <b>+</b>
            </button>
          </div>

          <div className="lifeos-calendar-events">
            <div className="lifeos-calendar-events-heading">
              <span>EVENTS</span>
              <small>
                {selectedTasks.length + selectedReminders.length +
                  (selectedFestival ? 1 : 0)}{' '}
                items
              </small>
            </div>

            {selectedFestival && (
              <div className={`calendar-event festival-event ${selectedFestival.tone}`}>
                <span>✦</span>
                <div>
                  <strong>{selectedFestival.title}</strong>
                  <small>{selectedFestival.type}</small>
                </div>
              </div>
            )}

            {selectedTasks.map((task) => (
              <div className="calendar-event task-event" key={`task-${task.id}`}>
                <span>✓</span>
                <div>
                  <strong>{task.title}</strong>
                  <small>Task{task.completed ? ' • Completed' : ''}</small>
                </div>
              </div>
            ))}

            {selectedReminders.map((reminder) => (
              <div
                className="calendar-event reminder-event"
                key={`reminder-${reminder.id}`}
              >
                <span>◷</span>
                <div>
                  <strong>{reminder.title}</strong>
                  <small>
                    Reminder •{' '}
                    {new Date(reminder.reminderTime).toLocaleTimeString('en-IN', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              </div>
            ))}

            {!selectedFestival &&
              selectedTasks.length === 0 &&
              selectedReminders.length === 0 && (
                <div className="lifeos-calendar-empty-state">
                  <span>○</span>
                  <strong>No events yet</strong>
                  <p>Add a task or reminder for this date.</p>
                </div>
              )}
          </div>
        </aside>
      </main>

      {loading && (
        <div className="lifeos-calendar-loading">
          Loading calendar…
        </div>
      )}

      {message && (
        <div className="lifeos-calendar-toast">
          {message}
        </div>
      )}

      {showTaskModal && (
        <div className="lifeos-calendar-modal-backdrop" onMouseDown={() => setShowTaskModal(false)}>
          <div className="lifeos-calendar-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="calendar-modal-close"
              onClick={() => setShowTaskModal(false)}
            >
              ×
            </button>

            <span className="lifeos-calendar-modal-label">NEW TASK</span>
            <h2>Add task</h2>
            <p>{formatDate(selectedDate)}</p>

            <form onSubmit={createTask}>
              <input
                autoFocus
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="What needs to be done?"
              />

              <button type="submit" disabled={saving || !taskTitle.trim()}>
                {saving ? 'Adding…' : 'Add Task'}
              </button>
            </form>

            <small className="calendar-modal-note">
              Note: the current Task API does not yet store a due date, so this task
              will be created but cannot permanently appear on this calendar date until
              the backend gets a dueDate field.
            </small>
          </div>
        </div>
      )}

      {showReminderModal && (
        <div className="lifeos-calendar-modal-backdrop" onMouseDown={() => setShowReminderModal(false)}>
          <div className="lifeos-calendar-modal" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="calendar-modal-close"
              onClick={() => setShowReminderModal(false)}
            >
              ×
            </button>

            <span className="lifeos-calendar-modal-label">NEW REMINDER</span>
            <h2>Add reminder</h2>
            <p>{formatDate(selectedDate)}</p>

            <form onSubmit={createReminder}>
              <input
                autoFocus
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                placeholder="Reminder title"
              />

              <label>
                Time
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </label>

              <button type="submit" disabled={saving || !reminderTitle.trim()}>
                {saving ? 'Adding…' : 'Add Reminder'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar

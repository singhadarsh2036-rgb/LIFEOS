import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Calendar.css'

const API = 'https://lifeos-v22r.onrender.com'

function Calendar() {
  const navigate = useNavigate()

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [reminders, setReminders] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()

  const token = localStorage.getItem('token')

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-lifeos-theme',
      localStorage.getItem('lifeosTheme') || 'light'
    )

    loadCalendarData()
  }, [])

  const loadCalendarData = async () => {
    try {
      setLoading(true)

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [remindersResponse, tasksResponse] = await Promise.all([
        fetch(`${API}/reminders`, { headers }),
        fetch(`${API}/tasks`, { headers }),
      ])

      const remindersData = remindersResponse.ok
        ? await remindersResponse.json()
        : []

      const tasksData = tasksResponse.ok
        ? await tasksResponse.json()
        : []

      setReminders(Array.isArray(remindersData) ? remindersData : [])
      setTasks(Array.isArray(tasksData) ? tasksData : [])
    } catch (error) {
      console.error('CALENDAR ERROR:', error)
    } finally {
      setLoading(false)
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const firstDay = new Date(year, month, 1).getDay()

  const calendarDays = useMemo(() => {
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [firstDay, daysInMonth])

  const monthName = currentDate.toLocaleDateString('en-IN', {
    month: 'long',
  })

  const today = new Date()

  const isToday = (day) => {
    if (!day) return false

    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const isSelected = (day) => {
    if (!day) return false

    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    )
  }

  const changeMonth = (amount) => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + amount,
        1
      )
    )
  }

  const goToday = () => {
    const now = new Date()

    setCurrentDate(now)
    setSelectedDate(now)
  }

  const selectDay = (day) => {
    if (!day) return

    setSelectedDate(
      new Date(year, month, day)
    )
  }

  const sameDay = (dateValue, date) => {
    if (!dateValue) return false

    const value = new Date(dateValue)

    return (
      value.getFullYear() === date.getFullYear() &&
      value.getMonth() === date.getMonth() &&
      value.getDate() === date.getDate()
    )
  }

  const selectedReminders = reminders
    .filter((item) =>
      sameDay(item.reminderTime, selectedDate)
    )
    .sort(
      (a, b) =>
        new Date(a.reminderTime) -
        new Date(b.reminderTime)
    )

  const selectedTasks = tasks.filter((task) => {
    const taskDate =
      task.dueDate ||
      task.deadline ||
      task.createdAt

    return sameDay(taskDate, selectedDate)
  })

  const upcomingCount = reminders.filter(
    (item) =>
      item.reminderTime &&
      new Date(item.reminderTime) >= new Date()
  ).length

  const hasReminder = (day) => {
    if (!day) return false

    const date = new Date(year, month, day)

    return reminders.some((item) =>
      sameDay(item.reminderTime, date)
    )
  }

  const formatTime = (value) => {
    if (!value) return ''

    return new Date(value).toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const selectedDateLabel =
    selectedDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })

  return (
    <main className="calendar-page">

      {/* TOP BAR */}
      <header className="calendar-topbar">

        <button
          type="button"
          className="calendar-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <div className="calendar-brand">
          <div className="calendar-logo">
            L
          </div>

          <div>
            <strong>LIFEOS</strong>
            <span>MAKE LIFE FLOW.</span>
          </div>
        </div>

        <button
          type="button"
          className="calendar-today-button"
          onClick={goToday}
        >
          Today
        </button>

      </header>

      {/* PAGE HEADER */}
      <section className="calendar-page-header">

        <div>
          <span className="calendar-eyebrow">
            YOUR SCHEDULE
          </span>

          <h1>
            Calendar<span>.</span>
          </h1>

          <p>
            See your reminders and important dates in one calm view.
          </p>
        </div>

        <div className="calendar-stats">

          <div className="calendar-stat">
            <strong>{upcomingCount}</strong>
            <span>Upcoming</span>
          </div>

          <div className="calendar-stat">
            <strong>{tasks.length}</strong>
            <span>Tasks</span>
          </div>

        </div>

      </section>

      {/* MAIN CONTENT */}
      <section className="calendar-layout">

        {/* CALENDAR */}
        <div className="calendar-card">

          <div className="calendar-card-header">

            <button
              type="button"
              className="calendar-month-arrow"
              onClick={() => changeMonth(-1)}
            >
              ←
            </button>

            <div className="calendar-month-title">
              <strong>{monthName}</strong>
              <span>{year}</span>
            </div>

            <button
              type="button"
              className="calendar-month-arrow"
              onClick={() => changeMonth(1)}
            >
              →
            </button>

          </div>

          <div className="calendar-weekdays">
            {[
              'Sun',
              'Mon',
              'Tue',
              'Wed',
              'Thu',
              'Fri',
              'Sat',
            ].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">

            {calendarDays.map((day, index) => (
              <button
                key={`${day}-${index}`}
                type="button"
                disabled={!day}
                className={[
                  'calendar-day',
                  isToday(day) ? 'today' : '',
                  isSelected(day) ? 'selected' : '',
                  hasReminder(day) ? 'has-event' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => selectDay(day)}
              >

                {day && (
                  <>
                    <span className="calendar-day-number">
                      {day}
                    </span>

                    {hasReminder(day) && (
                      <span className="calendar-event-dot" />
                    )}
                  </>
                )}

              </button>
            ))}

          </div>

        </div>

        {/* AGENDA */}
        <aside className="calendar-agenda">

          <div className="calendar-agenda-header">

            <div>
              <span className="calendar-eyebrow">
                SELECTED DATE
              </span>

              <h2>
                {selectedDateLabel}
              </h2>
            </div>

            <span className="calendar-agenda-count">
              {selectedReminders.length + selectedTasks.length}
            </span>

          </div>

          {loading ? (
            <div className="calendar-empty">
              <span>✦</span>
              <strong>Loading your schedule...</strong>
            </div>
          ) : selectedReminders.length === 0 &&
            selectedTasks.length === 0 ? (

            <div className="calendar-empty">
              <div className="calendar-empty-icon">
                ✦
              </div>

              <strong>
                Nothing scheduled
              </strong>

              <span>
                Your day is clear. Enjoy the breathing room.
              </span>
            </div>

          ) : (

            <div className="calendar-agenda-list">

              {selectedReminders.map((reminder) => (
                <div
                  className="calendar-agenda-item"
                  key={`reminder-${reminder.id}`}
                >

                  <div className="calendar-agenda-icon reminder">
                    ◷
                  </div>

                  <div className="calendar-agenda-copy">
                    <strong>
                      {reminder.title}
                    </strong>

                    <span>
                      Reminder · {formatTime(reminder.reminderTime)}
                    </span>
                  </div>

                </div>
              ))}

              {selectedTasks.map((task) => (
                <div
                  className="calendar-agenda-item"
                  key={`task-${task.id}`}
                >

                  <div className="calendar-agenda-icon task">
                    ✓
                  </div>

                  <div className="calendar-agenda-copy">
                    <strong>
                      {task.title}
                    </strong>

                    <span>
                      Task
                    </span>
                  </div>

                </div>
              ))}

            </div>

          )}

        </aside>

      </section>

    </main>
  )
}

export default Calendar
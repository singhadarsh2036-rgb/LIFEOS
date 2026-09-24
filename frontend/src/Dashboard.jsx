import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import './DashboardPanels.css'
import './TaskModal.css'

function Dashboard() {
  const navigate = useNavigate()

  const [activeNav, setActiveNav] = useState('Dashboard')
  const [dashboardData, setDashboardData] = useState(null)
  const [tasks, setTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [remindersLoading, setRemindersLoading] = useState(true)
  const [userName, setUserName] = useState('Adarsh')
  const [userLoginIdentifier, setUserLoginIdentifier] = useState('')

  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)

  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeosRecentSearches') || '[]')
    } catch {
      return []
    }
  })

  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileSection, setMobileSection] = useState('')
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [showConsistencyPanel, setShowConsistencyPanel] = useState(false)
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('lifeosTheme') || 'light'
  )
  const [focusRunning, setFocusRunning] = useState(false)
  const [focusSeconds, setFocusSeconds] = useState(25 * 60)
  const [focusLabel, setFocusLabel] = useState('Deep work')
  const [focusMinutesToday, setFocusMinutesToday] = useState(() =>
    Number(localStorage.getItem('lifeosFocusMinutesToday') || 0)
  )

  const navItems = [
    { name: 'Dashboard', icon: '⌂' },
    { name: 'Tasks', icon: '✓' },
    { name: 'Reminders', icon: '◷' },
    { name: 'Habits', icon: '◈' },
    { name: 'Notes', icon: '▤' },
  ]

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 2200)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-lifeos-theme', theme)
    localStorage.setItem('lifeosTheme', theme)
  }, [theme])

  useEffect(() => {
    if (!focusRunning) return

    const timer = setInterval(() => {
      setFocusSeconds((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [focusRunning])

  useEffect(() => {
    if (focusSeconds !== 0 || !focusRunning) return

    setFocusRunning(false)
    setFocusMinutesToday((current) => {
      const next = current + 25
      localStorage.setItem('lifeosFocusMinutesToday', String(next))
      return next
    })
    setFocusSeconds(25 * 60)
    showMessage('🎉 Focus session complete! +25 minutes')
  }, [focusSeconds, focusRunning])

  const formatFocusTime = (seconds) =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  const startFocus = () => setFocusRunning(true)

  const resetFocus = () => {
    setFocusRunning(false)
    setFocusSeconds(25 * 60)
  }

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const getConsistencyDates = () => {
    try {
      return JSON.parse(localStorage.getItem('lifeosConsistencyDates') || '[]')
    } catch {
      return []
    }
  }

  const getConsistencyStats = () => {
    const uniqueDates = [...new Set(getConsistencyDates())].sort().reverse()

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, bestStreak: 0, activeDays: 0 }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const toDate = (value) => {
      const date = new Date(`${value}T00:00:00`)
      return date
    }

    let currentStreak = 0
    let cursor = new Date(today)

    for (const value of uniqueDates) {
      const date = toDate(value)
      const diff = Math.round((cursor - date) / 86400000)

      if (diff === 0) {
        currentStreak += 1
        cursor.setDate(cursor.getDate() - 1)
      } else if (diff > 0) {
        break
      }
    }

    let bestStreak = 0
    let running = 0
    let previous = null

    for (const value of [...uniqueDates].sort()) {
      const date = toDate(value)

      if (!previous) {
        running = 1
      } else {
        const diff = Math.round((date - previous) / 86400000)
        running = diff === 1 ? running + 1 : 1
      }

      bestStreak = Math.max(bestStreak, running)
      previous = date
    }

    return {
      currentStreak,
      bestStreak,
      activeDays: uniqueDates.length,
    }
  }

  const recordConsistency = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-')

    const dates = getConsistencyDates()

    if (!dates.includes(todayKey)) {
      localStorage.setItem(
        'lifeosConsistencyDates',
        JSON.stringify([...dates, todayKey])
      )
    }

    setShowConsistencyPanel(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  const saveRecentSearch = (value) => {
    const cleanValue = value.trim()
    if (!cleanValue) return

    setRecentSearches((current) => {
      const next = [
        cleanValue,
        ...current.filter(
          (item) => item.toLowerCase() !== cleanValue.toLowerCase()
        ),
      ].slice(0, 5)

      localStorage.setItem('lifeosRecentSearches', JSON.stringify(next))
      return next
    })
  }

  const clearRecentSearches = () => {
    localStorage.removeItem('lifeosRecentSearches')
    setRecentSearches([])
  }

  const searchTerm = searchQuery.trim().toLowerCase()

  const pageResults = [
    {
      type: 'Page',
      title: 'Dashboard',
      subtitle: 'Open Dashboard',
      keywords: 'dashboard home main',
      action: () => navigate('/dashboard'),
    },
    {
      type: 'Page',
      title: 'Tasks',
      subtitle: 'Open Tasks',
      keywords: 'tasks task todo to-do',
      action: () => window.location.href = '/tasks',
    },
    {
      type: 'Page',
      title: 'Reminders',
      subtitle: 'Open Reminders',
      keywords: 'reminders reminder notification alarm',
      action: () => window.location.href = '/reminders',
    },
    {
      type: 'Page',
      title: 'Travel',
      subtitle: 'Open Travel Planner',
      keywords: 'travel trip flights hotels vacation journey',
      action: () => navigate('/trips'),
    },
    {
      type: 'Page',
      title: 'Calendar',
      subtitle: 'Open Calendar',
      keywords: 'calendar date schedule events',
      action: () => navigate('/calendar'),
    },
    {
      type: 'Page',
      title: 'Habits',
      subtitle: 'Habits section',
      keywords: 'habit habits routine streak',
      action: () => showMessage('Habits section coming soon'),
    },
    {
      type: 'Page',
      title: 'Notes',
      subtitle: 'Notes section',
      keywords: 'note notes notebook',
      action: () => showMessage('Notes section coming soon'),
    },
    {
      type: 'Page',
      title: 'Focus',
      subtitle: 'Open Focus Mode',
      keywords: 'focus pomodoro timer deep work',
      action: () => {
        setShowFocusPanel(true)
        setShowConsistencyPanel(false)
        setShowProfilePanel(false)
        setShowSettingsPanel(false)
      },
    },
    {
      type: 'Page',
      title: 'Profile',
      subtitle: 'Open your profile',
      keywords: 'profile account user me',
      action: () => {
        setShowProfilePanel(true)
        setShowSettingsPanel(false)
        setShowFocusPanel(false)
        setShowConsistencyPanel(false)
      },
    },
    {
      type: 'Page',
      title: 'Settings',
      subtitle: 'Open app settings',
      keywords: 'settings preferences configuration',
      action: () => {
        setShowSettingsPanel(true)
        setShowProfilePanel(false)
        setShowFocusPanel(false)
        setShowConsistencyPanel(false)
      },
    },
    {
      type: 'Page',
      title: 'Analytics',
      subtitle: 'Analytics section',
      keywords: 'analytics statistics stats progress',
      action: () => showMessage('Analytics section coming soon'),
    },
  ]

  const searchResults = searchTerm
    ? [
        ...pageResults.filter((page) =>
          `${page.title} ${page.keywords}`
            .toLowerCase()
            .includes(searchTerm)
        ),
        ...tasks
          .filter((task) =>
            String(task.title || '').toLowerCase().includes(searchTerm)
          )
          .map((task) => ({
            type: 'Task',
            title: task.title,
            subtitle: 'Open Tasks',
            action: () => window.location.href = '/tasks',
          })),
        ...reminders
          .filter((reminder) =>
            String(reminder.title || '').toLowerCase().includes(searchTerm)
          )
          .map((reminder) => ({
            type: 'Reminder',
            title: reminder.title,
            subtitle: 'Open Reminders',
            action: () => window.location.href = '/reminders',
          })),
      ]
    : []

  /* ================================
     LOAD LOGGED-IN USER
  ================================= */

  const loadUser = async () => {
    try {
      const token = getToken()

      if (!token) {
        return
      }

      const parts = token.split('.')

      if (parts.length !== 3) {
        throw new Error('Invalid JWT token')
      }

      const payload = JSON.parse(
        atob(parts[1])
      )

      const loginIdentifier = payload.sub

      if (!loginIdentifier) {
        return
      }

      setUserLoginIdentifier(loginIdentifier)

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/users'
      )

      if (!response.ok) {
        throw new Error('Could not load users')
      }

      const users = await response.json()

      const currentUser = users.find(
        (user) =>
          user.email === loginIdentifier ||
          user.phone === loginIdentifier
      )

      if (currentUser?.name) {
        setUserName(currentUser.name)
      }

    } catch (error) {
      console.error('USER LOAD ERROR:', error)
    }
  }

  /* ================================
     NAVIGATION
  ================================= */

  const closeMobileNav = () => setMobileNavOpen(false)

  const handleMobileSection = (name, selector) => {
    setActiveNav(name)
    setMobileSection(name === 'Calendar' ? 'calendar' : name === 'Focus' ? 'focus' : name === 'Habits' ? 'habits' : '')
    closeMobileNav()
    window.setTimeout(() => {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
  }

  const handleNavigation = (name) => {
    setActiveNav(name)

    if (name === 'Dashboard') {
      setMobileSection('')
      navigate('/dashboard')
      return
    }

    if (name === 'Tasks') {
      window.location.href = '/tasks'
      return
    }

    if (name === 'Reminders') {
      window.location.href = '/reminders'
      return
    }

    showMessage(`${name} section coming soon`)
  }

  /* ================================
     LOAD DASHBOARD
  ================================= */

  const loadDashboard = async () => {
    try {
      const token = getToken()

      if (!token) {
        showMessage('Please login again')
        return
      }

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/dashboard',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Could not load dashboard')
      }

      const data = await response.json()

      setDashboardData(data)
    } catch (error) {
      console.error('DASHBOARD ERROR:', error)
      showMessage('Could not load dashboard')
    } finally {
      setLoading(false)
    }
  }

  /* ================================
     LOAD TASKS
  ================================= */

  const loadTasks = async () => {
    try {
      const token = getToken()

      if (!token) {
        return
      }

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/tasks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Could not load tasks')
      }

      const data = await response.json()

      setTasks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('TASK ERROR:', error)
      showMessage('Could not load tasks')
    } finally {
      setTasksLoading(false)
    }
  }

  /* ================================
     LOAD REMINDERS
  ================================= */

  const loadReminders = async () => {
    try {
      const token = getToken()

      if (!token) {
        return
      }

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/reminders',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Could not load reminders')
      }

      const data = await response.json()

      setReminders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('REMINDER ERROR:', error)
      showMessage('Could not load reminders')
    } finally {
      setRemindersLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
    loadDashboard()
    loadTasks()
    loadReminders()
  }, [])

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        const input = document.querySelector('.search-box input')
        input?.focus()
        setShowSearchResults(true)
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  /* ================================
     CREATE TASK
  ================================= */

  const createTask = async (event) => {
    event.preventDefault()

    const title = newTaskTitle.trim()

    if (!title) {
      showMessage('Enter a task title')
      return
    }

    try {
      setSavingTask(true)

      const token = getToken()

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/tasks',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title,
            completed: false,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        throw new Error(
          errorText || 'Could not create task'
        )
      }

      const createdTask = await response.json()

      setTasks((currentTasks) => [
        ...currentTasks,
        createdTask,
      ])

      setNewTaskTitle('')
      setShowTaskModal(false)

      await loadDashboard()

      showMessage('Task added successfully')
    } catch (error) {
      console.error('CREATE TASK ERROR:', error)
      showMessage('Could not create task')
    } finally {
      setSavingTask(false)
    }
  }

  /* ================================
     TOGGLE TASK
  ================================= */

  const toggleTask = async (task) => {
    const newCompleted = !task.completed

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              completed: newCompleted,
            }
          : currentTask
      )
    )

    try {
      const token = getToken()

      const response = await fetch(
        `https://lifeos-v22r.onrender.com/tasks/${task.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: task.title,
            completed: newCompleted,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Could not update task')
      }

      if (newCompleted) {
        setTasks((currentTasks) =>
          currentTasks.filter((currentTask) => currentTask.id !== task.id)
        )
        recordConsistency()
      }

      await loadDashboard()
    } catch (error) {
      console.error('UPDATE TASK ERROR:', error)

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id
            ? {
                ...currentTask,
                completed: task.completed,
              }
            : currentTask
        )
      )

      showMessage('Could not update task')
    }
  }

  /* ================================
     STATS
  ================================= */

  const totalTasks =
    dashboardData?.totalTasks ?? 0

  const completedTasks =
    dashboardData?.completedTasks ?? 0

  const progress =
    totalTasks > 0
      ? Math.round(
          (completedTasks / totalTasks) * 100
        )
      : 0

  const longestStreak =
    dashboardData?.longestHabitStreak ?? 0

  const totalNotes =
    dashboardData?.totalNotes ?? 0


  const today = new Date()

  const [calendarMonth, setCalendarMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const [selectedCalendarDate, setSelectedCalendarDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  )

  const monthName = calendarMonth.toLocaleDateString('en-IN', {
    month: 'long',
  })

  const yearNumber = calendarMonth.getFullYear()
  const calendarMonthNumber = calendarMonth.getMonth()

  const isCurrentMonth =
    yearNumber === today.getFullYear() &&
    calendarMonthNumber === today.getMonth()

  const dayNumber = isCurrentMonth ? today.getDate() : null

  const firstDay = new Date(
    yearNumber,
    calendarMonthNumber,
    1
  ).getDay()

  const daysInMonth = new Date(
    yearNumber,
    calendarMonthNumber + 1,
    0
  ).getDate()

  const reminderDates = new Set(
    reminders
      .filter((reminder) => reminder.reminderTime)
      .map((reminder) => {
        const reminderDate = new Date(reminder.reminderTime)

        return (
          reminderDate.getFullYear() === yearNumber &&
          reminderDate.getMonth() === calendarMonthNumber
        )
          ? reminderDate.getDate()
          : null
      })
      .filter(Boolean)
  )

  const calendarCells = [
    ...Array(firstDay).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ]

  const selectCalendarDay = (day) => {
    if (!day) return

    const selectedDate = new Date(
      yearNumber,
      calendarMonthNumber,
      day
    )

    setSelectedCalendarDate(selectedDate)
  }

  const goToPreviousMonth = () => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() - 1,
          1
        )
    )
  }

  const goToNextMonth = () => {
    setCalendarMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          1
        )
    )
  }

  const goToToday = () => {
    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )

    setCalendarMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    )

    setSelectedCalendarDate(currentDate)
  }

  const selectedDateReminders = reminders
    .filter((reminder) => reminder.reminderTime)
    .filter((reminder) => {
      const reminderDate = new Date(reminder.reminderTime)

      return (
        reminderDate.getFullYear() ===
          selectedCalendarDate.getFullYear() &&
        reminderDate.getMonth() ===
          selectedCalendarDate.getMonth() &&
        reminderDate.getDate() ===
          selectedCalendarDate.getDate()
      )
    })
    .sort(
      (a, b) =>
        new Date(a.reminderTime) -
        new Date(b.reminderTime)
    )

  const dateLabel = today
    .toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .toUpperCase()

  const currentHour = today.getHours()
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
        ? 'Good afternoon'
        : currentHour < 21
          ? 'Good evening'
          : 'Good night'

  const totalHabits = dashboardData?.totalHabits ?? 0
  const completedHabitsToday = dashboardData?.completedHabitsToday ?? 0
  const habitProgress =
    totalHabits > 0
      ? Math.round((completedHabitsToday / totalHabits) * 100)
      : 0


  return (
    <>
      <style>{`
        .lifeos-top-actions {
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 10px !important;
          position: relative !important;
          z-index: 10050 !important;
        }

        .lifeos-theme-toggle {
          height: 44px !important;
          min-width: 78px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 7px !important;
          padding: 0 12px !important;
          border-radius: 14px !important;
          border: 1px solid rgba(112,73,232,.14) !important;
          background: rgba(255,255,255,.88) !important;
          color: #51466a !important;
          cursor: pointer !important;
          box-shadow: 0 8px 24px rgba(80,50,130,.08) !important;
          transition: .2s ease !important;
        }

        .lifeos-theme-toggle:hover {
          transform: translateY(-1px) !important;
          background: #fff !important;
          box-shadow: 0 12px 30px rgba(80,50,130,.14) !important;
        }

        .lifeos-theme-icon {
          width: 26px !important;
          height: 26px !important;
          display: grid !important;
          place-items: center !important;
          border-radius: 50% !important;
          background: #eee7ff !important;
          color: #7049e8 !important;
          font-size: 15px !important;
          line-height: 1 !important;
        }

        .lifeos-theme-label {
          font-size: 11px !important;
          font-weight: 800 !important;
          color: #51466a !important;
        }

        .lifeos-hero {
          position: relative !important;
          overflow: hidden !important;
        }

        .lifeos-hero-overlay {
          position: absolute !important;
          inset: 0 !important;
          z-index: 1 !important;
          background: linear-gradient(90deg, rgba(5,3,12,.84) 0%, rgba(5,3,12,.62) 32%, rgba(5,3,12,.28) 62%, rgba(5,3,12,.08) 100%) !important;
        }

        .lifeos-hero-content {
          position: relative !important;
          z-index: 3 !important;
        }

        .lifeos-hero-content .lifeos-date-label,
        .lifeos-hero-content h1,
        .lifeos-hero-content p {
          text-shadow: 0 3px 14px rgba(0,0,0,.72) !important;
        }

        .lifeos-hero-content h1 { color: #fff !important; }
        .lifeos-hero-content h1 strong { color: #d7c2ff !important; }
        .lifeos-hero-content p { color: rgba(255,255,255,.94) !important; }

        .lifeos-hero-meta span {
          color: #fff !important;
          background: rgba(8,5,17,.52) !important;
          border-color: rgba(255,255,255,.16) !important;
          backdrop-filter: blur(12px) !important;
        }

        html[data-lifeos-theme="dark"] .lifeos-theme-toggle {
          background: rgba(30,21,48,.94) !important;
          border-color: rgba(167,139,250,.24) !important;
          color: #f5f3ff !important;
        }

        html[data-lifeos-theme="dark"] .lifeos-theme-icon {
          background: rgba(139,92,246,.20) !important;
          color: #d8c5ff !important;
        }

        html[data-lifeos-theme="dark"] .lifeos-theme-label {
          color: #f5f3ff !important;
        }

        @media (max-width: 700px) {
          .lifeos-top-actions { gap: 6px !important; }
          .lifeos-theme-toggle {
            width: 44px !important;
            min-width: 44px !important;
            height: 44px !important;
            padding: 0 !important;
          }
          .lifeos-theme-label { display: none !important; }
          .lifeos-theme-icon { width: 27px !important; height: 27px !important; }
        }
      `}</style>
      <div className="dashboard-page">

      <aside className="sidebar" style={{ display: 'none' }}>
        <div className="brand">
          <div className="brand-mark">L</div>
          <div>
            <div className="brand-name">LIFEOS</div>
            <div className="brand-subtitle">YOUR LIFE. ORGANIZED.</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {[
            ['Dashboard', '⌂'],
            ['Tasks', '✓'],
            ['Calendar', '□'],
            ['Reminders', '◷'],
            ['Travel', '✈'],
            ['Habits', '◈'],
            ['Notes', '▤'],
            ['Focus', '◉'],
            ['Analytics', '◌'],
          ].map(([name, icon]) => (
            <button
              key={name}
              className={`nav-item ${activeNav === name ? 'active' : ''}`}
              onClick={() => {
                if (name === 'Tasks') {
                  window.location.href = '/tasks'
                  return
                }
                if (name === 'Reminders') {
                  window.location.href = '/reminders'
                  return
                }
                if (name === 'Travel') {
                  navigate('/trips')
                  return
                }
                if (name === 'Calendar') {
                  navigate('/calendar')
                  return
                }
                handleNavigation(name)
              }}
            >
              <span className="nav-icon">{icon}</span>
              <span>{name}</span>
              {activeNav === name && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        <div className="quick-actions">
          <div className="quick-title">QUICK ACTIONS</div>
          <button onClick={() => setShowTaskModal(true)}>＋ Add Task</button>
          <button onClick={() => window.location.href = '/reminders'}>＋ Add Reminder</button>
          <button onClick={() => showMessage('Notes section coming soon')}>＋ New Note</button>
          <button onClick={() => showMessage('Habits section coming soon')}>＋ Track Habit</button>
        </div>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setShowSettingsPanel(true)}>
            <span className="nav-icon">⚙</span><span>Settings</span>
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <span className="nav-icon">↪</span><span>Logout</span>
          </button>
        </div>

        <button
          className="sidebar-profile"
          type="button"
          onClick={() => setShowProfilePanel(true)}
          style={{ width: '100%', border: '0', textAlign: 'left', cursor: 'pointer' }}
        >
          <div className="mini-avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <strong>{userName}</strong>
            <small>Free Plan</small>
          </div>
          <span>›</span>
        </button>
      </aside>

      {mobileNavOpen && (
        <>
          <button
            type="button"
            className="lifeos-menu-backdrop"
            aria-label="Close LIFEOS menu"
            onClick={() => setMobileNavOpen(false)}
          />

          <aside
            className="lifeos-menu-drawer"
            aria-label="LIFEOS navigation menu"
          >
            <div className="lifeos-drawer-header">
              <div className="lifeos-drawer-brand">
                <div className="lifeos-drawer-logo">L</div>
                <div>
                  <strong>LIFEOS</strong>
                  <span>MAKE LIFE FLOW.</span>
                </div>
              </div>

              <button
                type="button"
                className="lifeos-drawer-close"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="lifeos-drawer-label">YOUR LIFE</div>

            <nav className="lifeos-drawer-nav">
              {[
                ['Dashboard', '⌂'],
                ['Tasks', '✓'],
                ['Calendar', '□'],
                ['Reminders', '◷'],
                ['Travel', '✈'],
                ['Habits', '◈'],
                ['Notes', '▤'],
                ['Focus', '◉'],
                ['Analytics', '◌'],
              ].map(([name, icon]) => (
                <button
                  key={name}
                  className={`lifeos-drawer-item ${
                    activeNav === name ? 'active' : ''
                  }`}
                  type="button"
                  onClick={() => {
                    if (name === 'Dashboard') {
                      setActiveNav(name)
                      setMobileSection('')
                      setMobileNavOpen(false)
                      navigate('/dashboard')
                      return
                    }

                    if (name === 'Tasks') {
                      setMobileNavOpen(false)
                      window.location.href = '/tasks'
                      return
                    }

                    if (name === 'Reminders') {
                      setMobileNavOpen(false)
                      window.location.href = '/reminders'
                      return
                    }

                    if (name === 'Travel') {
                      setMobileNavOpen(false)
                      navigate('/trips')
                      return
                    }

                    if (name === 'Calendar') {
                      setActiveNav('Calendar')
                      setMobileNavOpen(false)
                      navigate('/calendar')
                      return
                    }

                    if (name === 'Focus') {
                      handleMobileSection(name, '.focus-card')
                      return
                    }

                    if (name === 'Habits') {
                      handleMobileSection(name, '.habits-card')
                      return
                    }

                    setMobileNavOpen(false)
                    showMessage(`${name} section coming soon`)
                  }}
                >
                  <span className="lifeos-drawer-icon">{icon}</span>
                  <span className="lifeos-drawer-text">{name}</span>
                  <span className="lifeos-drawer-arrow">›</span>
                </button>
              ))}
            </nav>

            <div className="lifeos-drawer-divider" />

            <button
              type="button"
              className="lifeos-drawer-item"
              onClick={() => {
                setMobileNavOpen(false)
                setShowSettingsPanel(true)
              }}
            >
              <span className="lifeos-drawer-icon">⚙</span>
              <span className="lifeos-drawer-text">Settings</span>
              <span className="lifeos-drawer-arrow">›</span>
            </button>

            <button
              type="button"
              className="lifeos-drawer-profile"
              onClick={() => {
                setMobileNavOpen(false)
                setShowProfilePanel(true)
              }}
            >
              <div className="lifeos-drawer-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>

              <div className="lifeos-drawer-profile-copy">
                <strong>{userName}</strong>
                <span>Free Plan</span>
              </div>

              <span className="lifeos-drawer-arrow">›</span>
            </button>
          </aside>
        </>
      )}

      <main className={`dashboard-main lifeos-premium-dashboard ${mobileSection ? `mobile-section-${mobileSection}` : ''}`}>
        <header className="lifeos-topbar">
          <button
            className={`lifeos-menu-button ${mobileNavOpen ? 'open' : ''}`}
            type="button"
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-label={mobileNavOpen ? 'Close LIFEOS menu' : 'Open LIFEOS menu'}
          >
            <span>{mobileNavOpen ? '×' : '☰'}</span>
          </button>

          <button className="lifeos-mobile-brand" type="button" onClick={() => navigate('/dashboard')}>
            <span className="lifeos-logo-mark">⌛</span>
            <span>LIFEOS</span>
          </button>

          <div className="lifeos-search-shell" onMouseLeave={() => setShowSearchResults(false)}>
            <span className="lifeos-search-icon">⌕</span>
            <input
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setShowSearchResults(true)
              }}
              onFocus={() => setShowSearchResults(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setShowSearchResults(false)
                  setSearchQuery('')
                }
                if (event.key === 'Enter' && searchTerm && searchResults[0]) {
                  saveRecentSearch(searchQuery)
                  setShowSearchResults(false)
                  setSearchQuery('')
                  searchResults[0].action()
                }
              }}
            />
            <button className="lifeos-search-mic" type="button" aria-label="Voice search">⌕</button>
            <button className="lifeos-search-filter" type="button" aria-label="Filter search">☷</button>

            {showSearchResults && (
              <div className="lifeos-global-search-dropdown">
                {!searchTerm ? (
                  <div className="lifeos-search-recent">
                    <div className="lifeos-search-heading"><span>Recent searches</span>{recentSearches.length > 0 && <button type="button" onClick={clearRecentSearches}>Clear</button>}</div>
                    {recentSearches.length > 0 ? recentSearches.map((item) => (
                      <button key={item} type="button" className="lifeos-search-recent-item" onClick={() => { setSearchQuery(item); setShowSearchResults(true) }}>
                        <span>◷</span><span>{item}</span>
                      </button>
                    )) : (
                      <div className="lifeos-search-empty compact"><span>⌕</span><strong>Search your LIFEOS</strong><small>Try a task, reminder or page.</small></div>
                    )}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="lifeos-search-empty compact"><span>⌕</span><strong>No results found</strong><small>Try another task, reminder or page name.</small></div>
                ) : (
                  <div className="lifeos-search-results">
                    <div className="lifeos-search-heading"><span>Results</span><small>{Math.min(searchResults.length, 8)} found</small></div>
                    {searchResults.slice(0, 8).map((result, index) => (
                      <button key={`${result.type}-${result.title}-${index}`} type="button" className="lifeos-search-result-item" onClick={() => { saveRecentSearch(searchQuery); setShowSearchResults(false); setSearchQuery(''); result.action() }}>
                        <span className="lifeos-search-result-icon">{result.type === 'Task' ? '✓' : result.type === 'Reminder' ? '◷' : '✦'}</span>
                        <span className="lifeos-search-result-copy"><strong>{result.title}</strong><small>{result.subtitle}</small></span>
                        <span className="lifeos-search-arrow">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lifeos-top-actions">
            <button
              className="lifeos-icon-button"
              type="button"
              onClick={() => setShowNotificationPanel((current) => !current)}
              aria-label="Notifications"
              title="Notifications"
            >
              ♧
              {reminders.filter(
                (reminder) =>
                  reminder.reminderTime &&
                  new Date(reminder.reminderTime) > new Date()
              ).length > 0 && (
                <span className="lifeos-notification-badge">
                  {Math.min(
                    reminders.filter(
                      (reminder) =>
                        reminder.reminderTime &&
                        new Date(reminder.reminderTime) > new Date()
                    ).length,
                    9
                  )}
                </span>
              )}
            </button>

            <button
              className="lifeos-theme-toggle"
              type="button"
              onClick={() => {
                setTheme((current) =>
                  current === 'light' ? 'dark' : 'light'
                )
              }}
              aria-label={
                theme === 'light'
                  ? 'Switch to dark mode'
                  : 'Switch to light mode'
              }
              title={
                theme === 'light'
                  ? 'Switch to dark mode'
                  : 'Switch to light mode'
              }
            >
              <span className="lifeos-theme-icon">
                {theme === 'light' ? '☾' : '☀'}
              </span>
              <span className="lifeos-theme-label">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>

            <button
              className="lifeos-avatar-button"
              type="button"
              onClick={() => setShowProfilePanel(true)}
              aria-label="Open profile"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
          </div>
        </header>

        <section className="lifeos-hero">
          <div className="lifeos-hero-image" aria-hidden="true" />
          <div className="lifeos-hero-overlay" aria-hidden="true" />
          <div className="lifeos-hero-content">
            <span className="lifeos-date-label">{dateLabel}</span>
            <h1>{greeting}, <strong>{userName}!</strong> <span>👋</span></h1>
            <p>Small steps today, a bigger tomorrow.</p>
            <div className="lifeos-hero-meta">
              <span>✦ {longestStreak > 0 ? `${longestStreak}-day streak` : 'Start your streak today'}</span>
              <span>{reminders.length} upcoming reminder{reminders.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </section>

        <section className="lifeos-week-section">
          <div className="lifeos-section-heading">
            <div><span className="lifeos-eyebrow">YOUR WEEK</span><h2>This Week</h2></div>
            <button type="button" className="lifeos-link-button" onClick={() => navigate('/calendar')}>View Calendar <span>→</span></button>
          </div>
          <div className="lifeos-week-grid">
            {Array.from({ length: 7 }, (_, index) => {
              const day = new Date(today)
              day.setDate(today.getDate() + index - (today.getDay() === 0 ? 0 : today.getDay() - 1))
              const isToday = day.toDateString() === today.toDateString()
              const weekday = day.toLocaleDateString('en-IN', { weekday: 'short' })
              const number = day.getDate()
              const dayReminderCount = reminders.filter((reminder) => reminder.reminderTime && new Date(reminder.reminderTime).toDateString() === day.toDateString()).length
              return (
                <button key={day.toISOString()} type="button" className={`lifeos-day-chip ${isToday ? 'active' : ''}`} onClick={() => navigate('/calendar')}>
                  <span>{weekday}</span><strong>{number}</strong>{dayReminderCount > 0 && <i />}
                </button>
              )
            })}
          </div>
        </section>

        <section className="lifeos-focus-card">
          <div className="lifeos-focus-glow" />
          <div className="lifeos-card-heading">
            <div><span className="lifeos-card-icon">◉</span><div><span className="lifeos-eyebrow">TODAY</span><h2>Today's Focus</h2></div></div>
            <span className="lifeos-progress-pill">{completedTasks}/{totalTasks || 0}</span>
          </div>
          {tasksLoading ? (
            <div className="lifeos-empty-focus"><strong>Loading your focus...</strong></div>
          ) : tasks.length === 0 ? (
            <div className="lifeos-empty-focus">
              <div className="lifeos-sprout">✦</div>
              <strong>No active tasks yet</strong>
              <span>Add a task or let LIFEOS suggest one for you.</span>
              <div className="lifeos-focus-actions">
                <button type="button" className="lifeos-primary-button" onClick={() => setShowTaskModal(true)}>＋ Add Task</button>
                <button type="button" className="lifeos-secondary-button" onClick={() => showMessage('AI suggestions are coming next')}>✦ Suggest with AI</button>
              </div>
            </div>
          ) : (
            <div className="lifeos-task-list">
              {tasks.slice(0, 4).map((task) => (
                <button key={task.id} type="button" className={`lifeos-task-item ${task.completed ? 'completed' : ''}`} onClick={() => toggleTask(task)}>
                  <span className="lifeos-task-check">{task.completed ? '✓' : ''}</span>
                  <span className="lifeos-task-copy"><strong>{task.title}</strong><small>{task.completed ? 'Completed' : 'Today · Focus item'}</small></span>
                  <span>›</span>
                </button>
              ))}
              <button type="button" className="lifeos-add-inline" onClick={() => setShowTaskModal(true)}>＋ Add another task</button>
            </div>
          )}
        </section>

        <section className="lifeos-deadline-card">
          <div className="lifeos-deadline-copy">
            <div className="lifeos-card-heading">
              <div><span className="lifeos-ai-icon">✦</span><div><span className="lifeos-eyebrow">AI POWERED</span><h2>Smart Deadline Detection</h2></div></div>
              <span className="lifeos-beta">BETA</span>
            </div>
            <p>Drop a syllabus, brief, screenshot or PDF and let LIFEOS extract the important deadlines automatically.</p>
            <button type="button" className="lifeos-primary-button" onClick={() => showMessage('Smart Deadline Detection UI is ready — AI connection next')}>Scan for Deadlines <span>→</span></button>
          </div>
          <div className="lifeos-deadline-art" aria-hidden="true"><span>▤</span><i>✦</i><b>✦</b></div>
        </section>

        <section className="lifeos-upcoming-section">
          <div className="lifeos-section-heading">
            <div><span className="lifeos-eyebrow">DON'T MISS</span><h2>Upcoming Deadlines</h2></div>
            <button type="button" className="lifeos-link-button" onClick={() => window.location.href = '/reminders'}>See All <span>→</span></button>
          </div>
          <div className="lifeos-deadline-list">
            {remindersLoading ? (
              <div className="lifeos-deadline-empty">Loading upcoming reminders...</div>
            ) : reminders.filter((reminder) => reminder.reminderTime && new Date(reminder.reminderTime) >= new Date()).slice(0, 4).length === 0 ? (
              <div className="lifeos-deadline-empty"><span>✦</span><strong>Nothing urgent.</strong><small>Your upcoming reminders will appear here.</small></div>
            ) : (
              reminders.filter((reminder) => reminder.reminderTime && new Date(reminder.reminderTime) >= new Date()).sort((a,b) => new Date(a.reminderTime) - new Date(b.reminderTime)).slice(0,4).map((reminder) => {
                const d = new Date(reminder.reminderTime)
                const diffHours = Math.max(0, Math.round((d - new Date()) / 3600000))
                return (
                  <button key={reminder.id} type="button" className="lifeos-deadline-row" onClick={() => window.location.href = '/reminders'}>
                    <span className={`lifeos-deadline-dot ${diffHours < 3 ? 'urgent' : diffHours < 24 ? 'soon' : ''}`}>!</span>
                    <span className="lifeos-deadline-info"><strong>{reminder.title}</strong><small>{d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</small></span>
                    <span className={`lifeos-due-pill ${diffHours < 3 ? 'urgent' : diffHours < 24 ? 'soon' : ''}`}>{diffHours < 1 ? 'Due now' : diffHours < 24 ? `In ${diffHours}h` : `In ${Math.ceil(diffHours / 24)}d`}</span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <nav className="lifeos-bottom-nav" aria-label="Primary navigation">
          <button className="active" type="button" onClick={() => { setActiveNav('Dashboard'); setMobileSection('') }}><span>⌂</span><small>Today</small></button>
          <button type="button" onClick={() => navigate('/calendar')}><span>□</span><small>Calendar</small></button>
          <button className="lifeos-add-button" type="button" onClick={() => setShowTaskModal(true)} aria-label="Add task">＋</button>
          <button type="button" onClick={() => window.location.href = '/reminders'}><span>♧</span><small>Inbox</small>{reminders.length > 0 && <i>{Math.min(reminders.length, 9)}</i>}</button>
          <button type="button" onClick={() => setShowProfilePanel(true)}><span>◯</span><small>Profile</small></button>
        </nav>
      </main>

      {showProfilePanel && (
        <div className="lifeos-panel-overlay" onClick={() => setShowProfilePanel(false)}>
          <div className="lifeos-premium-panel" onClick={(event) => event.stopPropagation()}>
            <div className="lifeos-panel-glow" />

            <div className="lifeos-panel-header">
              <div>
                <span className="section-label">YOUR ACCOUNT</span>
                <h2>Profile</h2>
                <p>Your LIFEOS account at a glance.</p>
              </div>
              <button className="lifeos-panel-close" onClick={() => setShowProfilePanel(false)}>×</button>
            </div>

            <div className="lifeos-profile-hero">
              <div className="lifeos-profile-avatar">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3>{userName}</h3>
                <span>Free Plan · LIFEOS member</span>
              </div>
            </div>

            <div className="lifeos-profile-grid">
              <div className="lifeos-info-card">
                <small>LOGIN</small>
                <strong>{userLoginIdentifier || 'Not available'}</strong>
              </div>
              <div className="lifeos-info-card">
                <small>PLAN</small>
                <strong>Free Plan</strong>
              </div>
            </div>

            <div className="lifeos-panel-actions">
              <button className="lifeos-secondary-action" onClick={() => {
                setShowProfilePanel(false)
                setShowSettingsPanel(true)
              }}>
                ⚙ Account settings
              </button>
              <button className="lifeos-danger-action" onClick={handleLogout}>↪ Logout</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div className="lifeos-panel-overlay" onClick={() => setShowSettingsPanel(false)}>
          <div className="lifeos-premium-panel" onClick={(event) => event.stopPropagation()}>
            <div className="lifeos-panel-glow" />

            <div className="lifeos-panel-header">
              <div>
                <span className="section-label">LIFEOS CONTROL CENTER</span>
                <h2>Settings</h2>
                <p>Manage your workspace preferences.</p>
              </div>
              <button className="lifeos-panel-close" onClick={() => setShowSettingsPanel(false)}>×</button>
            </div>

            <div className="lifeos-settings-list">
              <div className="lifeos-setting-row">
                <div className="lifeos-setting-icon">🔔</div>
                <div>
                  <strong>Push notifications</strong>
                  <small>Reminder notifications are enabled through your browser.</small>
                </div>
                <span className="lifeos-status-pill">ON</span>
              </div>

              <div className="lifeos-setting-row">
                <div className="lifeos-setting-icon">◈</div>
                <div>
                  <strong>Workspace</strong>
                  <small>Personal LIFEOS workspace · Free Plan</small>
                </div>
                <span className="lifeos-status-pill">ACTIVE</span>
              </div>

              <div className="lifeos-setting-row">
                <div className="lifeos-setting-icon">⌕</div>
                <div>
                  <strong>Search</strong>
                  <small>Tasks, reminders and dashboard pages are searchable.</small>
                </div>
                <span className="lifeos-status-pill">READY</span>
              </div>
            </div>

            <div className="lifeos-settings-note">
              <span>✦</span>
              <div>
                <strong>More personalization is coming.</strong>
                <small>LIFEOS settings will expand as your workspace grows.</small>
              </div>
            </div>

            <div className="lifeos-panel-actions">
              <button className="lifeos-secondary-action" onClick={() => setShowSettingsPanel(false)}>Done</button>
              <button className="lifeos-danger-action" onClick={handleLogout}>↪ Logout</button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-label">NEW TASK</span>
                <h2>What needs to be done?</h2>
              </div>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>
            <form onSubmit={createTask}>
              <input
                className="task-input"
                type="text"
                placeholder="e.g. Practice DSA for 1 hour"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                autoFocus
                maxLength={100}
              />
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="modal-save" disabled={savingTask}>
                  {savingTask ? 'Saving...' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className="lifeos-toast">
          <span>✓</span>{message}
        </div>
      )}

      </div>
    </>
  )

}

export default Dashboard

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
      action: () => showMessage('Calendar is available on the Dashboard'),
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
    closeMobileNav()
    window.setTimeout(() => {
      document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const handleNavigation = (name) => {
    setActiveNav(name)

    if (name === 'Dashboard') {
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

  const totalHabits = dashboardData?.totalHabits ?? 0
  const completedHabitsToday = dashboardData?.completedHabitsToday ?? 0
  const habitProgress =
    totalHabits > 0
      ? Math.round((completedHabitsToday / totalHabits) * 100)
      : 0


  return (
    <div className="dashboard-page">

      <aside className="sidebar">
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
          <div className="mobile-nav-backdrop" aria-hidden="true" />
          <aside className="mobile-nav-drawer" aria-label="Dashboard navigation">
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand"><div className="brand-mark">L</div><div><strong>LIFEOS</strong><span>Your personal OS</span></div></div>
            </div>
            <div className="mobile-drawer-label">NAVIGATION</div>
            <nav className="mobile-drawer-nav">
              {[
                ['Dashboard', '⌂'], ['Tasks', '✓'], ['Calendar', '□'], ['Reminders', '◷'],
                ['Travel', '✈'], ['Habits', '◈'], ['Notes', '▤'], ['Focus', '◉'], ['Analytics', '◌'],
              ].map(([name, icon]) => (
                <button
                  key={name}
                  className={`mobile-nav-item ${activeNav === name ? 'active' : ''}`}
                  type="button"
                  title={name}
                  onClick={() => {
                    if (name === 'Dashboard') { setActiveNav(name); closeMobileNav(); navigate('/dashboard') }
                    else if (name === 'Tasks') { closeMobileNav(); window.location.href = '/tasks' }
                    else if (name === 'Reminders') { closeMobileNav(); window.location.href = '/reminders' }
                    else if (name === 'Travel') { closeMobileNav(); window.location.href = '/trips' }
                    else if (name === 'Calendar') handleMobileSection(name, '.calendar-card')
                    else if (name === 'Focus') handleMobileSection(name, '.focus-card')
                    else if (name === 'Habits') handleMobileSection(name, '.habits-card')
                    else { closeMobileNav(); showMessage(`${name} section coming soon`) }
                  }}
                >
                  <span className="mobile-nav-icon">{icon}</span>
                  <span>{name}</span>
                  <span className="mobile-nav-arrow">›</span>
                </button>
              ))}
            </nav>
          </aside>
        </>
      )}

      <main className="dashboard-main">

        <div
          className="topbar"
          style={{
            position: 'relative',
            zIndex: 9999,
            overflow: 'visible',
          }}
        >
          <button
            className={`mobile-nav-trigger ${mobileNavOpen ? 'open' : ''}`}
            type="button"
            onClick={() => setMobileNavOpen((current) => !current)}
            aria-label="Open dashboard menu"
            title="Open dashboard menu"
          >
            <span>☰</span>
            <small>Menu</small>
          </button>

          <div
            className="search-box"
            style={{
              position: 'relative',
              zIndex: 10000,
              overflow: 'visible',
            }}
            onMouseLeave={() => setShowSearchResults(false)}
          >
            <span>⌕</span>
            <input
              placeholder="Search anything... (tasks, notes, reminders)"
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
            <kbd>Ctrl K</kbd>

            {showSearchResults && (
              <div className="lifeos-global-search-dropdown">
                {!searchTerm ? (
                  <div className="lifeos-search-recent">
                    <div className="lifeos-search-heading">
                      <span>Recent searches</span>
                      {recentSearches.length > 0 && (
                        <button type="button" onClick={clearRecentSearches}>
                          Clear
                        </button>
                      )}
                    </div>

                    {recentSearches.length > 0 ? (
                      recentSearches.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="lifeos-search-recent-item"
                          onClick={() => {
                            setSearchQuery(item)
                            setShowSearchResults(true)
                          }}
                        >
                          <span>◷</span>
                          <span>{item}</span>
                        </button>
                      ))
                    ) : (
                      <div className="lifeos-search-empty compact">
                        <span>⌕</span>
                        <strong>Search your LIFEOS</strong>
                        <small>Try a task, reminder, page, profile or setting.</small>
                      </div>
                    )}

                    <div className="lifeos-search-shortcuts">
                      <span>ESC</span> close
                      <span>CTRL K</span> focus search
                    </div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="lifeos-search-empty compact">
                    <span>⌕</span>
                    <strong>No results found</strong>
                    <small>Try another task, reminder or page name.</small>
                  </div>
                ) : (
                  <div className="lifeos-search-results">
                    <div className="lifeos-search-heading">
                      <span>Results</span>
                      <small>{Math.min(searchResults.length, 8)} found</small>
                    </div>

                    {searchResults.slice(0, 8).map((result, index) => (
                      <button
                        key={`${result.type}-${result.title}-${index}`}
                        type="button"
                        className="lifeos-search-result-item"
                        onClick={() => {
                          saveRecentSearch(searchQuery)
                          setShowSearchResults(false)
                          setSearchQuery('')
                          result.action()
                        }}
                      >
                        <span className="lifeos-search-result-icon">
                          {result.type === 'Task'
                            ? '✓'
                            : result.type === 'Reminder'
                              ? '◷'
                              : result.title === 'Profile'
                                ? '◉'
                                : result.title === 'Settings'
                                  ? '⚙'
                                  : result.title === 'Focus'
                                    ? '🎯'
                                    : '⌂'}
                        </span>
                        <span className="lifeos-search-result-copy">
                          <strong>{result.title}</strong>
                          <small>{result.subtitle}</small>
                        </span>
                        <span className="lifeos-search-arrow">›</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="top-actions">
            <div className="lifeos-notification-wrap">
              <button
                className="top-icon"
                onClick={() => setShowNotificationPanel((current) => !current)}
                aria-label="Notifications"
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

              {showNotificationPanel && (
                <div className="lifeos-notification-panel">
                  <div className="lifeos-notification-header">
                    <div>
                      <span className="section-label">LIFEOS</span>
                      <h3>Notifications</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotificationPanel(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="lifeos-notification-list">
                    {reminders
                      .filter(
                        (reminder) =>
                          reminder.reminderTime &&
                          new Date(reminder.reminderTime) > new Date()
                      )
                      .sort(
                        (a, b) =>
                          new Date(a.reminderTime) -
                          new Date(b.reminderTime)
                      )
                      .slice(0, 5)
                      .map((reminder) => {
                        const reminderDate = new Date(reminder.reminderTime)

                        return (
                          <button
                            className="lifeos-notification-item"
                            key={reminder.id}
                            type="button"
                            onClick={() => {
                              setShowNotificationPanel(false)
                              window.location.href = '/reminders'
                            }}
                          >
                            <span className="lifeos-notification-icon">◷</span>

                            <span className="lifeos-notification-copy">
                              <strong>{reminder.title}</strong>
                              <small>
                                {reminderDate.toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                                {' · '}
                                {reminderDate.toLocaleTimeString('en-IN', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </small>
                            </span>

                            <span className="lifeos-notification-arrow">›</span>
                          </button>
                        )
                      })}

                    {reminders.filter(
                      (reminder) =>
                        reminder.reminderTime &&
                        new Date(reminder.reminderTime) > new Date()
                    ).length === 0 && (
                      <div className="lifeos-notification-empty">
                        <span>✦</span>
                        <strong>You're all clear</strong>
                        <small>No upcoming reminders.</small>
                      </div>
                    )}
                  </div>

                  <button
                    className="lifeos-notification-footer"
                    type="button"
                    onClick={() => {
                      setShowNotificationPanel(false)
                      window.location.href = '/reminders'
                    }}
                  >
                    View all reminders <span>→</span>
                  </button>
                </div>
              )}
            </div>

            <button
              className={`theme-toggle ${theme === 'dark' ? 'dark' : ''}`}
              type="button"
              onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              <span className="theme-toggle-icon">{theme === 'dark' ? '☀' : '☾'}</span>
              <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <button
              className="top-profile"
              onClick={() => setShowProfilePanel(true)}
              aria-label="Open profile"
            >
              {userName.charAt(0).toUpperCase()}
            </button>
            <button
              className="consistency"
              onClick={() => {
                setShowConsistencyPanel((current) => !current)
                setShowProfilePanel(false)
                setShowSettingsPanel(false)
              }}
            >
              <span>🔥 Stay Consistent</span>⌄
            </button>

            {showConsistencyPanel && (() => {
              const stats = getConsistencyStats()

              return (
                <div className="lifeos-consistency-panel">
                  <div className="lifeos-consistency-top">
                    <div>
                      <span className="section-label">YOUR MOMENTUM</span>
                      <h3>Stay Consistent</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConsistencyPanel(false)}
                    >
                      ×
                    </button>
                  </div>

                  <div className="lifeos-streak-hero">
                    <div className="lifeos-fire-orb">🔥</div>
                    <div>
                      <strong>{stats.currentStreak} day{stats.currentStreak === 1 ? '' : 's'}</strong>
                      <span>current streak</span>
                    </div>
                  </div>

                  <div className="lifeos-streak-grid">
                    <div>
                      <strong>{stats.bestStreak}</strong>
                      <span>Best streak</span>
                    </div>
                    <div>
                      <strong>{stats.activeDays}</strong>
                      <span>Active days</span>
                    </div>
                  </div>

                  <p className="lifeos-consistency-tip">
                    Complete at least one task today to keep your streak alive.
                  </p>
                </div>
              )
            })()}
          </div>
        </div>

        <section className="hero-panel">
          <div className="hero-copy">
            <div className="date-label">{dateLabel}</div>
            <h1>Good morning, {userName}! <span>👋</span></h1>
            <p>A productive day starts with a clear mind.</p>
          </div>

          <div className="hero-art">
            <div className="hero-sun" />
            <div className="hero-mountain back" />
            <div className="hero-mountain front" />
            <div className="hero-quote">
              <strong>“Discipline today,<br />a brighter tomorrow.”</strong>
              <small>— LIFEOS</small>
            </div>
          </div>
        </section>

        <section className="metric-grid">
          <div className="metric-card metric-purple">
            <div className="metric-icon">✓</div>
            <div>
              <strong>{tasks.filter((task) => !task.completed).length}</strong>
              <span>Tasks due</span>
            </div>
            <button
              className="metric-arrow"
              type="button"
              onClick={() => window.location.href = '/tasks'}
              aria-label="Open tasks"
            >
              →
            </button>
          </div>

          <div className="metric-card metric-pink">
            <div className="metric-icon">◷</div>
            <div>
              <strong>{reminders.length}</strong>
              <span>Reminders</span>
            </div>
            <button
              className="metric-arrow"
              type="button"
              onClick={() => window.location.href = '/reminders'}
              aria-label="Open reminders"
            >
              →
            </button>
          </div>

          <div className="metric-card metric-orange">
            <div className="metric-icon">◈</div>
            <div>
              <strong>{totalHabits}</strong>
              <span>Habits</span>
            </div>
            <b>→</b>
          </div>

          <div className="metric-card metric-green">
            <div className="progress-ring" style={{ '--progress': `${progress}%` }}>
              <span>{progress}%</span>
            </div>
            <div>
              <strong>Day Progress</strong>
              <span>{completedTasks} of {totalTasks} tasks complete</span>
            </div>
            <b>→</b>
          </div>
        </section>

        <section className="content-grid">

          <div className="glass-card dashboard-card tasks-card">
            <div className="card-heading">
              <div>
                <span className="section-label">TODAY'S TASKS</span>
                <h2>Your focus</h2>
              </div>
              <button className="link-button" onClick={() => setShowTaskModal(true)}>＋ Add Task</button>
            </div>

            <div className="task-list">
              {tasksLoading ? (
                <div className="task-loading">Loading your tasks...</div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-orb">✦</div>
                  <strong>No tasks yet</strong>
                  <small>Add your first task and start organizing your day.</small>
                  <button className="primary-action" onClick={() => setShowTaskModal(true)}>＋ Create your first task</button>
                </div>
              ) : (
                tasks.slice(0, 5).map((task) => {
                  const completed = Boolean(task.completed)
                  return (
                    <button
                      className={`task-row ${completed ? 'completed-row' : ''}`}
                      key={task.id}
                      onClick={() => toggleTask(task)}
                    >
                      <div className={`task-check ${completed ? 'checked' : ''}`}>
                        {completed && '✓'}
                      </div>
                      <div className="task-info">
                        <span>{task.title}</span>
                        <small>Personal</small>
                      </div>
                      <span className="task-time">{completed ? 'Done' : 'Today'}</span>
                      <span className="task-menu">⋮</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="glass-card dashboard-card events-card">
            <div className="card-heading">
              <div>
                <span className="section-label">UPCOMING</span>
                <h2>Events & reminders</h2>
              </div>
              <button className="link-button" onClick={() => window.location.href = '/reminders'}>View all</button>
            </div>

            <div className="event-list">
              {remindersLoading ? (
                <div className="event-row">
                  <div className="event-icon purple">◷</div>
                  <div>
                    <strong>Loading reminders...</strong>
                    <small>Fetching your upcoming reminders</small>
                  </div>
                  <span>...</span>
                </div>
              ) : reminders.length === 0 ? (
                <div className="event-row">
                  <div className="event-icon pink">✦</div>
                  <div>
                    <strong>No upcoming reminders</strong>
                    <small>Create a reminder to stay on track</small>
                  </div>
                  <span>—</span>
                </div>
              ) : (
                reminders
                  .filter((reminder) => {
                    if (!reminder.reminderTime) return false

                    return new Date(reminder.reminderTime) > new Date()
                  })
                  .sort(
                    (a, b) =>
                      new Date(a.reminderTime) -
                      new Date(b.reminderTime)
                  )
                  .slice(0, 3)
                  .map((reminder) => {
                    const reminderDate = new Date(
                      reminder.reminderTime
                    )

                    const dateText =
                      reminderDate.toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                        }
                      )

                    const timeText =
                      reminderDate.toLocaleTimeString(
                        'en-IN',
                        {
                          hour: 'numeric',
                          minute: '2-digit',
                        }
                      )

                    return (
                      <div
                        className="event-row"
                        key={reminder.id}
                      >
                        <div className="event-icon orange">
                          ◷
                        </div>

                        <div>
                          <strong>{reminder.title}</strong>
                          <small>
                            {dateText} · {timeText}
                          </small>
                        </div>

                        <span>{dateText}</span>
                      </div>
                    )
                  })
              )}
            </div>
          </div>

          <div className="glass-card dashboard-card calendar-card">
            <div className="card-heading compact">
              <div>
                <span className="section-label">YOUR MONTH</span>
                <h2>{monthName} {yearNumber}</h2>
              </div>
              <div className="calendar-arrows">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  aria-label="Previous month"
                >
                  ←
                </button>

                {!isCurrentMonth && (
                  <button
                    type="button"
                    onClick={goToToday}
                    className="calendar-today-button"
                  >
                    Today
                  </button>
                )}

                <button
                  type="button"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            <div className="calendar-week">
              {['S','M','T','W','T','F','S'].map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
            </div>
            <div className="calendar-grid">
              {calendarCells.map((day, index) => {
                const hasReminder = day && reminderDates.has(day)

                return (
                  <span
                    key={index}
                    className={[
                      day === dayNumber ? 'today' : '',
                      hasReminder ? 'has-reminder' : '',
                      day &&
                      selectedCalendarDate.getFullYear() === yearNumber &&
                      selectedCalendarDate.getMonth() === calendarMonthNumber &&
                      selectedCalendarDate.getDate() === day
                        ? 'selected-day'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => selectCalendarDay(day)}
                  >
                    {day || ''}
                    {hasReminder && <i className="calendar-reminder-dot" />}
                  </span>
                )
              })}
            </div>

            <div className="selected-date-reminders">
              <div className="selected-date-heading">
                <div>
                  <span className="section-label">SELECTED DATE</span>
                  <h3>
                    {selectedCalendarDate.toLocaleDateString(
                      'en-IN',
                      {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      }
                    )}
                  </h3>
                </div>

                <span className="selected-date-count">
                  {selectedDateReminders.length}
                </span>
              </div>

              {selectedDateReminders.length === 0 ? (
                <div className="selected-date-empty">
                  <span>✦</span>
                  <div>
                    <strong>No reminders</strong>
                    <small>Nothing scheduled for this date.</small>
                  </div>
                </div>
              ) : (
                <div className="selected-date-list">
                  {selectedDateReminders.map((reminder) => {
                    const reminderDate = new Date(
                      reminder.reminderTime
                    )

                    return (
                      <div
                        className="selected-date-reminder"
                        key={reminder.id}
                      >
                        <div className="selected-reminder-icon">
                          ◷
                        </div>

                        <div>
                          <strong>{reminder.title}</strong>
                          <small>
                            {reminderDate.toLocaleTimeString(
                              'en-IN',
                              {
                                hour: 'numeric',
                                minute: '2-digit',
                              }
                            )}
                          </small>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card dashboard-card focus-card">
            <div className="focus-art">
              <div className="focus-mountain back" />
              <div className="focus-mountain front" />
              <div className="focus-overlay" />
              <div className="focus-content">
                <span className="section-label">FOCUS MODE</span>
                <strong>{formatFocusTime(focusSeconds)}</strong>
                <input
                  className="focus-label-input"
                  value={focusLabel}
                  onChange={(event) => setFocusLabel(event.target.value)}
                  placeholder="What are you focusing on?"
                  disabled={focusRunning}
                />
                <div className="focus-actions">
                  <button onClick={focusRunning ? () => setFocusRunning(false) : startFocus}>
                    {focusRunning ? 'Ⅱ Pause' : '▶ Start Focus'}
                  </button>
                  <button className="focus-reset" onClick={resetFocus}>↻</button>
                </div>
              </div>
            </div>
            <div className="focus-tabs">
              <button className="selected">25 min Focus</button>
              <span className="focus-today">{focusMinutesToday} min today</span>
            </div>
          </div>

          <div className="glass-card dashboard-card habits-card">
            <div className="card-heading">
              <div>
                <span className="section-label">DAILY ROUTINE</span>
                <h2>Habits</h2>
              </div>
              <button className="link-button" onClick={() => showMessage('Habits section coming soon')}>View all</button>
            </div>

            <div className="habit-summary">
              <div className="habit-ring" style={{ '--habit-progress': `${habitProgress}%` }}>
                <span>{habitProgress}%</span>
              </div>
              <div>
                <strong>{completedHabitsToday} of {totalHabits} completed today</strong>
                <small>{longestStreak > 0 ? `${longestStreak}-day best streak. Keep going.` : 'Build your first streak.'}</small>
              </div>
            </div>

            {['Drink water', 'Exercise', 'Read', 'Sleep before 12'].map((habit, index) => (
              <div className="habit-row" key={habit}>
                <span className={`habit-dot dot-${index}`}>{index === 0 ? '💧' : index === 1 ? '✦' : index === 2 ? '▣' : '☾'}</span>
                <strong>{habit}</strong>
                <div className="habit-days">
                  {[0,1,2,3,4,5,6].map((d) => <i className={d < (index + 3) ? 'done' : ''} key={d} />)}
                </div>
              </div>
            ))}
          </div>

          <div className="quote-card">
            <div className="quote-art" />
            <div className="quote-content">
              <span>YOUR DAILY NOTE</span>
              <strong>Good things<br />take time.</strong>
            </div>
          </div>

          <div className="music-card">
            <div className="music-art">
              <div className="music-mountain" />
            </div>
            <div className="music-content">
              <span>FOCUS MUSIC</span>
              <strong>Lo-fi Vibes</strong>
              <small>A calmer mind,<br />a stronger you.</small>
              <div className="music-controls"><button>▶</button><span /><button>›</button></div>
            </div>
          </div>

        </section>

        <div className="bottom-banner">
          <span className="sun-icon">☀</span>
          <strong>"Small steps every day lead to big results."</strong>
          <button onClick={() => showMessage('Keep going!')}>Keep going →</button>
        </div>

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
  )

}

export default Dashboard

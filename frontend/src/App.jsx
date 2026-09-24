import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'
import { useEffect, useState } from 'react'

import Login from './Login.jsx'
import Register from './Register.jsx'
import Dashboard from './Dashboard.jsx'
import Tasks from './Tasks.jsx'
import Reminders from './Reminders.jsx'
import Trips from './Trips.jsx'
import Calendar from './Calendar.jsx'

import './App.css'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token')

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lifeosTheme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-lifeos-theme',
      theme
    )

    localStorage.setItem(
      'lifeosTheme',
      theme
    )
  }, [theme])

  useEffect(() => {
    window.lifeosTheme = theme
    window.setLifeosTheme = setTheme
  }, [theme])

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reminders"
          element={
            <ProtectedRoute>
              <Reminders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <Trips />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App
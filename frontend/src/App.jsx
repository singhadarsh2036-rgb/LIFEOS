import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './Login.jsx'
import Register from './Register.jsx'
import Dashboard from './Dashboard.jsx'
import Tasks from './Tasks.jsx'
import Reminders from './Reminders.jsx'
import Trips from './Trips.jsx'

import './App.css'

function App() {
  const token = localStorage.getItem('token')

  return (
    <BrowserRouter>
      <Routes>

        {/* Home */}
        <Route
          path="/"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Tasks */}
        <Route
          path="/tasks"
          element={<Tasks />}
        />

        {/* Reminders */}
        <Route
          path="/reminders"
          element={<Reminders />}
        />

        {/* Trips */}
        <Route
          path="/trips"
          element={<Trips />}
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App
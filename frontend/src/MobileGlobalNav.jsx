import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './MobileGlobalNav.css'

function MobileGlobalNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const items = [
    ['Dashboard', '⌂', '/dashboard'],
    ['Tasks', '✓', '/tasks'],
    ['Calendar', '□', '/dashboard#calendar'],
    ['Reminders', '◷', '/reminders'],
    ['Travel', '✈', '/trips'],
    ['Habits', '◈', '/dashboard#habits'],
    ['Notes', '▤', '/dashboard#notes'],
    ['Focus', '◉', '/dashboard#focus'],
    ['Analytics', '◌', '/dashboard#analytics'],
  ]

  const currentPath = location.pathname

  const go = (path) => {
    setOpen(false)

    if (path.startsWith('/dashboard#')) {
      window.location.href = path
      return
    }

    navigate(path)
  }

  return (
    <>
      <button
        className={`lifeos-mobile-menu-trigger ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        title={open ? 'Close menu' : 'Open menu'}
      >
        <span className="lifeos-hamburger" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>

      {open && (
        <aside className="lifeos-mobile-drawer" aria-label="LIFEOS navigation">
          <div className="lifeos-mobile-drawer-brand">
            <div className="lifeos-mobile-brand-mark">L</div>
            <div>
              <strong>LIFEOS</strong>
              <span>Your personal OS</span>
            </div>
          </div>

          <div className="lifeos-mobile-drawer-title">NAVIGATION</div>

          <nav className="lifeos-mobile-drawer-nav">
            {items.map(([name, icon, path]) => {
              const active =
                name === 'Dashboard'
                  ? currentPath === '/dashboard'
                  : name === 'Tasks'
                    ? currentPath === '/tasks'
                    : name === 'Reminders'
                      ? currentPath === '/reminders'
                      : name === 'Travel'
                        ? currentPath === '/trips'
                        : false

              return (
                <button
                  key={name}
                  type="button"
                  className={`lifeos-mobile-nav-item ${active ? 'active' : ''}`}
                  onClick={() => go(path)}
                  title={name}
                >
                  <span className="lifeos-mobile-nav-icon">{icon}</span>
                  <span>{name}</span>
                  <span className="lifeos-mobile-nav-arrow">›</span>
                </button>
              )
            })}
          </nav>

          <div className="lifeos-mobile-drawer-footer">
            <button type="button" onClick={() => go('/dashboard#settings')}>
              <span>⚙</span>
              <span>Settings</span>
            </button>
          </div>
        </aside>
      )}
    </>
  )
}

export default MobileGlobalNav

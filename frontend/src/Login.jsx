import './LoginPremium.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10 5h4" />
      <circle cx="12" cy="18.5" r=".8" fill="currentColor" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 3 18 18" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.4 18.4 0 0 1-3.1 4.1" />
      <path d="M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.3 0 2.5-.3 3.6-.8" />
    </svg>
  )
}

function FeatureIcon({ type }) {
  if (type === 'check') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16.5 9" />
      </svg>
    )
  }

  if (type === 'chart') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 19V10M12 19V5M19 19v-7" />
        <path d="M3 19h18" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  )
}

function Login() {
  const [loginMethod, setLoginMethod] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleMethodChange = (method) => {
    setLoginMethod(method)
    if (method === 'email') setPhone('')
    else setEmail('')
  }

  const handleLogin = async (event) => {
    event.preventDefault()

    const loginValue =
      loginMethod === 'email' ? email.trim() : phone.trim()

    if (!loginValue) {
      alert(
        loginMethod === 'email'
          ? 'Please enter your email'
          : 'Please enter your phone number'
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8081/users/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            login: loginValue,
            password
          })
        }
      )

      const data = await response.text()

      if (!response.ok) {
        alert('Login failed: ' + data)
        return
      }

      localStorage.setItem('token', data)
      navigate('/dashboard')
    } catch (error) {
      console.error('LOGIN ERROR:', error)
      alert('ERROR: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lifeos-login">

      <div className="lifeos-login-backdrop" />

      <div className="lifeos-login-noise" />

      <header className="lifeos-login-brand">
        <div className="lifeos-login-logo">
          <span />
          <span />
          <span />
        </div>

        <div>
          <div className="lifeos-login-brand-name">LIFEOS</div>
          <div className="lifeos-login-brand-tagline">YOUR LIFE. ONE SYSTEM.</div>
        </div>
      </header>

      <main className="lifeos-login-main">

        <section className="lifeos-login-hero">

          <div className="lifeos-login-eyebrow">
            DISCIPLINE TODAY
            <span />
            A BRIGHTER TOMORROW.
          </div>

          <h1>
            A Better
            <br />
            You, <span>Everyday.</span>
          </h1>

          <p className="lifeos-login-copy">
            Plan. Track. Build. Grow.
            <br />
            All in one place.
          </p>

          <div className="lifeos-login-features">

            <div className="lifeos-login-feature">
              <div className="lifeos-login-feature-icon purple">
                <FeatureIcon type="check" />
              </div>
              <div>
                <strong>Stay Organized</strong>
                <small>Tasks, reminders, habits and more</small>
              </div>
            </div>

            <div className="lifeos-login-feature">
              <div className="lifeos-login-feature-icon blue">
                <FeatureIcon type="chart" />
              </div>
              <div>
                <strong>Track Progress</strong>
                <small>Small steps. Big changes.</small>
              </div>
            </div>

            <div className="lifeos-login-feature">
              <div className="lifeos-login-feature-icon peach">
                <FeatureIcon type="star" />
              </div>
              <div>
                <strong>Build a Better You</strong>
                <small>Discipline today, freedom tomorrow.</small>
              </div>
            </div>

          </div>

          <div className="lifeos-login-quote">
            <span />
            <p>
              “A system for a
              <br />
              better tomorrow.”
            </p>
          </div>

        </section>

        <section className="lifeos-login-panel">

          <div className="lifeos-login-card">

            <div className="lifeos-login-card-glow" />

            <div className="lifeos-login-card-topline">
              <span />
              <span />
              <span />
            </div>

            <h2>Welcome back <span>👋</span></h2>

            <p className="lifeos-login-subtitle">
              Log in to continue your journey
            </p>

            <form onSubmit={handleLogin}>

              <div className="lifeos-login-methods">

                <button
                  type="button"
                  className={loginMethod === 'email' ? 'active' : ''}
                  onClick={() => handleMethodChange('email')}
                >
                  <MailIcon />
                  Email
                </button>

                <button
                  type="button"
                  className={loginMethod === 'phone' ? 'active' : ''}
                  onClick={() => handleMethodChange('phone')}
                >
                  <PhoneIcon />
                  Phone
                </button>

              </div>

              {loginMethod === 'email' ? (
                <div className="lifeos-login-field">
                  <label htmlFor="lifeos-email">Email</label>
                  <div className="lifeos-login-input">
                    <MailIcon />
                    <input
                      id="lifeos-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="lifeos-login-field">
                  <label htmlFor="lifeos-phone">Phone number</label>
                  <div className="lifeos-login-phone">
                    <PhoneInput
                      id="lifeos-phone"
                      international
                      defaultCountry="IN"
                      countryCallingCodeEditable={false}
                      placeholder="Enter your phone number"
                      value={phone}
                      onChange={(value) => setPhone(value || '')}
                    />
                  </div>
                </div>
              )}

              <div className="lifeos-login-field">
                <label htmlFor="lifeos-password">Password</label>

                <div className="lifeos-login-input">
                  <LockIcon />

                  <input
                    id="lifeos-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    className="lifeos-login-eye"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              <button type="button" className="lifeos-login-forgot">
                Forgot password?
              </button>

              <button
                type="submit"
                className="lifeos-login-submit"
                disabled={loading}
              >
                <span>{loading ? 'Logging in...' : 'Login'}</span>
                {!loading && <span>→</span>}
              </button>

            </form>

            <div className="lifeos-login-divider">
              <span />
              OR
              <span />
            </div>

            <p className="lifeos-login-register">
              Don’t have an account?
              <button type="button" onClick={() => navigate('/register')}>
                Register
              </button>
            </p>

            <div className="lifeos-login-footer">
              DISCIPLINE BUILDS FREEDOM
            </div>

          </div>

        </section>

      </main>

      <div className="lifeos-login-corner">
        <span>SMALL STEPS</span>
        <span>BIG FREEDOM.</span>
      </div>

    </div>
  )
}

export default Login

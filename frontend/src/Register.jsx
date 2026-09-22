import './App.css'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

const API = 'https://lifeos-v22r.onrender.com'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [registrationMethod, setRegistrationMethod] = useState('email')

  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [password, setPassword] = useState('')

  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const [checkingEmail, setCheckingEmail] = useState(false)
  const [checkingPhone, setCheckingPhone] = useState(false)

  const [loading, setLoading] = useState(false)

  // ================================
  // CHECK EMAIL
  // ================================

  useEffect(() => {
    const value = email.trim()

    if (!value) {
      setEmailError('')
      setCheckingEmail(false)
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError('')
      setCheckingEmail(false)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true)

      try {
        const response = await fetch(
          `${API}/users/check-email?email=${encodeURIComponent(value)}`
        )

        if (!response.ok) return

        const exists = await response.json()

        if (exists) {
          setEmailError('Email already registered')
        } else {
          setEmailError('')
        }
      } catch (error) {
        console.error('EMAIL CHECK ERROR:', error)
      } finally {
        setCheckingEmail(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [email])

  // ================================
  // CHECK PHONE
  // ================================

  useEffect(() => {
    if (!phone) {
      setPhoneError('')
      setCheckingPhone(false)
      return
    }

    if (!isValidPhoneNumber(phone)) {
      setPhoneError('')
      setCheckingPhone(false)
      return
    }

    const timer = setTimeout(async () => {
      setCheckingPhone(true)

      try {
        const response = await fetch(
          `${API}/users/check-phone?phone=${encodeURIComponent(phone)}`
        )

        if (!response.ok) return

        const exists = await response.json()

        if (exists) {
          setPhoneError('Phone number already registered')
        } else {
          setPhoneError('')
        }
      } catch (error) {
        console.error('PHONE CHECK ERROR:', error)
      } finally {
        setCheckingPhone(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [phone])

  // ================================
  // REGISTER
  // ================================

  const handleRegister = async (event) => {
    event.preventDefault()

    if (password.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }

    if (registrationMethod === 'email' && emailError) {
      alert(emailError)
      return
    }

    if (registrationMethod === 'phone' && phoneError) {
      alert(phoneError)
      return
    }

    if (registrationMethod === 'email' && !email.trim()) {
      alert('Please enter your email address.')
      return
    }

    if (registrationMethod === 'phone') {
      if (!phone) {
        alert('Please enter your phone number.')
        return
      }

      if (!isValidPhoneNumber(phone)) {
        alert('Please enter a valid phone number.')
        return
      }
    }

    setLoading(true)

    try {
      // CREATE ACCOUNT
      const registerResponse = await fetch(`${API}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email: registrationMethod === 'email' ? email : '',
          phone: registrationMethod === 'phone' ? phone : '',
          password
        })
      })

      const registerText = await registerResponse.text()

      console.log(
        'REGISTER RESPONSE:',
        registerResponse.status,
        registerText
      )

      if (!registerResponse.ok) {
        let data

        try {
          data = JSON.parse(registerText)
        } catch {
          data = registerText
        }

        alert(
          typeof data === 'object'
            ? data?.message || data?.error || 'Registration failed'
            : data || 'Registration failed'
        )

        return
      }

      // AUTO LOGIN
      const loginResponse = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: registrationMethod === 'email' ? email : phone,
          password
        })
      })

      const loginText = await loginResponse.text()

      console.log(
        'AUTO LOGIN RESPONSE:',
        loginResponse.status,
        loginText
      )

      if (!loginResponse.ok) {
        alert(
          'Account created successfully, but automatic login failed. Please login manually.'
        )

        navigate('/login')
        return
      }

      localStorage.setItem('token', loginText)

      alert('Account created successfully! 🎉')

      navigate('/dashboard')
    } catch (error) {
      console.error('REGISTER ERROR:', error)
      alert('Registration error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ================================
  // SWITCH METHOD
  // ================================

  const switchMethod = (method) => {
    setRegistrationMethod(method)
    setEmailError('')
    setPhoneError('')
  }

  return (
    <div className="login-page">

      <div className="login-mountains" />

      {/* LEFT SIDE */}

      <section className="login-left">

        <div className="login-brand">
          <div className="login-brand-mark">
            <span />
          </div>

          LIFEOS
        </div>

        <div className="login-hero">

          <p className="login-kicker">
            Your life. One system.
          </p>

          <h1>
            Start Your
            <br />

            <span className="login-gradient-text">
              Journey.
            </span>
          </h1>

          <p className="login-hero-copy">
            Create your LIFEOS account.
            <br />
            Build your better tomorrow.
          </p>

        </div>

      </section>

      {/* RIGHT SIDE */}

      <section className="login-right">

        <div className="login-card">

          <h2>
            Create your account 🚀
          </h2>

          <p className="login-card-subtitle">
            Start building your better life
          </p>

          <form
            className="login-form"
            onSubmit={handleRegister}
          >

            {/* METHOD */}

            <div style={{ marginBottom: '22px' }}>

              <label
                style={{
                  display: 'block',
                  marginBottom: '10px'
                }}
              >
                Register with
              </label>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px'
                }}
              >

                <button
                  type="button"
                  onClick={() => switchMethod('email')}
                  style={{
                    padding: '13px 12px',
                    borderRadius: '12px',
                    border:
                      registrationMethod === 'email'
                        ? '1px solid rgba(145,110,255,0.9)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background:
                      registrationMethod === 'email'
                        ? 'rgba(113,82,220,0.22)'
                        : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📧 Email
                </button>

                <button
                  type="button"
                  onClick={() => switchMethod('phone')}
                  style={{
                    padding: '13px 12px',
                    borderRadius: '12px',
                    border:
                      registrationMethod === 'phone'
                        ? '1px solid rgba(145,110,255,0.9)'
                        : '1px solid rgba(255,255,255,0.12)',
                    background:
                      registrationMethod === 'phone'
                        ? 'rgba(113,82,220,0.22)'
                        : 'rgba(255,255,255,0.04)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  📱 Phone
                </button>

              </div>

            </div>

            {/* NAME */}

            <div className="login-field">

              <label htmlFor="register-name">
                Full name
              </label>

              <div className="login-input-wrap">

                <input
                  id="register-name"
                  className="login-input"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            {registrationMethod === 'email' && (

              <div className="login-field">

                {emailError && (
                  <div
                    style={{
                      color: '#ff4d4f',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}
                  >
                    {emailError}
                  </div>
                )}

                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="login-input-wrap">

                  <input
                    id="register-email"
                    className="login-input"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError('')
                    }}
                    required
                  />

                </div>

                {checkingEmail && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      opacity: 0.65
                    }}
                  >
                    Checking email...
                  </div>
                )}

              </div>

            )}

            {/* PHONE */}

            {registrationMethod === 'phone' && (

              <div className="login-field">

                {phoneError && (
                  <div
                    style={{
                      color: '#ff4d4f',
                      fontSize: '13px',
                      fontWeight: '600',
                      marginBottom: '6px'
                    }}
                  >
                    {phoneError}
                  </div>
                )}

                <label htmlFor="register-phone">
                  Phone number
                </label>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    minHeight: '48px',
                    padding: '0 12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)'
                  }}
                >

                  <PhoneInput
                    id="register-phone"
                    international
                    defaultCountry="IN"
                    countryCallingCodeEditable={false}
                    value={phone}
                    onChange={(value) => {
                      setPhone(value || '')
                      setPhoneError('')
                    }}
                    placeholder="Enter phone number"
                    style={{
                      width: '100%',
                      background: 'transparent'
                    }}
                  />

                </div>

                {checkingPhone && (
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12px',
                      opacity: 0.65
                    }}
                  >
                    Checking phone number...
                  </div>
                )}

              </div>

            )}

            {/* PASSWORD */}

            <div className="login-field">

              <label htmlFor="register-password">
                Create password
              </label>

              <div className="login-input-wrap">

                <input
                  id="register-password"
                  className="login-input"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  autoFocus
                />

              </div>

            </div>

            <button
              className="login-submit"
              type="submit"
              disabled={
                loading ||
                password.length < 6 ||
                checkingEmail ||
                checkingPhone ||
                (registrationMethod === 'email' && !!emailError) ||
                (registrationMethod === 'phone' && !!phoneError)
              }
            >
              {loading
                ? 'Creating account...'
                : 'Create my account  →'}
            </button>

          </form>

          <div className="login-divider">
            OR
          </div>

          <p className="login-register">

            Already have an account?{' '}

            <button
              type="button"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>

          </p>

          <div className="login-footer">
            DISCIPLINE BUILDS FREEDOM
          </div>

        </div>

      </section>

    </div>
  )
}

export default Register
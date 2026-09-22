import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [registerMethod, setRegisterMethod] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const API = 'https://lifeos-v22r.onrender.com'

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 2500)
  }

  const handleRegister = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      showMessage('Please enter your name')
      return
    }

    if (registerMethod === 'email' && !email.trim()) {
      showMessage('Please enter your email')
      return
    }

    if (registerMethod === 'phone' && !phone) {
      showMessage('Please enter your phone number')
      return
    }

    if (!password) {
      showMessage('Please enter a password')
      return
    }

    if (password.length < 6) {
      showMessage('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      showMessage('Passwords do not match')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(`${API}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email:
            registerMethod === 'email'
              ? email.trim()
              : '',
          phone:
            registerMethod === 'phone'
              ? phone
              : '',
          password,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()

        let errorMessage = 'Registration failed'

        try {
          const errorData = JSON.parse(errorText)

          errorMessage =
            errorData.error ||
            errorData.message ||
            errorMessage
        } catch {
          if (errorText) {
            errorMessage = errorText
          }
        }

        throw new Error(errorMessage)
      }

      showMessage('Account created successfully 🎉')

      setTimeout(() => {
        navigate('/')
      }, 1000)

    } catch (error) {
      console.error('REGISTER ERROR:', error)
      showMessage(
        error.message || 'Could not create your account'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lifeos-register">

      <div className="lifeos-register-bg" />

      {/* BRAND */}

      <div className="lifeos-register-brand">

        <div className="lifeos-register-logo">
          <span />
          <span />
          <span />
        </div>

        <div>
          <div className="lifeos-register-brand-name">
            LIFEOS
          </div>

          <div className="lifeos-register-brand-tagline">
            YOUR LIFE. ORGANIZED.
          </div>
        </div>

      </div>


      <main className="lifeos-register-main">

        {/* LEFT SIDE */}

        <section className="lifeos-register-hero">

          <div className="lifeos-register-eyebrow">
            <span />
            START YOUR JOURNEY
          </div>

          <h1>
            Build a life
            <br />
            <span>that runs better.</span>
          </h1>

          <p>
            LIFEOS brings your tasks, reminders, plans and
            everyday life together in one intelligent space.
          </p>

          <div className="lifeos-register-steps">

            <div className="lifeos-register-step">
              <div>01</div>
              <span>Organize everything that matters.</span>
            </div>

            <div className="lifeos-register-step">
              <div>02</div>
              <span>Stay ahead with smart reminders.</span>
            </div>

            <div className="lifeos-register-step">
              <div>03</div>
              <span>Make every day a little easier.</span>
            </div>

          </div>

        </section>


        {/* REGISTER CARD */}

        <section className="lifeos-register-card">

          <div className="lifeos-register-card-header">

            <span className="lifeos-register-card-label">
              CREATE ACCOUNT
            </span>

            <h2>
              Welcome to LIFEOS.
            </h2>

            <p>
              Create your account and start organizing your life.
            </p>

          </div>


          <form onSubmit={handleRegister}>

            {/* NAME */}

            <div className="lifeos-register-field">

              <label>Full name</label>

              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                autoComplete="name"
              />

            </div>


            {/* REGISTER METHOD */}

            <div className="lifeos-register-field">

              <label>Register using</label>

              <div className="register-method-toggle">

                <button
                  type="button"
                  className={
                    registerMethod === 'email'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setRegisterMethod('email')
                    setPhone('')
                  }}
                >
                  ✉ Email
                </button>

                <button
                  type="button"
                  className={
                    registerMethod === 'phone'
                      ? 'active'
                      : ''
                  }
                  onClick={() => {
                    setRegisterMethod('phone')
                    setEmail('')
                  }}
                >
                  ☎ Phone
                </button>

              </div>

            </div>


            {/* EMAIL */}

            {registerMethod === 'email' && (
              <div className="lifeos-register-field">

                <label>Email address</label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                />

              </div>
            )}


            {/* PHONE */}

            {registerMethod === 'phone' && (
              <div className="lifeos-register-field">

                <label>Phone number</label>

                <PhoneInput
                  international
                  defaultCountry="IN"
                  countryCallingCodeEditable={false}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={setPhone}
                  className="lifeos-phone-input"
                />

              </div>
            )}


            {/* PASSWORD */}

            <div className="lifeos-register-field">

              <label>Password</label>

              <input
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                autoComplete="new-password"
              />

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="lifeos-register-field">

              <label>Confirm password</label>

              <input
                type="password"
                placeholder="Enter password again"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                autoComplete="new-password"
              />

            </div>


            {/* SUBMIT */}

            <button
              className="lifeos-register-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Creating account...'
                : 'Create my account'}
            </button>

          </form>


          <div className="lifeos-register-login">

            Already have an account?

            <button
              type="button"
              onClick={() => navigate('/')}
            >
              Sign in
            </button>

          </div>

        </section>

      </main>


      {/* TOAST */}

      {message && (
        <div className="lifeos-register-toast">
          <span>✓</span>
          {message}
        </div>
      )}

    </div>
  )
}

export default Register
import { useEffect, useRef, useState } from 'react'
import './Reminders.css'

function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timePeriod, setTimePeriod] = useState('AM')
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')

  const notifiedReminders = useRef(new Set())

  const getToken = () => {
    return localStorage.getItem('token')
  }

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 2200)
  }

  // ==============================
  // PUSH NOTIFICATION SETUP
  // ==============================

  const setupPushNotifications = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker is not supported')
        return
      }

      if (!('PushManager' in window)) {
        console.log('Push notifications are not supported')
        return
      }

      const token = getToken()

      if (!token) {
        console.log('No login token found')
        return
      }

      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        console.log('Notification permission not granted')
        return
      }

      const registration =
        await navigator.serviceWorker.ready

      const publicKeyResponse = await fetch(
        'https://lifeos-v22r.onrender.com/push/public-key'
      )

      if (!publicKeyResponse.ok) {
        throw new Error(
          'Failed to get VAPID public key'
        )
      }

      const publicKey =
        await publicKeyResponse.text()

      const urlBase64ToUint8Array = (
        base64String
      ) => {
        const padding = '='.repeat(
          (4 - (base64String.length % 4)) % 4
        )

        const base64 = (
          base64String + padding
        )
          .replace(/-/g, '+')
          .replace(/_/g, '/')

        const rawData = window.atob(base64)

        return Uint8Array.from(
          [...rawData].map((char) =>
            char.charCodeAt(0)
          )
        )
      }

      let subscription =
        await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription =
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                publicKey
              ),
          })
      }

      const subscriptionJson =
        subscription.toJSON()

      const subscriptionData = {
        endpoint: subscriptionJson.endpoint,
        keys: {
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth,
        },
      }

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/push/subscribe',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscriptionData),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        console.error(
          'SUBSCRIBE RESPONSE:',
          response.status,
          errorText
        )

        throw new Error(
          `Subscription failed: ${response.status} ${errorText}`
        )
      }

      console.log(
        '🔔 LIFEOS Push Subscription Saved'
      )

    } catch (error) {
      console.error(
        'Push notification setup failed:',
        error
      )
    }
  }

  // ==============================
  // LOAD REMINDERS
  // ==============================

  const loadReminders = async () => {
    try {
      const response = await fetch(
        'https://lifeos-v22r.onrender.com/reminders',
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          'Could not load reminders'
        )
      }

      const data = await response.json()

      setReminders(
        Array.isArray(data) ? data : []
      )

    } catch (error) {
      console.error(
        'REMINDER ERROR:',
        error
      )

      showMessage(
        'Could not load reminders'
      )

    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // INITIAL SETUP
  // ==============================

  useEffect(() => {
    loadReminders()
    setupPushNotifications()

    if ('Notification' in window) {
      Notification.requestPermission()
    }
  }, [])

  // ==============================
  // CREATE REMINDER
  // ==============================

  const createReminder = async (event) => {
    event.preventDefault()

    if (!title.trim()) {
      showMessage('Enter a reminder')
      return
    }

    if (!date || !time) {
      showMessage(
        'Select date and time'
      )
      return
    }

    const timeParts = time.split(':')

    if (
      timeParts.length !== 2 ||
      parseInt(timeParts[0], 10) < 1 ||
      parseInt(timeParts[0], 10) > 12 ||
      parseInt(timeParts[1], 10) < 0 ||
      parseInt(timeParts[1], 10) > 59
    ) {
      showMessage(
        'Enter a valid time'
      )
      return
    }

    try {
      setSaving(true)

      // Convert 12-hour time to 24-hour time
      let hour = parseInt(
        timeParts[0],
        10
      )

      if (timePeriod === 'AM') {
        if (hour === 12) {
          hour = 0
        }
      } else {
        if (hour !== 12) {
          hour += 12
        }
      }

      const formattedHour =
        String(hour).padStart(2, '0')

      const reminderTime =
        `${date}T${formattedHour}:${timeParts[1]}:00`

      const selectedDateTime = new Date(reminderTime)
      const now = new Date()

      if (selectedDateTime <= now) {
        showMessage(
          'Please select a future date and time'
        )
        return
      }

      const response = await fetch(
        'https://lifeos-v22r.onrender.com/reminders',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${getToken()}`,
          },

          body: JSON.stringify({
            title: title.trim(),
            reminderTime,
            completed: false,
            notificationSent: false,
          }),
        }
      )

      if (!response.ok) {
        const errorText =
          await response.text()

        throw new Error(errorText)
      }

      const createdReminder =
        await response.json()

      setReminders((current) => [
        ...current,
        createdReminder,
      ])

      setTitle('')
      setDate('')
      setTime('')
      setTimePeriod('AM')
      setShowModal(false)

      showMessage(
        'Reminder created'
      )

    } catch (error) {
      console.error(
        'CREATE REMINDER ERROR:',
        error
      )

      showMessage(
        'Could not create reminder'
      )

    } finally {
      setSaving(false)
    }
  }

  // ==============================
  // DELETE REMINDER
  // ==============================

  const deleteReminder = async (id) => {
    try {
      const response = await fetch(
        `https://lifeos-v22r.onrender.com/reminders/${id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${getToken()}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(
          'Could not delete reminder'
        )
      }

      setReminders((current) =>
        current.filter(
          (reminder) =>
            reminder.id !== id
        )
      )

      showMessage(
        'Reminder deleted'
      )

    } catch (error) {
      console.error(error)

      showMessage(
        'Could not delete reminder'
      )
    }
  }

  // ==============================
  // FORMAT DATE
  // ==============================

  const formatReminderDate = (
    value
  ) => {
    if (!value) return ''

    const dateObject =
      new Date(value)

    return dateObject.toLocaleString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    )
  }

  return (
    <div className="reminders-page">

      <header className="reminders-header">

        <div>

          <div className="reminders-eyebrow">
            LIFEOS · REMINDERS
          </div>

          <h1>
            Never miss a moment
            <span>.</span>
          </h1>

          <p>
            Set a time. LIFEOS will remind you.
          </p>

        </div>

        <button
          className="reminder-add-button"
          onClick={() =>
            setShowModal(true)
          }
        >
          <span>+</span>
          Add reminder
        </button>

      </header>


      <section className="reminders-card">

        <div className="reminders-card-header">

          <div>

            <span className="reminders-label">
              YOUR REMINDERS
            </span>

            <h2>
              Stay ahead of your day
            </h2>

          </div>

          <span className="reminder-count">
            {reminders.length} reminders
          </span>

        </div>


        {loading ? (

          <div className="reminders-empty">
            Loading your reminders...
          </div>

        ) : reminders.length === 0 ? (

          <div className="reminders-empty">

            <div className="reminder-empty-icon">
              ◷
            </div>

            <h3>
              Nothing scheduled.
            </h3>

            <p>
              Add a reminder and LIFEOS will
              keep track of it for you.
            </p>

            <button
              className="empty-add-button"
              onClick={() =>
                setShowModal(true)
              }
            >
              + Create your first reminder
            </button>

          </div>

        ) : (

          <div className="reminders-list">

            {reminders.map(
              (reminder) => (

                <div
                  className="reminder-row"
                  key={reminder.id}
                >

                  <div className="reminder-icon">
                    ◷
                  </div>

                  <div className="reminder-info">

                    <strong>
                      {reminder.title}
                    </strong>

                    <span>
                      {formatReminderDate(
                        reminder.reminderTime
                      )}
                    </span>

                  </div>

                  <span className="reminder-status">
                    {reminder.completed
                      ? 'DONE'
                      : 'UPCOMING'}
                  </span>

                  <button
                    className="reminder-delete"
                    onClick={() =>
                      deleteReminder(
                        reminder.id
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              )
            )}

          </div>

        )}

      </section>


      {/* CREATE REMINDER MODAL */}

      {showModal && (

        <div
          className="reminder-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="reminder-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="reminder-modal-header">

              <div>

                <span className="reminders-label">
                  NEW REMINDER
                </span>

                <h2>
                  When should we remind you?
                </h2>

              </div>

              <button
                className="reminder-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>

            </div>


            <form
              onSubmit={createReminder}
            >

              <label>
                Reminder
              </label>

              <input
                className="reminder-input"
                type="text"
                placeholder="e.g. Call Mom"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                autoFocus
                maxLength={100}
              />


              <div className="reminder-fields">

                <div>

                  <label>
                    Date
                  </label>

                  <input
                    className="reminder-input"
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(event) =>
                      setDate(
                        event.target.value
                      )
                    }
                  />

                </div>


                <div>

                  <label>
                    Time
                  </label>

                  <div className="time-picker">

                    <input
                      className="reminder-input"
                      type="text"
                      placeholder="09:30"
                      value={time}
                      onChange={(event) => {

                        let value =
                          event.target.value
                            .replace(
                              /\D/g,
                              ''
                            )

                        if (
                          value.length > 4
                        ) {
                          value =
                            value.slice(
                              0,
                              4
                            )
                        }

                        if (
                          value.length > 2
                        ) {
                          value =
                            value.slice(
                              0,
                              2
                            ) +
                            ':' +
                            value.slice(2)
                        }

                        setTime(value)
                      }}
                      maxLength={5}
                    />

                    <select
                      className="reminder-input time-period"
                      value={timePeriod}
                      onChange={(event) =>
                        setTimePeriod(
                          event.target.value
                        )
                      }
                    >

                      <option value="AM">
                        AM
                      </option>

                      <option value="PM">
                        PM
                      </option>

                    </select>

                  </div>

                </div>

              </div>


              <div className="reminder-modal-actions">

                <button
                  type="button"
                  className="reminder-cancel"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="reminder-save"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Set reminder'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {message && (

        <div className="lifeos-toast">
          <span>✓</span>
          {message}
        </div>

      )}

    </div>
  )
}

export default Reminders

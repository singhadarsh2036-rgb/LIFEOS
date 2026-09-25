import { useEffect, useRef, useState } from 'react'
import './Reminders.css'
import { apiFetch } from './api'

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

  const [notificationPermission, setNotificationPermission] =
    useState(
      typeof Notification !== 'undefined'
        ? Notification.permission
        : 'default'
    )

  const [notificationLoading, setNotificationLoading] =
    useState(false)

  const notifiedReminders = useRef(new Set())

  // =====================================================
  // TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('jwt') ||
      localStorage.getItem('accessToken') ||
      ''
    )
  }

  // =====================================================
  // MESSAGE
  // =====================================================

  const showMessage = (text) => {
    setMessage(text)

    setTimeout(() => {
      setMessage('')
    }, 2200)
  }

  // =====================================================
  // PUSH NOTIFICATIONS
  // =====================================================

  const setupPushNotifications = async (
    requestPermission = false
  ) => {
    try {
      setNotificationLoading(true)

      if (!('serviceWorker' in navigator)) {
        showMessage(
          'Notifications are not supported on this device'
        )
        return false
      }

      if (!('Notification' in window)) {
        showMessage(
          'Notifications are not supported'
        )
        return false
      }

      const token = getToken()

      if (!token) {
        console.log('❌ No login token found')
        return false
      }

      let permission = Notification.permission

      if (
        permission === 'default' &&
        requestPermission
      ) {
        permission =
          await Notification.requestPermission()

        setNotificationPermission(permission)
      }

      if (permission === 'denied') {
        showMessage(
          'Notifications are blocked. Enable them in browser settings for LIFEOS.'
        )
        return false
      }

      if (permission !== 'granted') {
        showMessage(
          'Tap Enable Notifications and allow notifications.'
        )
        return false
      }

      setNotificationPermission('granted')

      const registration =
        await navigator.serviceWorker.ready

      if (!registration.pushManager) {
        showMessage(
          'Push notifications are unavailable here.'
        )
        return false
      }

      // GET VAPID PUBLIC KEY

      const publicKeyResponse =
        await apiFetch(
          '/push/public-key'
        )

      if (!publicKeyResponse.ok) {
        throw new Error(
          'Failed to get VAPID public key'
        )
      }

      const publicKey =
        await publicKeyResponse.text()

      if (!publicKey) {
        throw new Error(
          'VAPID public key is empty'
        )
      }

      // Base64 → Uint8Array

      const urlBase64ToUint8Array = (
        base64String
      ) => {
        const padding =
          '='.repeat(
            (4 -
              (base64String.length % 4)) %
              4
          )

        const base64 =
          (
            base64String + padding
          )
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData =
          window.atob(base64)

        return Uint8Array.from(
          [...rawData].map(
            (char) =>
              char.charCodeAt(0)
          )
        )
      }

      let subscription =
        await registration.pushManager
          .getSubscription()

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

      if (
        !subscriptionJson.endpoint ||
        !subscriptionJson.keys?.p256dh ||
        !subscriptionJson.keys?.auth
      ) {
        throw new Error(
          'Invalid push subscription data'
        )
      }

      const subscriptionData = {
        endpoint:
          subscriptionJson.endpoint,

        keys: {
          p256dh:
            subscriptionJson.keys.p256dh,

          auth:
            subscriptionJson.keys.auth,
        },
      }

      const response =
        await apiFetch(
          '/push/subscribe',
          {
            method: 'POST',

            body:
              JSON.stringify(
                subscriptionData
              ),
          }
        )

      const responseText =
        await response.text()

      if (!response.ok) {
        throw new Error(
          `Subscription failed: ${response.status} ${responseText}`
        )
      }

      showMessage(
        'Notifications enabled ✓'
      )

      return true

    } catch (error) {
      console.error(
        '❌ PUSH NOTIFICATION SETUP ERROR:',
        error
      )

      showMessage(
        'Could not enable notifications'
      )

      return false

    } finally {
      setNotificationLoading(false)
    }
  }

  const enableNotifications = async () => {
    await setupPushNotifications(true)
  }

  // =====================================================
  // LOAD REMINDERS
  // =====================================================

  const loadReminders = async () => {
    try {
      setLoading(true)

      const token = getToken()

      if (!token) {
        console.error(
          '❌ No authentication token found'
        )

        setReminders([])
        return
      }

      const response =
        await apiFetch(
          '/reminders',
          {
            method: 'GET',

            headers: {
              Accept:
                'application/json',
            },
          }
        )

      if (!response.ok) {
        const errorText =
          await response.text()

        throw new Error(
          `Could not load reminders: ${response.status} ${errorText}`
        )
      }

      const data =
        await response.json()

      console.log(
        '✅ REMINDERS LOADED:',
        data
      )

      setReminders(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (error) {
      console.error(
        '❌ REMINDER LOAD ERROR:',
        error
      )

      showMessage(
        'Could not load reminders'
      )

    } finally {
      setLoading(false)
    }
  }

  // =====================================================
  // INITIAL SETUP
  // =====================================================

  useEffect(() => {
    loadReminders()

    if ('Notification' in window) {
      const currentPermission =
        Notification.permission

      setNotificationPermission(
        currentPermission
      )

      if (
        currentPermission ===
        'granted'
      ) {
        setupPushNotifications(false)
      }
    }
  }, [])

  // =====================================================
  // CREATE REMINDER
  // =====================================================

  const createReminder = async (
    event
  ) => {
    event.preventDefault()

    if (saving) {
      return
    }

    if (!title.trim()) {
      showMessage(
        'Enter a reminder'
      )
      return
    }

    if (!date || !time) {
      showMessage(
        'Select date and time'
      )
      return
    }

    const timeParts =
      time.split(':')

    if (
      timeParts.length !== 2 ||
      parseInt(
        timeParts[0],
        10
      ) < 1 ||
      parseInt(
        timeParts[0],
        10
      ) > 12 ||
      parseInt(
        timeParts[1],
        10
      ) < 0 ||
      parseInt(
        timeParts[1],
        10
      ) > 59
    ) {
      showMessage(
        'Enter a valid time'
      )
      return
    }

    try {
      setSaving(true)

      let hour =
        parseInt(
          timeParts[0],
          10
        )

      if (
        timePeriod === 'AM'
      ) {
        if (hour === 12) {
          hour = 0
        }
      } else {
        if (hour !== 12) {
          hour += 12
        }
      }

      const formattedHour =
        String(hour)
          .padStart(2, '0')

      const reminderTime =
        `${date}T${formattedHour}:${timeParts[1]}:00`

      const selectedDateTime =
        new Date(reminderTime)

      const now =
        new Date()

      if (
        selectedDateTime <=
        now
      ) {
        showMessage(
          'Please select a future date and time'
        )
        return
      }

      const token = getToken()

      if (!token) {
        showMessage(
          'Please login again'
        )
        return
      }

      const response =
        await apiFetch(
          '/reminders',
          {
            method: 'POST',

            body:
              JSON.stringify({
                title:
                  title.trim(),

                reminderTime,

                completed:
                  false,

                notificationSent:
                  false,
              }),
          }
        )

      if (!response.ok) {
        const errorText =
          await response.text()

        throw new Error(
          errorText ||
          `Request failed with status ${response.status}`
        )
      }

      await response.json()

      // Reload from backend
      // so UI always matches database

      await loadReminders()

      setTitle('')
      setDate('')
      setTime('')
      setTimePeriod('AM')
      setShowModal(false)

      showMessage(
        'Reminder created ✓'
      )

    } catch (error) {
      console.error(
        '❌ CREATE REMINDER ERROR:',
        error
      )

      const errorMessage =
        error?.message?.trim()

      showMessage(
        errorMessage
          ? `Couldn't create reminder: ${errorMessage}`
          : 'Could not create reminder'
      )

    } finally {
      setSaving(false)
    }
  }

  // =====================================================
  // DELETE REMINDER
  // =====================================================

  const deleteReminder =
    async (id) => {
      try {
        const token =
          getToken()

        if (!token) {
          showMessage(
            'Please login again'
          )
          return
        }

        const response =
          await apiFetch(
            `/reminders/${id}`,
            {
              method: 'DELETE',
            }
          )

        if (!response.ok) {
          throw new Error(
            'Could not delete reminder'
          )
        }

        setReminders(
          (current) =>
            current.filter(
              (reminder) =>
                reminder.id !== id
            )
        )

        showMessage(
          'Reminder deleted'
        )

      } catch (error) {
        console.error(
          error
        )

        showMessage(
          'Could not delete reminder'
        )
      }
    }

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatReminderDate =
    (value) => {
      if (!value) return ''

      const dateObject =
        new Date(value)

      return dateObject.toLocaleString(
        'en-IN',
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }
      )
    }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="reminders-page">

      {/* HEADER */}

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


      {/* NOTIFICATION PERMISSION */}

      {notificationPermission !==
        'granted' && (

        <div
          className="reminders-card"
          style={{
            marginBottom: '18px',
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >

            <div>

              <span className="reminders-label">
                LIFEOS NOTIFICATIONS
              </span>

              <h2
                style={{
                  margin:
                    '6px 0 4px',
                }}
              >
                Enable reminders
              </h2>

              <p
                style={{
                  margin: 0,
                  opacity: 0.7,
                }}
              >
                Allow notifications so
                LIFEOS can remind you on
                this device.
              </p>

            </div>

            <button
              className="reminder-add-button"
              onClick={
                enableNotifications
              }
              disabled={
                notificationLoading
              }
            >
              {notificationLoading
                ? 'Enabling...'
                : '🔔 Enable Notifications'}
            </button>

          </div>

        </div>
      )}


      {/* REMINDERS LIST */}

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
                    aria-label={`Delete ${reminder.title}`}
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
                type="button"
              >
                ×
              </button>

            </div>


            <form
              onSubmit={
                createReminder
              }
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
                    min={
                      new Date()
                        .toISOString()
                        .split('T')[0]
                    }
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
                          value.length >
                          4
                        ) {
                          value =
                            value.slice(
                              0,
                              4
                            )
                        }

                        if (
                          value.length >
                          2
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


      {/* TOAST */}

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
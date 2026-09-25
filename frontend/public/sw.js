self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim()
  )
})

self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data
      ? event.data.json()
      : {}
  } catch (error) {
    console.error(
      'LIFEOS PUSH PARSE ERROR:',
      error
    )
  }

  const title =
    data.title || 'LIFEOS ✦'

  const reminderId =
    data.reminderId ||
    data.id ||
    data.reminder?.id ||
    'default'

  const options = {
    body:
      data.body ||
      'Bro… you have something to do. 👀',

    icon: '/vite.svg',
    badge: '/vite.svg',

    vibrate: [100, 50, 100],

    // Same reminder = same notification
    tag: `lifeos-reminder-${reminderId}`,

    // Don't create another alert for the same tag
    renotify: false,

    silent: false,

    timestamp: Date.now(),

    data: {
      url:
        data.url ||
        '/reminders',

      reminderId,
    },

    actions: [
      {
        action: 'open',
        title: 'Open LIFEOS',
      },
      {
        action: 'close',
        title: 'Later',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close()

    if (event.action === 'close') {
      return
    }

    const url =
      event.notification.data?.url ||
      '/reminders'

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {

          for (const client of clientList) {
            if (
              'focus' in client
            ) {
              client.navigate?.(url)
              return client.focus()
            }
          }

          if (
            clients.openWindow
          ) {
            return clients.openWindow(
              url
            )
          }
        })
    )
  }
)
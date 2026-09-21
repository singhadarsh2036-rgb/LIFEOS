self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}

  try {
    data = event.data ? event.data.json() : {}
  } catch (error) {
    data = {
      title: 'LIFEOS Reminder 🔔',
      body: 'You have a reminder.',
    }
  }

  const title = data.title || 'LIFEOS Reminder 🔔'

  const options = {
    body: data.body || 'You have a reminder.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: {
      url: data.url || '/reminders',
    },
  }

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(
          event.notification.data.url
        )
      }
    })
  )
})
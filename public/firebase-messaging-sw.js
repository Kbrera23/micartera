/* Firebase Cloud Messaging Service Worker */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB_lEBgSXXo-7vUDxGl7Ml17_dgn2i6WiQ',
  authDomain: 'micartera-notifications.firebaseapp.com',
  projectId: 'micartera-notifications',
  storageBucket: 'micartera-notifications.firebasestorage.app',
  messagingSenderId: '228032855350',
  appId: '1:228032855350:web:0d4cf6e339c6e5008b0797',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message:', payload);
  const title = payload.notification?.title || 'Notificación';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: payload.notification?.image,
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

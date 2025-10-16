/* global self */
// Firebase Messaging Service Worker
// Loads config from public/fcm-sw-config.js. Replace placeholders there.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
importScripts('/fcm-sw-config.js');

firebase.initializeApp(self.FIREBASE_CONFIG);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'TaskHive';
  const options = {
    body: payload.notification?.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload?.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification?.data?.url || '/';
  event.waitUntil(self.clients.openWindow(url));
});

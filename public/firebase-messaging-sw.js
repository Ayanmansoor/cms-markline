// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyCyTqYsNppNJ7ZqLz4eDFOxL-3An-n086M",
  authDomain: "markline-2692c.firebaseapp.com",
  projectId: "markline-2692c",
  storageBucket: "markline-2692c.firebasestorage.app",
  messagingSenderId: "712790076110",
  appId: "1:712790076110:web:1ecee178d291950305fe9f"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'Notification'
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.image || '/favicon.ico',
    data: payload.data || {}
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

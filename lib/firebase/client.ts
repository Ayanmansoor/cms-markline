import { initializeApp, getApps, getApp } from "firebase/app"
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging"

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCyTqYsNppNJ7ZqLz4eDFOxL-3An-n086M",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "markline-2692c.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "markline-2692c",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "markline-2692c.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "712790076110",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:712790076110:web:1ecee178d291950305fe9f",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-MFJSXCWT4S"
}

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

/**
 * Initialize Client Firebase Messaging
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    try {
      return getMessaging(app)
    } catch (err: any) {
      console.warn("[Firebase Client] Messaging initialization warning:", err.message)
      return null
    }
  }
  return null
}

/**
 * Request notification permission and return FCM registration token
 */
export async function requestFcmToken(vapidKey?: string): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      console.warn("[FCM Permission] Notification permission denied by user")
      return null
    }

    const messaging = getFirebaseMessaging()
    if (!messaging) return null

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey
    })

    if (token) {
      console.log("[FCM Client] FCM Token retrieved successfully:", token)
      return token
    }
  } catch (err: any) {
    console.error("[FCM Client] Error getting FCM Token:", err.message)
  }

  return null
}

/**
 * Listen for foreground FCM push messages
 */
export function onForegroundFcmMessage(callback: (payload: any) => void) {
  const messaging = getFirebaseMessaging()
  if (messaging) {
    return onMessage(messaging, (payload) => {
      console.log("[FCM Foreground Message] Received:", payload)
      callback(payload)
    })
  }
  return () => {}
}

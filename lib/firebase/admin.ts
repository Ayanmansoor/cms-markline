import * as admin from 'firebase-admin'

function getFirebaseAdmin() {
  if (!(admin as any).apps?.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined

    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: (admin as any).credential.cert({
            projectId,
            clientEmail,
            privateKey
          })
        })
        console.log('[Firebase Admin] Initialized with Service Account')
      } catch (err: any) {
        console.error('[Firebase Admin] Initialization error:', err.message)
      }
    } else {
      try {
        admin.initializeApp()
      } catch (_) {
        console.warn(
          '[Firebase Admin] Missing environment credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). FCM will run in fallback simulation mode.'
        )
      }
    }
  }

  return admin
}

export { getFirebaseAdmin }

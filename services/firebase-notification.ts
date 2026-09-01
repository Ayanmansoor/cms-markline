import { getFirebaseAdmin } from '@/lib/firebase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export interface FirebaseNotificationPayload {
  title: string
  message: string
  banner_url?: string | null
  action_url?: string | null
  notification_type?: string
  data?: Record<string, string>
}

export interface FcmTokenRecord {
  id?: number
  fcm_token: string
  user_id: string | null
  device_id?: string | null
  device_type?: string | null
}

export interface DispatchResult {
  success: boolean
  message: string
  sentCount: number
  failedCount: number
  totalTokensFound: number
  simulated?: boolean
  error?: string
  recipientUserIds: string[]
}

/**
 * Send FCM push notification to all subscribed users (Querying table `fcms`)
 */
export async function sendFirebaseNotificationToAll(
  payload: FirebaseNotificationPayload
): Promise<DispatchResult> {
  const supabase = await createServerClient()
  const admin = getFirebaseAdmin() as any

  // 1. Fetch all active FCM tokens and user_ids from `fcms` table
  let fcmRecords: FcmTokenRecord[] = []
  try {
    const { data, error } = await supabase
      .from('fcms')
      .select('id, fcm_token, user_id, device_id, device_type')
      .not('fcm_token', 'is', null)

    if (error) {
      console.warn('[FCM Service] fcms table query error:', error.message)
    } else if (data) {
      fcmRecords = data.filter((r) => r.fcm_token && r.fcm_token.trim().length > 0)
    }
    console.log('[FCM Service: sendFirebaseNotificationToAll] Query result row count:', data?.length || 0, 'Active token records:', fcmRecords.length)
  } catch (err: any) {
    console.warn('[FCM Service] Failed to query fcms table:', err.message)
  }

  const tokens = Array.from(new Set(fcmRecords.map((r) => r.fcm_token)))
  const recipientUserIds = Array.from(
    new Set(fcmRecords.map((r) => r.user_id).filter((uId): uId is string => !!uId))
  )

  console.log('[FCM Service: sendFirebaseNotificationToAll] Unique tokens:', tokens)
  console.log('[FCM Service: sendFirebaseNotificationToAll] Recipient user IDs:', recipientUserIds)

  if (tokens.length === 0) {
    console.log('[FCM Service: sendFirebaseNotificationToAll] No active FCM tokens found in fcms table')
    return {
      success: true,
      message: 'No subscribed user FCM tokens found in fcms table to send notifications',
      sentCount: 0,
      failedCount: 0,
      totalTokensFound: 0,
      simulated: false,
      recipientUserIds
    }
  }

  // 2. Dispatch FCM Multicast message via Firebase Admin SDK
  const appsCount = (admin as any).apps?.length || 0
  console.log('[FCM Service: sendFirebaseNotificationToAll] Firebase Admin SDK state:', { appsCount, hasMessaging: !!admin.messaging })

  if (appsCount > 0 && admin.messaging) {
    try {
      // Firebase Multicast limits 500 tokens per batch
      let totalSentCount = 0
      let totalFailedCount = 0
      const batchSize = 500

      for (let i = 0; i < tokens.length; i += batchSize) {
        const batchTokens = tokens.slice(i, i + batchSize)
        const multicastMessage = {
          tokens: batchTokens,
          notification: {
            title: payload.title,
            body: payload.message,
            imageUrl: payload.banner_url || undefined
          },
          data: {
            click_action: payload.action_url || '/',
            notification_type: payload.notification_type || 'PUSH',
            ...(payload.data || {})
          }
        }

        const response = await admin.messaging().sendEachForMulticast(multicastMessage)
        totalSentCount += response.successCount
        totalFailedCount += response.failureCount
      }

      console.log(`[FCM Service] Broadcast dispatched to ${totalSentCount}/${tokens.length} devices from fcms table`)

      return {
        success: totalSentCount > 0,
        message: `FCM push notification successfully sent to ${totalSentCount} subscribed user devices`,
        sentCount: totalSentCount,
        failedCount: totalFailedCount,
        totalTokensFound: tokens.length,
        simulated: false,
        recipientUserIds
      }
    } catch (error: any) {
      console.error('[FCM Service] Firebase multicast dispatch error:', error.message)
      return {
        success: false,
        message: `FCM multicast dispatch failed: ${error.message}`,
        sentCount: 0,
        failedCount: tokens.length,
        totalTokensFound: tokens.length,
        simulated: false,
        error: error.message,
        recipientUserIds
      }
    }
  }

  // Fallback when admin SDK credentials missing
  return {
    success: true,
    message: `FCM push ready for ${tokens.length} device tokens in fcms table (Firebase keys unconfigured)`,
    sentCount: tokens.length,
    failedCount: 0,
    totalTokensFound: tokens.length,
    simulated: true,
    recipientUserIds
  }
}

/**
 * Send targeted FCM notification to specific user IDs (Querying table `fcms`)
 */
export async function sendFirebaseNotificationToUsers(
  userIds: string[],
  payload: FirebaseNotificationPayload
): Promise<DispatchResult> {
  if (!userIds || userIds.length === 0) {
    return {
      success: false,
      message: 'No target user IDs provided for FCM dispatch',
      sentCount: 0,
      failedCount: 0,
      totalTokensFound: 0,
      recipientUserIds: []
    }
  }

  const supabase = await createServerClient()
  const admin = getFirebaseAdmin() as any

  let fcmRecords: FcmTokenRecord[] = []
  try {
    const { data, error } = await supabase
      .from('fcms')
      .select('id, fcm_token, user_id, device_id, device_type')
      .in('user_id', userIds)
      .not('fcm_token', 'is', null)

    if (error) {
      console.warn('[FCM Service] Targeted fcms table query error:', error.message)
    } else if (data) {
      fcmRecords = data.filter((r) => r.fcm_token && r.fcm_token.trim().length > 0)
    }
    console.log('[FCM Service: sendFirebaseNotificationToUsers] Query result row count:', data?.length || 0, 'Active token records:', fcmRecords.length)
  } catch (err: any) {
    console.warn('[FCM Service] Targeted fcms table query failed:', err.message)
  }

  const tokens = Array.from(new Set(fcmRecords.map((r) => r.fcm_token)))
  const recipientUserIds = Array.from(
    new Set(fcmRecords.map((r) => r.user_id).filter((uId): uId is string => !!uId))
  )

  console.log('[FCM Service: sendFirebaseNotificationToUsers] Unique tokens:', tokens)
  console.log('[FCM Service: sendFirebaseNotificationToUsers] Recipient user IDs:', recipientUserIds)

  if (tokens.length === 0) {
    console.log('[FCM Service: sendFirebaseNotificationToUsers] No saved FCM device tokens found in fcms table for the selected user(s)')
    return {
      success: true,
      message: `No saved FCM device tokens found in fcms table for the selected ${userIds.length} user(s)`,
      sentCount: 0,
      failedCount: 0,
      totalTokensFound: 0,
      simulated: false,
      recipientUserIds: userIds
    }
  }

  const appsCount = (admin as any).apps?.length || 0
  console.log('[FCM Service: sendFirebaseNotificationToUsers] Firebase Admin SDK state:', { appsCount, hasMessaging: !!admin.messaging })

  if (appsCount > 0 && admin.messaging) {
    try {
      const multicastMessage = {
        tokens: tokens,
        notification: {
          title: payload.title,
          body: payload.message,
          imageUrl: payload.banner_url || undefined
        },
        data: {
          click_action: payload.action_url || '/',
          notification_type: payload.notification_type || 'PUSH',
          ...(payload.data || {})
        }
      }

      const response = await admin.messaging().sendEachForMulticast(multicastMessage)
      console.log(`[FCM Service] Targeted multicast sent: ${response.successCount}/${tokens.length}`)

      return {
        success: response.successCount > 0,
        message: `FCM push notification sent to ${response.successCount} targeted user device(s)`,
        sentCount: response.successCount,
        failedCount: response.failureCount,
        totalTokensFound: tokens.length,
        simulated: false,
        recipientUserIds: userIds
      }
    } catch (error: any) {
      console.error('[FCM Service] Targeted FCM error:', error.message)
    }
  }

  return {
    success: true,
    message: `Targeted FCM push ready for ${tokens.length} token(s) of targeted user(s)`,
    sentCount: tokens.length,
    failedCount: 0,
    totalTokensFound: tokens.length,
    simulated: true,
    recipientUserIds: userIds
  }
}

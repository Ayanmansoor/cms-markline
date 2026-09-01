import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  sendFirebaseNotificationToAll,
  sendFirebaseNotificationToUsers,
  DispatchResult
} from '@/services/firebase-notification'

const frontendToDbType: Record<string, string> = {
  'PUSH': 'General',
  'ANNOUNCEMENT': 'General',
  'PROMOTIONAL': 'Promotion',
  'ORDER_UPDATE': 'Order',
  'SYSTEM': 'System',
  'RETURN': 'Return',
  'REFUND': 'Refund'
}

const dbToFrontendType: Record<string, string> = {
  'General': 'PUSH',
  'Promotion': 'PROMOTIONAL',
  'Order': 'ORDER_UPDATE',
  'System': 'SYSTEM',
  'Return': 'RETURN',
  'Refund': 'REFUND'
}

const dbToFrontendStatus: Record<string, string> = {
  'Draft': 'DRAFT',
  'Scheduled': 'SCHEDULED',
  'Sending': 'SENDING',
  'Sent': 'SENT',
  'Cancelled': 'CANCELLED'
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServerClient()

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })

    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }

    if (type && type !== 'ALL') {
      query = query.eq('notification_type', type)
    }

    if (search && search.trim()) {
      query = query.or(`title.ilike.%${search.trim()}%,message.ilike.%${search.trim()}%`)
    }

    const { data: notifications, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn('notifications table query error:', error.message)
    }



    const list = (notifications || []).map((notif: any) => ({
      ...notif,
      audience: notif.audience === 'All Users' ? 'ALL' : notif.audience === 'Selected Users' ? 'SPECIFIC' : notif.audience,
      notification_type: dbToFrontendType[notif.notification_type] || notif.notification_type,
      status: dbToFrontendStatus[notif.status] || notif.status
    }))

    return NextResponse.json({
      success: true,
      notifications: list,
      totalCount: count !== null ? count : list.length,
      page,
      limit
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      message,
      banner_url,
      imageUrl,
      action_url,
      actionUrl,
      notification_type,
      notificationType,
      audience,
      targetType,
      scheduled_at,
      scheduledAt,
      targetUserIds
    } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message content are required' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Retrieve current authenticated user ID if available
    let createdBy: string | null = null
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) createdBy = user.id
    } catch (_) {}

    const finalBannerUrl = banner_url || imageUrl || null
    const finalActionUrl = action_url || actionUrl || null


    const finalTypeRaw = notification_type || notificationType || 'PUSH'
    const finalType = frontendToDbType[finalTypeRaw] || 'General'
    const finalAudienceRaw = audience || (targetType === 'specific' ? 'SPECIFIC' : 'ALL')
    const finalAudience = finalAudienceRaw === 'ALL' || finalAudienceRaw === 'All Users' ? 'All Users' : 'Selected Users'

    const isScheduled = false
    const status = 'Sent'
    const sentAt = new Date().toISOString()

    const recipientUserIds: string[] = Array.isArray(targetUserIds) ? targetUserIds : []

    // 1. Dispatch Firebase FCM Push Notifications using `fcms` token lookup
    let fcmResult: DispatchResult | null = null
    if (!isScheduled) {
      const fcmPayload = {
        title: title.trim(),
        message: message.trim(),
        banner_url: finalBannerUrl,
        action_url: finalActionUrl,
        notification_type: finalTypeRaw
      }

      if (finalAudience === 'All Users') {
        fcmResult = await sendFirebaseNotificationToAll(fcmPayload)
      } else {
        fcmResult = await sendFirebaseNotificationToUsers(recipientUserIds, fcmPayload)
      }
    }

    const totalRecipients = fcmResult?.totalTokensFound || fcmResult?.recipientUserIds.length || recipientUserIds.length || 0
    const totalSent = isScheduled ? 0 : (fcmResult?.sentCount ?? totalRecipients)

    const payload = {
      title: title.trim(),
      message: message.trim(),
      banner_url: finalBannerUrl ? finalBannerUrl.trim() : null,
      action_url: finalActionUrl ? finalActionUrl.trim() : null,
      notification_type: finalType,
      audience: finalAudience,
      status: status,
      sent_at: sentAt,
      total_recipients: totalRecipients,
      total_sent: totalSent,
      total_read: 0,
      created_by: createdBy,
      updated_at: new Date().toISOString()
    }

    // 2. Insert into notifications table
    console.log('[DEBUG] Inserting notification payload into Supabase:', payload)
    const { data: newNotification, error: notifError } = await supabase
      .from('notifications')
      .insert(payload)
      .select()
      .single()

    if (notifError) {
      console.error('Could not insert into notifications table:', notifError)
    }

    const notificationId = newNotification?.id || Date.now()

    // 3. Create tracking entries in notification_recipients for targeted user IDs
    const finalRecipientsList = fcmResult?.recipientUserIds?.length
      ? fcmResult.recipientUserIds
      : recipientUserIds

    if (finalRecipientsList.length > 0 && newNotification?.id) {
      const recipientRows = finalRecipientsList.map((uId: string) => ({
        notification_id: notificationId,
        user_id: uId,
        delivery_status: isScheduled ? 'PENDING' : 'SENT',
        sent_at: sentAt,
        is_read: false,
        read_at: null,
        is_clicked: false,
        clicked_at: null
      }))

      const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipientRows)

      if (recipientError) {
        console.error('Could not insert into notification_recipients table:', recipientError)
      }
    }



    return NextResponse.json({
      success: true,
      message: isScheduled
        ? 'Notification scheduled successfully!'
        : (fcmResult?.message || 'Firebase FCM Push Notification dispatched!'),
      fcmResult,
      notification: newNotification ? {
        ...newNotification,
        audience: newNotification.audience === 'All Users' ? 'ALL' : 'SPECIFIC',
        notification_type: dbToFrontendType[newNotification.notification_type] || newNotification.notification_type,
        status: dbToFrontendStatus[newNotification.status] || newNotification.status
      } : {
        id: notificationId,
        created_at: new Date().toISOString(),
        ...payload,
        audience: finalAudience === 'All Users' ? 'ALL' : 'SPECIFIC',
        notification_type: finalTypeRaw,
        status: isScheduled ? 'SCHEDULED' : 'SENT'
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('[Notifications POST API Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

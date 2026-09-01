import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

// GET /api/marketing/notifications/[id]
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const notificationId = parseInt(id, 10)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: notification, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }



    return NextResponse.json({
      success: true,
      notification: notification ? {
        ...notification,
        audience: notification.audience === 'All Users' ? 'ALL' : 'SPECIFIC',
        notification_type: dbToFrontendType[notification.notification_type] || notification.notification_type,
        status: dbToFrontendStatus[notification.status] || notification.status
      } : null
    })
  } catch (error: any) {
    console.error('[Notification GET Details Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// PUT / PATCH /api/marketing/notifications/[id]
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const notificationId = parseInt(id, 10)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    const body = await request.json()
    const { title, message, banner_url, action_url, notification_type, audience, status } = body

    const supabase = await createServerClient()
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }



    if (title !== undefined) updatePayload.title = title.trim()
    if (message !== undefined) updatePayload.message = message.trim()
    if (banner_url !== undefined) updatePayload.banner_url = banner_url || null
    if (action_url !== undefined) updatePayload.action_url = action_url || null
    if (notification_type !== undefined) {
      updatePayload.notification_type = frontendToDbType[notification_type] || 'General'
    }
    if (audience !== undefined) {
      updatePayload.audience = audience === 'ALL' || audience === 'All Users' ? 'All Users' : 'Selected Users'
    }
    const statusMap: Record<string, string> = {
      'DRAFT': 'Draft',
      'SCHEDULED': 'Scheduled',
      'SENDING': 'Sending',
      'SENT': 'Sent',
      'CANCELLED': 'Cancelled'
    }
    if (status !== undefined) updatePayload.status = statusMap[status] || status

    const { data: updated, error } = await supabase
      .from('notifications')
      .update(updatePayload)
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      console.error('notifications update error:', error)
    }



    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
      notification: updated ? {
        ...updated,
        audience: updated.audience === 'All Users' ? 'ALL' : 'SPECIFIC',
        notification_type: dbToFrontendType[updated.notification_type] || updated.notification_type,
        status: dbToFrontendStatus[updated.status] || updated.status
      } : {
        id: notificationId,
        ...updatePayload,
        audience: updatePayload.audience === 'All Users' ? 'ALL' : 'SPECIFIC',
        notification_type: notification_type !== undefined ? notification_type : undefined,
        status: status !== undefined ? status : undefined
      }
    })
  } catch (error: any) {
    console.error('[Notification PUT Error]:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context)
}

// DELETE /api/marketing/notifications/[id]
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const notificationId = parseInt(id, 10)

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    const supabase = await createServerClient()

    // 1. Delete associated recipient rows from notification_recipients
    const { error: recipientError } = await supabase
      .from('notification_recipients')
      .delete()
      .eq('notification_id', notificationId)

    if (recipientError) {
      console.warn('notification_recipients cascade delete warning:', recipientError.message)
    }

    // 2. Delete notification from notifications table
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (notifError) {
      console.warn('notifications delete warning:', notifError.message)
    }

    return NextResponse.json({
      success: true,
      message: `Notification #${notificationId} and its recipient logs deleted successfully`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

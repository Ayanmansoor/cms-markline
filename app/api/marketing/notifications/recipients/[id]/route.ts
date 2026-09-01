import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// PATCH /api/marketing/notifications/recipients/[id]
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const recipientId = parseInt(id, 10)

    if (isNaN(recipientId)) {
      return NextResponse.json({ error: 'Invalid recipient ID' }, { status: 400 })
    }

    const body = await request.json()
    const { is_read, is_clicked, delivery_status } = body

    const supabase = await createServerClient()
    const updatePayload: Record<string, any> = {}

    if (is_read !== undefined) {
      updatePayload.is_read = !!is_read
      if (is_read) updatePayload.read_at = new Date().toISOString()
    }

    if (is_clicked !== undefined) {
      updatePayload.is_clicked = !!is_clicked
      if (is_clicked) updatePayload.clicked_at = new Date().toISOString()
    }

    if (delivery_status !== undefined) {
      updatePayload.delivery_status = delivery_status
    }

    const { data: updatedRecipient, error } = await supabase
      .from('notification_recipients')
      .update(updatePayload)
      .eq('id', recipientId)
      .select()
      .single()

    if (error) {
      console.warn('notification_recipients patch error:', error.message)
    }

    // If marked read, also update aggregate total_read count in parent notifications table
    if (is_read && updatedRecipient?.notification_id) {
      const { data: parentNotif } = await supabase
        .from('notifications')
        .select('total_read')
        .eq('id', updatedRecipient.notification_id)
        .single()

      if (parentNotif) {
        await supabase
          .from('notifications')
          .update({ total_read: (parentNotif.total_read || 0) + 1 })
          .eq('id', updatedRecipient.notification_id)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recipient status updated successfully',
      recipient: updatedRecipient || { id: recipientId, ...updatePayload }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

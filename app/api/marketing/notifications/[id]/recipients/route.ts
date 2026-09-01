import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

    // Fetch recipient tracking details from notification_recipients table
    const { data: recipients, error } = await supabase
      .from('notification_recipients')
      .select('*')
      .eq('notification_id', notificationId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('notification_recipients table query error:', error.message)
    }

    return NextResponse.json({
      success: true,
      recipients: recipients || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

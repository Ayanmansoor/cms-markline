import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const campaignId = parseInt(id, 10)

    if (isNaN(campaignId)) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 })
    }

    const supabase = await createServerClient()
    const { data: recipients, error } = await supabase
      .from('email_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('email_campaign_recipients query error:', error.message)
    }

    return NextResponse.json({
      success: true,
      recipients: recipients || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

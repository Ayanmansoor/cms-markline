import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// GET /api/marketing/broadcasting/[id]
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
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      campaign
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/marketing/broadcasting/[id]
export async function DELETE(
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

    // 1. Delete associated recipient rows from email_campaign_recipients
    const { error: recipientError } = await supabase
      .from('email_campaign_recipients')
      .delete()
      .eq('campaign_id', campaignId)

    if (recipientError) {
      console.warn('email_campaign_recipients cascade delete warning:', recipientError.message)
    }

    // 2. Delete campaign from email_campaigns table
    const { error: campaignError } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId)

    if (campaignError) {
      console.warn('email_campaigns delete warning:', campaignError.message)
    }

    return NextResponse.json({
      success: true,
      message: `Email campaign #${campaignId} and its recipient logs deleted successfully`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

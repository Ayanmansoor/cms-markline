import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  sendEmailBroadcastToAll,
  sendEmailBroadcastToCustomers,
  EmailDispatchResult
} from '@/services/email-broadcasting'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const status = searchParams.get('status')
    const audience = searchParams.get('audience')
    const search = searchParams.get('search')

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServerClient()
    let query = supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' })

    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }

    if (audience && audience !== 'ALL') {
      const dbAudience = audience === 'SPECIFIC' ? 'Selected Users' : audience
      query = query.eq('audience', dbAudience)
    }

    if (search && search.trim()) {
      query = query.or(`subject.ilike.%${search.trim()}%,html_content.ilike.%${search.trim()}%`)
    }

    const { data: campaigns, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.warn('email_campaigns table query error:', error.message)
    }

    const list = campaigns || []

    return NextResponse.json({
      success: true,
      broadcasts: list,
      campaigns: list,
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
      subject,
      title,
      content,
      html_content,
      htmlContent,
      banner_url,
      bannerUrl,
      audience,
      targetType,
      scheduled_at,
      scheduledAt,
      targetCustomerIds,
      redirectUrl,
      redirect_url
    } = body

    const finalSubject = subject || title
    const finalContent = content || html_content || htmlContent || ''
    const finalBannerUrl = banner_url || bannerUrl || null
    const rawAudience = (audience || (targetType === 'specific' ? 'SPECIFIC' : 'ALL')).toUpperCase()
    const audienceValue: 'All Users' | 'Selected Users' = (rawAudience === 'SPECIFIC' || rawAudience === 'SELECTED USERS') ? 'Selected Users' : 'All Users'
    const finalScheduledAt = null
    const targetIds: string[] = Array.isArray(targetCustomerIds) ? targetCustomerIds : []

    if (!finalSubject) {
      return NextResponse.json({ error: 'Campaign subject title is required' }, { status: 400 })
    }

    // Execute Email Broadcasting Service via Nodemailer
    let emailResult: EmailDispatchResult
    const payload = {
      subject: finalSubject.trim(),
      content: finalContent.trim(),
      html_content: htmlContent || html_content,
      banner_url: finalBannerUrl,
      audience: audienceValue,
      scheduled_at: finalScheduledAt,
      targetCustomerIds: targetIds,
      redirectUrl: redirectUrl || redirect_url || null
    }

    if (audienceValue === 'All Users') {
      emailResult = await sendEmailBroadcastToAll(payload)
    } else {
      emailResult = await sendEmailBroadcastToCustomers(targetIds, payload)
    }

    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: emailResult.message || emailResult.error || 'Failed to dispatch email campaign',
        emailResult,
        campaignId: emailResult.campaignId
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: emailResult.message,
      emailResult,
      campaignId: emailResult.campaignId
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

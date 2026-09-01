import { transporter, defaultSenderEmail, defaultSenderName } from '@/lib/nodemailer'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export interface EmailCampaignPayload {
  subject: string
  content?: string
  html_content?: string
  banner_url?: string | null
  audience?: 'All Users' | 'Selected Users' | 'Newsletter' | 'ALL' | 'SPECIFIC' | 'all' | 'specific'
  scheduled_at?: string | null
  targetCustomerIds?: string[]
  redirectUrl?: string | null
}

export interface CustomerTarget {
  user_id: string | null
  email: string
  name: string | null
}

export interface EmailDispatchResult {
  success: boolean
  message: string
  campaignId?: number
  sentCount: number
  failedCount: number
  totalTargeted: number
  recipientEmails: string[]
  error?: string
}

/**
 * Helper to build HTML email template with optional banner and redirect URL links
 */
function buildHtmlEmailTemplate(subject: string, content: string, bannerUrl?: string | null, redirectUrl?: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb; margin: 0; padding: 20px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
          .banner { width: 100%; max-height: 220px; object-fit: cover; display: block; }
          .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 32px 24px; line-height: 1.6; font-size: 14px; color: #334155; }
          .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          ${bannerUrl ? (redirectUrl ? `<a href="${redirectUrl}" target="_blank"><img src="${bannerUrl}" alt="Banner" class="banner" /></a>` : `<img src="${bannerUrl}" alt="Banner" class="banner" />`) : ''}
          <div class="header">
            <h1>Markline Announcement</h1>
          </div>
          <div class="content">
            <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">${subject}</h2>
            <div style="white-space: pre-wrap;">${content}</div>
            ${redirectUrl ? `
              <div style="margin-top: 30px; text-align: center;">
                <a href="${redirectUrl}" target="_blank" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Visit Our Website
                </a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Markline. All rights reserved.</p>
            <p>You received this email as a subscriber or customer of Markline.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Fetch all customer targets (user_id, email, name) from database
 */
async function getAllCustomerTargets(supabase: any): Promise<CustomerTarget[]> {
  const targetsMap = new Map<string, CustomerTarget>()

  // 1. Fetch from auth.users using Service Role Key
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
      if (authData?.users) {
        authData.users.forEach((u: any) => {
          if (u.email && u.email.includes('@')) {
            const email = u.email.trim().toLowerCase()
            targetsMap.set(email, {
              user_id: u.id,
              email: u.email.trim(),
              name: u.user_metadata?.full_name || u.user_metadata?.name || null
            })
          }
        })
      }
    } catch (err: any) {
      console.warn('[Email Campaign] Error querying auth.users:', err.message)
    }
  }

  // 2. Query profiles table
  try {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, name, full_name')
      .not('email', 'is', null)

    if (profiles) {
      profiles.forEach((p: any) => {
        if (p.email && p.email.includes('@')) {
          const email = p.email.trim().toLowerCase()
          if (!targetsMap.has(email)) {
            targetsMap.set(email, {
              user_id: p.id || null,
              email: p.email.trim(),
              name: p.full_name || p.name || null
            })
          }
        }
      })
    }
  } catch (_) { }

  // 3. Query orders table
  try {
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, customer_email, customer_name')
      .not('customer_email', 'is', null)

    if (orders) {
      orders.forEach((o: any) => {
        if (o.customer_email && o.customer_email.includes('@')) {
          const email = o.customer_email.trim().toLowerCase()
          if (!targetsMap.has(email)) {
            targetsMap.set(email, {
              user_id: o.user_id || null,
              email: o.customer_email.trim(),
              name: o.customer_name || null
            })
          }
        }
      })
    }
  } catch (_) { }

  return Array.from(targetsMap.values())
}

/**
 * Send Email Campaign to ALL customers and record in email_campaigns & email_campaign_recipients
 */
export async function sendEmailBroadcastToAll(
  payload: EmailCampaignPayload
): Promise<EmailDispatchResult> {
  const supabase = await createServerClient()
  const targets = await getAllCustomerTargets(supabase)

  let createdBy: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) createdBy = user.id
  } catch (_) { }

  const isScheduled = !!payload.scheduled_at && new Date(payload.scheduled_at).getTime() > Date.now()

  // Exact Postgres Enum Values:
  // email_campaign_audience: 'All Users' | 'Selected Users' | 'Newsletter'
  // email_campaign_status: 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Cancelled'
  // email_delivery_status: 'Pending' | 'Sent' | 'Delivered' | 'Opened' | 'Clicked' | 'Failed' | 'Bounced' | 'Unsubscribed'

  const audienceEnum = 'All Users'
  const statusEnum = isScheduled ? 'Scheduled' : 'Sent'
  const sentAt = isScheduled ? null : new Date().toISOString()
  const htmlBody = payload.html_content || buildHtmlEmailTemplate(payload.subject, payload.content || '', payload.banner_url, payload.redirectUrl)

  // Insert campaign entry into email_campaigns table
  const campaignPayload = {
    subject: payload.subject.trim(),
    banner_url: payload.banner_url || null,
    html_content: htmlBody,
    audience: audienceEnum,
    status: statusEnum,
    sent_at: sentAt,
    total_recipients: targets.length,
    total_sent: 0,
    total_failed: 0,
    total_opened: 0,
    total_clicked: 0,
    created_by: createdBy,
    redirectUrl: payload.redirectUrl || null,
    updated_at: new Date().toISOString()
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .insert(campaignPayload)
    .select()
    .single()

  if (campaignError) {
    console.error('[Email Campaign] Could not insert into email_campaigns table:', campaignError)
  }

  const campaignId = campaign?.id || Date.now()

  if (targets.length === 0) {
    return {
      success: true,
      message: 'No registered customer emails found in database',
      campaignId,
      sentCount: 0,
      failedCount: 0,
      totalTargeted: 0,
      recipientEmails: []
    }
  }

  let sentCount = 0
  let failedCount = 0
  let lastError = ''
  const recipientRows: any[] = []

  if (!isScheduled) {
    for (const target of targets) {
      let deliveryStatus = 'Sent'
      let errorMessage: string | null = null

      try {
        const mailOptions = {
          from: `"${defaultSenderName}" <${defaultSenderEmail}>`,
          to: target.email,
          subject: payload.subject,
          text: payload.content || payload.subject,
          html: htmlBody
        }

        const info = await transporter.sendMail(mailOptions)
        sentCount++
        console.log(`[Nodemailer] Broadcast email sent to ${target.email}. MessageId:`, info.messageId)
      } catch (err: any) {
        failedCount++
        deliveryStatus = 'Failed'
        errorMessage = err.message
        lastError = err.message
        console.error(`[Nodemailer ERROR] Failed to send email to ${target.email}:`, err.message)
      }

      recipientRows.push({
        campaign_id: campaignId,
        user_id: target.user_id || null,
        email: target.email,
        name: target.name || null,
        delivery_status: deliveryStatus,
        sent_at: sentAt,
        opened_at: null,
        error_message: errorMessage
      })
    }
  } else {
    targets.forEach((target) => {
      recipientRows.push({
        campaign_id: campaignId,
        user_id: target.user_id || null,
        email: target.email,
        name: target.name || null,
        delivery_status: 'Pending',
        sent_at: null,
        opened_at: null,
        error_message: null
      })
    })
  }

  if (recipientRows.length > 0 && campaign?.id) {
    const { error: recipientInsertError } = await supabase
      .from('email_campaign_recipients')
      .insert(recipientRows)

    if (recipientInsertError) {
      console.warn('[Email Campaign] Could not insert email_campaign_recipients:', recipientInsertError.message)
    }

    await supabase
      .from('email_campaigns')
      .update({
        total_sent: sentCount,
        total_failed: failedCount,
        status: failedCount > 0 && sentCount === 0 ? 'Draft' : statusEnum
      })
      .eq('id', campaign.id)
  }

  return {
    success: isScheduled || sentCount > 0,
    message: isScheduled
      ? 'Email campaign scheduled successfully!'
      : (sentCount > 0
        ? `Email campaign dispatched successfully (${sentCount} sent, ${failedCount} failed)`
        : `Email dispatch failed: ${lastError}`),
    campaignId,
    sentCount,
    failedCount,
    totalTargeted: targets.length,
    recipientEmails: targets.map((t) => t.email),
    error: lastError || undefined
  }
}

/**
 * Send Email Campaign to SPECIFIC customer IDs or emails and record in email_campaigns & email_campaign_recipients
 */
export async function sendEmailBroadcastToCustomers(
  customerIds: string[],
  payload: EmailCampaignPayload
): Promise<EmailDispatchResult> {
  if (!customerIds || customerIds.length === 0) {
    return {
      success: false,
      message: 'No target customer IDs specified for email campaign',
      sentCount: 0,
      failedCount: 0,
      totalTargeted: 0,
      recipientEmails: []
    }
  }

  const supabase = await createServerClient()
  const targetsMap = new Map<string, CustomerTarget>()

  // 1. Separate direct email strings from UUID/IDs
  const idsToLookup: string[] = []
  customerIds.forEach((id) => {
    if (id && id.includes('@')) {
      const email = id.trim().toLowerCase()
      targetsMap.set(email, { user_id: null, email: id.trim(), name: null })
    } else if (id) {
      idsToLookup.push(id.trim())
    }
  })

  // 2. Query auth.users using Service Role Key
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (idsToLookup.length > 0 && serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
      if (authData?.users) {
        authData.users.forEach((u: any) => {
          if (idsToLookup.includes(u.id) && u.email && u.email.includes('@')) {
            const email = u.email.trim().toLowerCase()
            targetsMap.set(email, {
              user_id: u.id,
              email: u.email.trim(),
              name: u.user_metadata?.full_name || u.user_metadata?.name || null
            })
          }
        })
      }
    } catch (_) { }
  }

  // 3. Query profiles table
  if (idsToLookup.length > 0) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, name, full_name')
        .in('id', idsToLookup)
        .not('email', 'is', null)

      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.email && p.email.includes('@')) {
            const email = p.email.trim().toLowerCase()
            if (!targetsMap.has(email)) {
              targetsMap.set(email, {
                user_id: p.id,
                email: p.email.trim(),
                name: p.full_name || p.name || null
              })
            }
          }
        })
      }
    } catch (_) { }
  }

  // 4. Query orders table
  if (idsToLookup.length > 0) {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('user_id, customer_email, customer_name')
        .in('user_id', idsToLookup)
        .not('customer_email', 'is', null)

      if (orders) {
        orders.forEach((o: any) => {
          if (o.customer_email && o.customer_email.includes('@')) {
            const email = o.customer_email.trim().toLowerCase()
            if (!targetsMap.has(email)) {
              targetsMap.set(email, {
                user_id: o.user_id || null,
                email: o.customer_email.trim(),
                name: o.customer_name || null
              })
            }
          }
        })
      }
    } catch (_) { }
  }

  const targets = Array.from(targetsMap.values())

  let createdBy: string | null = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) createdBy = user.id
  } catch (_) { }

  const isScheduled = !!payload.scheduled_at && new Date(payload.scheduled_at).getTime() > Date.now()
  const audienceEnum = 'Selected Users'
  const statusEnum = isScheduled ? 'Scheduled' : 'Sent'
  const sentAt = isScheduled ? null : new Date().toISOString()
  const htmlBody = payload.html_content || buildHtmlEmailTemplate(payload.subject, payload.content || '', payload.banner_url, payload.redirectUrl)

  // Insert parent campaign row into email_campaigns table
  const campaignPayload = {
    subject: payload.subject.trim(),
    banner_url: payload.banner_url || null,
    html_content: htmlBody,
    audience: audienceEnum,
    status: statusEnum,
    sent_at: sentAt,
    total_recipients: targets.length || customerIds.length,
    total_sent: 0,
    total_failed: 0,
    total_opened: 0,
    total_clicked: 0,
    created_by: createdBy,
    redirectUrl: payload.redirectUrl || null,
    updated_at: new Date().toISOString()
  }

  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .insert(campaignPayload)
    .select()
    .single()

  if (campaignError) {
    console.error('[Email Campaign] Could not insert into email_campaigns table:', campaignError)
  }

  const campaignId = campaign?.id || Date.now()

  if (targets.length === 0) {
    return {
      success: false,
      message: `Could not resolve email addresses for the selected ${customerIds.length} target customer(s)`,
      campaignId,
      sentCount: 0,
      failedCount: customerIds.length,
      totalTargeted: customerIds.length,
      recipientEmails: []
    }
  }

  let sentCount = 0
  let failedCount = 0
  let lastError = ''
  const recipientRows: any[] = []

  if (!isScheduled) {
    for (const target of targets) {
      let deliveryStatus = 'Sent'
      let errorMessage: string | null = null

      try {
        const mailOptions = {
          from: `"${defaultSenderName}" <${defaultSenderEmail}>`,
          to: target.email,
          subject: payload.subject,
          text: payload.content || payload.subject,
          html: htmlBody
        }

        const info = await transporter.sendMail(mailOptions)
        sentCount++
        console.log(`[Nodemailer] Targeted broadcast email sent to ${target.email}. MessageId:`, info.messageId)
      } catch (err: any) {
        failedCount++
        deliveryStatus = 'Failed'
        errorMessage = err.message
        lastError = err.message
        console.error(`[Nodemailer ERROR] Failed to send targeted email to ${target.email}:`, err.message)
      }

      recipientRows.push({
        campaign_id: campaignId,
        user_id: target.user_id || null,
        email: target.email,
        name: target.name || null,
        delivery_status: deliveryStatus,
        sent_at: sentAt,
        opened_at: null,
        error_message: errorMessage
      })
    }
  } else {
    targets.forEach((target) => {
      recipientRows.push({
        campaign_id: campaignId,
        user_id: target.user_id || null,
        email: target.email,
        name: target.name || null,
        delivery_status: 'Pending',
        sent_at: null,
        opened_at: null,
        error_message: null
      })
    })
  }

  if (recipientRows.length > 0 && campaign?.id) {
    const { error: recipientInsertError } = await supabase
      .from('email_campaign_recipients')
      .insert(recipientRows)

    if (recipientInsertError) {
      console.warn('[Email Campaign] Could not insert email_campaign_recipients:', recipientInsertError.message)
    }

    await supabase
      .from('email_campaigns')
      .update({
        total_sent: sentCount,
        total_failed: failedCount,
        status: failedCount > 0 && sentCount === 0 ? 'Draft' : statusEnum
      })
      .eq('id', campaign.id)
  }

  return {
    success: sentCount > 0,
    message: sentCount > 0
      ? `Targeted email campaign sent successfully to ${sentCount} customer email(s)`
      : `Failed to send targeted email campaign: ${lastError}`,
    campaignId,
    sentCount,
    failedCount,
    totalTargeted: targets.length,
    recipientEmails: targets.map((t) => t.email),
    error: lastError || undefined
  }
}

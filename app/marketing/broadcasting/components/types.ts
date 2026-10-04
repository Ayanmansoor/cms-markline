export interface EmailCampaignItem {
  id: number
  created_at: string
  updated_at: string
  subject: string
  banner_url: string | null
  html_content: string
  audience: "All Users" | "Selected Users" | "Newsletter" | "ALL"
  status: "Draft" | "Scheduled" | "Sending" | "Sent" | "Cancelled" | "DRAFT" | "SCHEDULED" | "SENT" | "FAILED"
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_failed: number
  total_opened: number
  total_clicked: number
  created_by: string | null
}

export interface EmailCampaignRecipientItem {
  id: number
  created_at: string
  campaign_id: number
  user_id: string | null
  email: string
  name: string | null
  delivery_status:
    | "Pending"
    | "Sent"
    | "Delivered"
    | "Opened"
    | "Clicked"
    | "Failed"
    | "Bounced"
    | "Unsubscribed"
    | "PENDING"
    | "SENT"
    | "DELIVERED"
    | "FAILED"
  sent_at: string | null
  opened_at: string | null
  error_message: string | null
}

export interface CreateBroadcastFormValues {
  subject: string
  content: string
  banner_url: string
  audience: "ALL" | "SPECIFIC"
  redirectUrl?: string
}

export interface BroadcastMetrics {
  totalCampaigns: number
  emailReach: number
  totalFailed: number
  totalOpened: number
  totalCustomers: number
}

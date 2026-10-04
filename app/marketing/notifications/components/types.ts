export interface NotificationItem {
  id: number
  created_at: string
  updated_at: string
  title: string
  message: string
  banner_url: string | null
  action_url: string | null
  notification_type: "PROMOTIONAL" | "SYSTEM" | "ORDER_UPDATE" | "ANNOUNCEMENT" | "PUSH"
  audience: "ALL" | "SPECIFIC"
  status: "DRAFT" | "SCHEDULED" | "SENT" | "CANCELLED"
  scheduled_at: string | null
  sent_at: string | null
  total_recipients: number
  total_sent: number
  total_read: number
  created_by: string | null
}

export interface NotificationRecipientItem {
  id: number
  created_at: string
  notification_id: number
  user_id: string
  delivery_status: "PENDING" | "SENT" | "DELIVERED" | "FAILED"
  sent_at: string | null
  is_read: boolean
  read_at: string | null
  is_clicked: boolean
  clicked_at: string | null
}

export interface CreateNotificationFormValues {
  title: string
  message: string
  banner_url: string
  action_url: string
  notification_type: "PROMOTIONAL" | "SYSTEM" | "ORDER_UPDATE" | "ANNOUNCEMENT" | "PUSH"
  audience: "ALL" | "SPECIFIC"
}

export interface NotificationMetrics {
  totalCount: number
  totalReach: number
  totalSent: number
  totalRead: number
  deliveryRate: string
  readRate: string
}

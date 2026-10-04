import { transporter, defaultSenderEmail } from '@/lib/nodemailer'
import { generateOrderCancelledEmailHtml } from '@/lib/email-templates/order-cancelled-template'
import { generateRefundProcessedEmailHtml } from '@/lib/email-templates/refund-processed-template'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

async function getSupabaseClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return await createServerClient()
}

export interface SendOrderCancelledParams {
  orderId: string
  cancelReason?: string
}

export interface SendRefundProcessedParams {
  orderId: string
  refundId?: string
}

/**
 * Resolves customer email and details for an order
 */
async function resolveCustomerOrderInfo(orderId: string) {
  const supabase = await getSupabaseClient()

  // Fetch order with shipping address
  const { data: order } = await supabase
    .from('orders')
    .select('*, address(*)')
    .eq('id', orderId)
    .single()

  if (!order) return null

  let customerEmail = order.customer_email || null
  let customerName = order.address?.recipientName || 'Customer'

  // If email is missing, try fetching from Supabase auth users
  if (!customerEmail && order.user_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id)
      if (userData?.user) {
        customerEmail = userData.user.email || null
        customerName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || customerName
      }
    } catch (err) {
      console.warn('[Email Notifications] Error fetching auth user:', err)
    }
  }

  return {
    order,
    customerEmail,
    customerName,
    displayId: `#ORD-${order.id.slice(0, 8).toUpperCase()}`,
    grandTotal: order.grand_total || 0,
    paymentMethod: order.payment_method || 'Online Payment',
    orderMode: (order.order_mode || '').toUpperCase() || (
      (order.payment_method?.toLowerCase() === 'cod' || order.payment_method?.toLowerCase() === 'cash') ? 'CASH' : 'ONLINE'
    )
  }
}

/**
 * Background email helper: Sends Order Cancelled Email to Customer
 */
export async function sendOrderCancelledEmail(params: SendOrderCancelledParams) {
  try {
    const info = await resolveCustomerOrderInfo(params.orderId)
    if (!info || !info.customerEmail) {
      console.warn(`[Order Cancelled Email]: No customer email found for order ${params.orderId}. Skipping email.`)
      return
    }

    const isOnline = info.orderMode === 'ONLINE' || Boolean(
      (info.order.razorpay_payment_id && info.order.razorpay_payment_id !== 'N/A') ||
      (info.order.razorpay_order_id && info.order.razorpay_order_id !== 'N/A')
    )

    const htmlContent = generateOrderCancelledEmailHtml({
      orderId: info.order.id,
      displayId: info.displayId,
      customerName: info.customerName,
      cancelReason: params.cancelReason || info.order.cancel_reason || 'Cancelled by admin / customer request',
      grandTotal: info.grandTotal,
      paymentMethod: info.paymentMethod,
      isOnlinePayment: isOnline
    })

    console.log(`[Order Cancelled Email]: Sending background email to ${info.customerEmail} for order ${info.displayId}`)

    await transporter.sendMail({
      from: `"Markline Orders" <${defaultSenderEmail}>`,
      to: info.customerEmail,
      subject: `Order Cancellation Confirmed - ${info.displayId}`,
      html: htmlContent
    })

    console.log(`[Order Cancelled Email]: Email sent successfully to ${info.customerEmail}`)
  } catch (err: any) {
    console.error('[Order Cancelled Email Error]:', err?.message || err)
  }
}

/**
 * Background email helper: Sends Refund Processed Email to Customer
 */
export async function sendRefundProcessedEmail(params: SendRefundProcessedParams) {
  try {
    const info = await resolveCustomerOrderInfo(params.orderId)
    if (!info || !info.customerEmail) {
      console.warn(`[Refund Processed Email]: No customer email found for order ${params.orderId}. Skipping email.`)
      return
    }

    const htmlContent = generateRefundProcessedEmailHtml({
      orderId: info.order.id,
      displayId: info.displayId,
      customerName: info.customerName,
      refundAmount: info.grandTotal,
      razorpayRefundId: params.refundId,
      paymentMethod: info.paymentMethod
    })

    console.log(`[Refund Processed Email]: Sending background email to ${info.customerEmail} for order ${info.displayId}`)

    await transporter.sendMail({
      from: `"Markline Refunds" <${defaultSenderEmail}>`,
      to: info.customerEmail,
      subject: `Payment Refund Processed - ${info.displayId}`,
      html: htmlContent
    })

    console.log(`[Refund Processed Email]: Email sent successfully to ${info.customerEmail}`)
  } catch (err: any) {
    console.error('[Refund Processed Email Error]:', err?.message || err)
  }
}

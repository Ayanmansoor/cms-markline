import { NextResponse, after } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendRefundProcessedEmail } from '@/lib/email-notifications'

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = await getSupabaseClient()

    // 1. Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Order not found' }, { status: 404 })
    }

    // 2. Validate Order State for Refund
    if (order.fulfillment_status !== 'Cancelled') {
      return NextResponse.json({ error: 'Only cancelled orders are eligible for refund.' }, { status: 400 })
    }

    const hasPaymentId = Boolean(
      (order.razorpay_payment_id && order.razorpay_payment_id !== 'N/A') ||
      (order.razorpay_order_id && order.razorpay_order_id !== 'N/A')
    )

    if (!hasPaymentId && order.payment_status !== 'PAID') {
      return NextResponse.json({ error: 'No Razorpay payment ID exists and payment status is not PAID. Online gateway refund is not available.' }, { status: 400 })
    }

    // Idempotency Checks
    if (order.refund_status === 'REFUNDED') {
      return NextResponse.json({ error: 'Refund has already been processed for this order.' }, { status: 400 })
    }

    if (order.refund_status === 'PROCESSING') {
      return NextResponse.json({ error: 'Refund is currently processing. Please wait for confirmation.' }, { status: 400 })
    }

    // 3. Mark state as PROCESSING and ensure payment_status = PAID
    const now = new Date().toISOString()
    await supabase
      .from('orders')
      .update({
        payment_status: 'PAID',
        refund_status: 'PROCESSING',
        updated_at: now
      })
      .eq('id', orderId)

    // 4. Resolve Razorpay Payment ID
    let paymentId = order.razorpay_payment_id
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      // Mark as failed if keys are missing
      await supabase.from('orders').update({ refund_status: 'FAILED', updated_at: now }).eq('id', orderId)
      return NextResponse.json({ error: 'Razorpay keys are not configured on server.' }, { status: 500 })
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    // If paymentId is missing, fallback to querying Razorpay Order ID for payment ID
    if ((!paymentId || paymentId === 'N/A') && order.razorpay_order_id && order.razorpay_order_id !== 'N/A') {
      try {
        const orderPaymentsRes = await fetch(`https://api.razorpay.com/v1/orders/${order.razorpay_order_id}/payments`, {
          headers: { 'Authorization': authHeader }
        })
        if (orderPaymentsRes.ok) {
          const orderPaymentsData = await orderPaymentsRes.json()
          if (orderPaymentsData.items && orderPaymentsData.items.length > 0) {
            paymentId = orderPaymentsData.items[0].id
          }
        }
      } catch (e) {
        console.error('Error fetching order payments from Razorpay:', e)
      }
    }

    if (!paymentId || paymentId === 'N/A') {
      await supabase.from('orders').update({ refund_status: 'FAILED', updated_at: now }).eq('id', orderId)
      return NextResponse.json({ error: 'No Razorpay payment ID associated with this order. Unable to issue refund.' }, { status: 400 })
    }

    // 5. Execute Razorpay Refund API Call
    const amountInPaise = Math.round(parseFloat(order.grand_total || '0') * 100)

    const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInPaise,
        notes: {
          order_id: orderId,
          reason: order.cancel_reason || 'Pre-handover order cancellation refund'
        }
      })
    })

    const refundData = await refundRes.json()

    if (!refundRes.ok) {
      console.error('Razorpay refund API error:', refundData)
      // Set refund_status = FAILED on error (order remains CANCELLED and payment_status remains PAID)
      await supabase.from('orders').update({ refund_status: 'FAILED', updated_at: new Date().toISOString() }).eq('id', orderId)
      return NextResponse.json({
        error: refundData.error?.description || 'Razorpay refund request failed.'
      }, { status: 400 })
    }

    // 6. Set refund_status = REFUNDED on Razorpay confirmation
    const { data: updatedOrder } = await supabase
      .from('orders')
      .update({
        refund_status: 'REFUNDED',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select('*')
      .single()

    // Schedule background refund confirmation email notification using Next.js after()
    after(async () => {
      await sendRefundProcessedEmail({
        orderId,
        refundId: refundData.id
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Razorpay refund confirmed successfully.',
      razorpayRefundId: refundData.id,
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('Order refund exception:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

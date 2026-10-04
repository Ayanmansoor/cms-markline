import { NextResponse, after } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getShiprocketToken } from '@/lib/shiprocket'
import { sendOrderCancelledEmail } from '@/lib/email-notifications'

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json().catch(() => ({}))
    const cancelReason = body.cancelReason || 'Customer / Admin Cancelled'

    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Order not found' }, { status: 404 })
    }

    // Idempotency: If order is already cancelled, return existing state
    if (order.fulfillment_status === 'Cancelled') {
      return NextResponse.json({
        success: true,
        message: 'Order is already cancelled.',
        order
      })
    }

    // 2. Fetch associated forward shipment
    const { data: shipments } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .eq('shipment_type', 'Forward')
      .order('created_at', { ascending: false })

    const shipment = shipments && shipments.length > 0 ? shipments[0] : null

    // 3. SERVER-SIDE HANDOVER VERIFICATION
    if (shipment) {
      const isPickedUp = Boolean(
        shipment.picked_up_at ||
        shipment.pickup_status === 'Picked Up' ||
        shipment.shipment_status === 'Picked Up' ||
        shipment.shipment_status === 'In Transit' ||
        shipment.shipment_status === 'Out For Delivery' ||
        shipment.shipment_status === 'Delivered'
      )

      if (isPickedUp) {
        return NextResponse.json({
          error: 'Shipment has already been handed over to the courier. This order cannot be cancelled through the pre-handover cancellation flow.'
        }, { status: 400 })
      }
    }

    // 4. SHIPROCKET CANCELLATION PROCESS
    let shiprocketCancelled = false
    let shiprocketErrorMessage = ''

    if (shipment && (shipment.shiprocket_order_id || shipment.awb_code)) {
      try {
        const token = await getShiprocketToken()

        // 4a. Cancel Shiprocket Order if order_id is present
        if (shipment.shiprocket_order_id) {
          const cancelOrderRes = await fetch(`${process.env.SHIPROCKET_API_URL}/orders/cancel`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ids: [parseInt(shipment.shiprocket_order_id) || shipment.shiprocket_order_id] })
          })

          const cancelOrderData = await cancelOrderRes.json()
          if (!cancelOrderRes.ok) {
            shiprocketErrorMessage = cancelOrderData.message || cancelOrderData.error || 'Failed to cancel Shiprocket order'
          } else {
            shiprocketCancelled = true
          }
        }

        // 4b. Cancel Shiprocket AWB / Shipment if awb_code is present
        if (shipment.awb_code) {
          const cancelAwbRes = await fetch(`${process.env.SHIPROCKET_API_URL}/orders/cancel/shipment/awbs`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ awbs: [shipment.awb_code] })
          })

          const cancelAwbData = await cancelAwbRes.json()
          if (cancelAwbRes.ok) {
            shiprocketCancelled = true
          }
        }
      } catch (srErr: any) {
        console.error('Shiprocket cancellation API error:', srErr)
        shiprocketErrorMessage = srErr.message || 'Shiprocket connection failed'
      }

      // If Shiprocket cancellation failed, stop and return error (Do not mark order as cancelled)
      if (!shiprocketCancelled && shiprocketErrorMessage) {
        return NextResponse.json({
          error: `Unable to cancel the Shiprocket shipment: ${shiprocketErrorMessage}. The Markline order has not been cancelled.`
        }, { status: 400 })
      }
    }

    const now = new Date().toISOString()

    // 5. Update Markline shipment state (if shipment exists)
    if (shipment) {
      await supabase
        .from('shipments')
        .update({
          shipment_status: 'Cancelled',
          pickup_status: 'Cancelled',
          cancelled_at: now,
          updated_at: now
        })
        .eq('id', shipment.id)
    }

    // 6. Update Markline order state according to business rules:
    // - fulfillment_status: CANCELLED
    // - payment_status: PAID (if online payment ID or online order)
    // - return_status: None
    // - refund_status: PENDING (if online payment present)
    const hasOnlinePayment = Boolean(
      (order.razorpay_payment_id && order.razorpay_payment_id !== 'N/A') ||
      (order.razorpay_order_id && order.razorpay_order_id !== 'N/A') ||
      order.payment_status === 'PAID' ||
      (order.order_mode || '').toUpperCase() === 'ONLINE'
    )

    const updatePayload: any = {
      fulfillment_status: 'Cancelled',
      return_status: 'None',
      cancel_reason: cancelReason,
      updated_at: now
    }

    if (hasOnlinePayment) {
      updatePayload.payment_status = 'PAID'
      updatePayload.refund_status = order.refund_status || 'PENDING'
    } else {
      updatePayload.refund_status = 'NONE'
    }

    const { data: updatedOrder, error: updateOrderError } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*')
      .single()

    if (updateOrderError) {
      return NextResponse.json({ error: updateOrderError.message }, { status: 400 })
    }

    // Schedule background email notification using Next.js after()
    after(async () => {
      await sendOrderCancelledEmail({
        orderId,
        cancelReason
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Order and shipment successfully cancelled. Refund status set to PENDING.',
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('Order cancellation error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

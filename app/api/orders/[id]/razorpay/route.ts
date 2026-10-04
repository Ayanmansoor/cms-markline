import { NextResponse } from 'next/server'
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()

    // 1. Fetch order to get razorpay_payment_id and razorpay_order_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('razorpay_payment_id, razorpay_order_id')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Order not found' }, { status: 404 })
    }

    const paymentId = order.razorpay_payment_id
    const orderId = order.razorpay_order_id

    if ((!paymentId || paymentId === 'N/A') && (!orderId || orderId === 'N/A')) {
      return NextResponse.json({ payment: null, message: 'No Razorpay transaction associated with this order.' }, { status: 200 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: 'Razorpay keys not configured on server.' }, { status: 500 })
    }

    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    // 2a. If direct payment ID is available, fetch payment by ID
    if (paymentId && paymentId !== 'N/A') {
      const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to fetch payment from Razorpay')
      }

      return NextResponse.json({ payment: data })
    }

    // 2b. Fallback: If only razorpay_order_id is available, fetch payments by Razorpay Order ID
    if (orderId && orderId !== 'N/A') {
      const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}/payments`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to fetch payments for order from Razorpay')
      }

      const payment = data.items && data.items.length > 0 ? data.items[0] : null
      return NextResponse.json({ payment, items: data.items })
    }

    return NextResponse.json({ payment: null }, { status: 200 })

  } catch (error: any) {
    console.error('Error fetching Razorpay payment:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}


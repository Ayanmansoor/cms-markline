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

    // 1. Fetch order with address relation
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, address(*)')
      .eq('id', id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: orderError?.message || 'Order not found' }, { status: 404 })
    }

    // 2. Fetch warehouse for pickup address
    let warehouseData: any = null
    if (order.warehouse_id) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('id, name, address_line_1, address_line_2, city, state, pincode, phone, contact_person')
        .eq('id', order.warehouse_id)
        .single()
      warehouseData = wh
    }
    if (!warehouseData) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('id, name, address_line_1, address_line_2, city, state, pincode, phone, contact_person')
        .eq('is_default', true)
        .single()
      warehouseData = wh
    }

    // 3. Fetch order items with product details
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*, product(id, name, slug, product_variants(id, image_url))')
      .eq('order_id', id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
    }

    // 3. Resolve product images from variants
    const mappedProducts = (orderItems || []).map((item: any) => {
      let imageUrl = item.product?.image_url || null

      // Try to get image from variant if variant_id is set
      if (item.variant_id && item.product?.product_variants) {
        const variant = item.product.product_variants.find((v: any) => v.id === item.variant_id)
        if (variant?.image_url) {
          try {
            const parsed = JSON.parse(variant.image_url[0])
            imageUrl = parsed.image_url || imageUrl
          } catch {
            imageUrl = typeof variant.image_url[0] === 'string' ? variant.image_url[0] : imageUrl
          }
        }
      }

      return {
        id: item.id,
        product_id: item.product_id,
        name: item.product?.name || 'Markline Premium Product',
        slug: item.product?.slug || null,
        imageUrl,
        color: item.color || null,
        size: item.size || null,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.unit_price || '0'),
        discountAmount: parseFloat(item.discount_amount || '0'),
        finalPrice: parseFloat(item.final_price || '0'),
        sku: `MKL-PROD-${item.product_id}-${item.variant_id || 'VAR'}`
      }
    })

    // 4. Fetch user from auth.users using service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let customerEmail = 'guest@shopmarkline.com'
    let customerName = order.address?.recipientName || 'Guest Customer'

    if (serviceRoleKey && order.user_id) {
      try {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
        if (userData?.user) {
          customerEmail = userData.user.email || 'N/A'
          customerName = userData.user.user_metadata?.full_name || userData.user.user_metadata?.name || 'Customer'
        }
      } catch (err) {
        console.error('Error fetching user auth data:', err)
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        displayId: `#ORD-${order.id.slice(0, 8).toUpperCase()}`,
        created_at: order.created_at,
        updated_at: order.updated_at,
        customerName,
        customerEmail,
        userId: order.user_id,
        paymentStatus: order.payment_status || 'PENDING',
        fulfillmentStatus: order.fulfillment_status || 'Pending',
        returnStatus: order.return_status || 'None',
        razorpayPaymentId: order.razorpay_payment_id || 'N/A',
        razorpayOrderId: order.razorpay_order_id || 'N/A',
        paymentMethod: order.payment_method || null,
        tracking_number: null,
        warehouseId: order.warehouse_id || null,
        customerNote: order.customer_note || null,
        adminNote: order.admin_note || null,
        cancelReason: order.cancel_reason || null,
        couponCode: order.coupon_code || null,
        discountId: order.discount_id || null,

        // Products Purchased - now an array from order_items
        products: mappedProducts,

        // Shipping details
        shippingAddress: order.address ? {
          recipientName: order.address.recipientName || customerName,
          recipientPhone: order.address.recipientPhone || 'N/A',
          fullAddress: order.address.full_address || '',
          city: order.address.city || '',
          state: order.address.state_name || '',
          pinCode: order.address.pin_code || '',
          landmark: order.address.landmark || ''
        } : null,

        // Financials from orders table directly
        financials: {
          subtotal: parseFloat(order.subtotal || '0'),
          shipping: parseFloat(order.shipping_charge || '0'),
          tax: parseFloat(order.tax_amount || '0'),
          discount: parseFloat(order.discount_amount || '0'),
          total: parseFloat(order.grand_total || '0')
        },

        // Warehouse / pickup location
        warehouse: warehouseData ? {
          id: warehouseData.id,
          name: warehouseData.name,
          addressLine1: warehouseData.address_line_1,
          addressLine2: warehouseData.address_line_2 || null,
          city: warehouseData.city,
          state: warehouseData.state,
          pincode: warehouseData.pincode,
          phone: warehouseData.phone || null,
          contactPerson: warehouseData.contact_person || null
        } : null
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json()

    // Allow updating payment status, fulfillment status, return status, warehouse, admin note, cancel reason
    const { paymentStatus, fulfillmentStatus, returnStatus, warehouseId, adminNote, cancelReason } = body

    const updatePayload: any = {}
    if (paymentStatus) {
      updatePayload.payment_status = paymentStatus.toUpperCase()
    }
    if (fulfillmentStatus) {
      updatePayload.fulfillment_status = fulfillmentStatus
    }
    if (returnStatus) {
      updatePayload.return_status = returnStatus
    }
    if (warehouseId !== undefined) {
      updatePayload.warehouse_id = warehouseId !== null ? parseInt(warehouseId) : null
    }
    if (adminNote !== undefined) {
      updatePayload.admin_note = adminNote
    }
    if (cancelReason !== undefined) {
      updatePayload.cancel_reason = cancelReason
    }
    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, order: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

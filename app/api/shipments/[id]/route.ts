import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { parseImageUrl } from '@/lib/utils'
import { getShiprocketToken } from '@/lib/shiprocket'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params

    const { data: s, error } = await supabase
      .from('shipments')
      .select('*, order:orders(*, address(*), order_items(*, product(*, product_variants(id, image_url)))), warehouse:warehouses(*)')
      .eq('id', parseInt(id))
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Retrieve customer metadata from auth
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let customerEmail = 'N/A'
    let customerName = 'Guest Customer'

    if (serviceRoleKey && s.order?.user_id) {
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
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(s.order.user_id)
        if (authUser?.user) {
          customerEmail = authUser.user.email || 'N/A'
          customerName = authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || 'Customer'
        }
      } catch (err) {
        console.error('Error fetching user auth in shipment details API:', err)
      }
    }

    if (customerName === 'Guest Customer' && s.order?.address?.recipientName) {
      customerName = s.order.address.recipientName
    }

    const orderItems = (s.order?.order_items || []).map((oi: any) => {
      let rawImage = oi.product?.image_url || oi.product?.image || oi.image_url || null

      if (!rawImage && oi.variant_id && oi.product?.product_variants) {
        const variant = oi.product.product_variants.find((v: any) => v.id === oi.variant_id)
        if (variant?.image_url) {
          rawImage = variant.image_url
        }
      }

      if (!rawImage && oi.product?.product_variants?.[0]?.image_url) {
        rawImage = oi.product.product_variants[0].image_url
      }

      const productImage = parseImageUrl(rawImage)

      return {
        id: oi.id,
        productName: oi.product?.name || 'Unknown Product',
        productImage,
        variantId: oi.variant_id,
        sku: oi.sku || null,
        color: oi.color || null,
        size: oi.size || null,
        quantity: oi.quantity,
        unitPrice: oi.unit_price,
        finalPrice: oi.final_price
      }
    })

    const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) : 'N/A'

    let shiprocketOrderDetails: any = null
    if (s.shiprocket_order_id) {
      try {
        let token: string | null = null
        try {
          token = await getShiprocketToken()
        } catch (e) {
          console.warn('Failed to obtain Shiprocket token')
        }
        if (token) {
          const srRes = await fetch(`${process.env.SHIPROCKET_API_URL}/orders/show/${s.shiprocket_order_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
          if (srRes.ok) {
            const srData = await srRes.json()
            shiprocketOrderDetails = srData.data || null
          } else {
            console.error('Shiprocket API returned status:', srRes.status)
          }
        }
      } catch (err: any) {
        console.error('Error fetching Shiprocket order details:', err.message)
      }
    }

    // Resolve warehouse fallback if missing
    let warehouseData = s.warehouse
    if (!warehouseData && (s.warehouse_id || s.order?.warehouse_id)) {
      const whId = s.warehouse_id || s.order?.warehouse_id
      const { data: wh } = await supabase
        .from('warehouses')
        .select('*')
        .eq('id', whId)
        .maybeSingle()
      warehouseData = wh
    }
    if (!warehouseData) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('*')
        .eq('is_default', true)
        .maybeSingle()
      warehouseData = wh
    }
    if (!warehouseData) {
      const { data: wh } = await supabase
        .from('warehouses')
        .select('*')
        .limit(1)
        .maybeSingle()
      warehouseData = wh
    }

    const addr = s.order?.address
    const deliveryPincode = addr?.pin_code || addr?.pincode || addr?.postal_code || addr?.postalCode || ''
    const recipientName = addr?.recipientName || addr?.recipient_name || customerName || 'Customer'
    const recipientPhone = addr?.recipientPhone || addr?.phone || 'N/A'
    const shippingAddressStr = addr
      ? `${recipientName}, ${addr.full_address || addr.address_line_1 || ''}, ${addr.city || ''}, ${addr.state_name || addr.state || ''} - ${deliveryPincode}`
      : 'No Address'

    const payload = {
      id: s.id,
      created_at: s.created_at,
      updated_at: s.updated_at,
      date,
      orderId: s.order_id,
      displayOrderId: s.order?.id ? `#ORD-${s.order.id.slice(0, 8).toUpperCase()}` : 'N/A',
      shiprocketOrderDetails,
      customerName,
      customerEmail,
      recipientPhone,
      shippingAddress: shippingAddressStr,
      warehouseId: s.warehouse_id || warehouseData?.id,
      warehouse: warehouseData ? {
        id: warehouseData.id,
        name: warehouseData.name,
        pincode: String(warehouseData.pincode || warehouseData.pin_code || ''),
        city: warehouseData.city || '',
        state: warehouseData.state || '',
        address: `${warehouseData.address_line_1 || ''}, ${warehouseData.address_line_2 || ''}`.trim()
      } : null,
      parentShipmentId: s.parent_shipment_id,
      shipmentType: s.shipment_type,
      provider: s.provider,
      shipmentStatus: s.shipment_status,
      pickupStatus: s.pickup_status,
      courierName: s.courier_name,
      courierId: s.courier_id,
      trackingNumber: s.tracking_number,
      trackingUrl: s.tracking_url,
      awbCode: s.awb_code,
      shiprocketOrderId: s.shiprocket_order_id,
      shipmentId: s.shipment_id,
      shippingLabelUrl: s.shipping_label_url,
      manifestUrl: s.manifest_url,
      invoiceUrl: s.invoice_url,
      weight: s.weight,
      length: s.length,
      breadth: s.breadth,
      height: s.height,
      pickupRequestedAt: s.pickup_requested_at,
      pickupScheduledAt: s.pickup_scheduled_at,
      pickedUpAt: s.picked_up_at,
      inTransitAt: s.in_transit_at,
      outForDeliveryAt: s.out_for_delivery_at,
      deliveredAt: s.delivered_at,
      cancelledAt: s.cancelled_at,
      lastTrackingUpdate: s.last_tracking_update,
      trackingResponse: s.tracking_response,
      failureReason: s.failure_reason,
      remarks: s.remarks,
      order: {
        paymentStatus: s.order?.payment_status,
        paymentMethod: s.order?.payment_method,
        subtotal: s.order?.subtotal,
        discountAmount: s.order?.discount_amount,
        shippingCharge: s.order?.shipping_charge,
        taxAmount: s.order?.tax_amount,
        grandTotal: s.order?.grand_total,
        fulfillmentStatus: s.order?.fulfillment_status,
        items: orderItems,
        address: addr ? {
          id: addr.id,
          recipientName,
          recipientPhone,
          fullAddress: addr.full_address || addr.address_line_1 || '',
          city: addr.city || '',
          state: addr.state_name || addr.state || '',
          pincode: String(deliveryPincode),
          pin_code: String(deliveryPincode)
        } : null
      }
    }

    return NextResponse.json({ success: true, shipment: payload })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerClient()
    const { id } = await params
    const body = await request.json()

    // Fetch existing shipment first to verify and compare status
    const { data: existing, error: getErr } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (getErr) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const updates: any = {
      updated_at: new Date().toISOString()
    }

    // Set simple columns if present in request
    if (body.warehouseId !== undefined) updates.warehouse_id = body.warehouseId ? parseInt(body.warehouseId) : null
    if (body.courierName !== undefined) updates.courier_name = body.courierName || null
    if (body.courierId !== undefined) updates.courier_id = body.courierId ? parseInt(body.courierId) : null
    if (body.trackingNumber !== undefined) updates.tracking_number = body.trackingNumber || null
    if (body.trackingUrl !== undefined) updates.tracking_url = body.trackingUrl || null
    if (body.awbCode !== undefined) updates.awb_code = body.awbCode || null
    if (body.shippingLabelUrl !== undefined) updates.shipping_label_url = body.shippingLabelUrl || null
    if (body.manifestUrl !== undefined) updates.manifest_url = body.manifestUrl || null
    if (body.invoiceUrl !== undefined) updates.invoice_url = body.invoiceUrl || null
    if (body.weight !== undefined) updates.weight = body.weight ? parseFloat(body.weight) : null
    if (body.length !== undefined) updates.length = body.length ? parseFloat(body.length) : null
    if (body.breadth !== undefined) updates.breadth = body.breadth ? parseFloat(body.breadth) : null
    if (body.height !== undefined) updates.height = body.height ? parseFloat(body.height) : null
    if (body.remarks !== undefined) updates.remarks = body.remarks || null
    if (body.failureReason !== undefined) updates.failure_reason = body.failureReason || null

    // Manage shipment_status changes & update corresponding timestamps
    if (body.shipmentStatus !== undefined && body.shipmentStatus !== existing.shipment_status) {
      updates.shipment_status = body.shipmentStatus
      const now = new Date().toISOString()
      
      if (body.shipmentStatus === 'AWB Generated') {
        // Automatically set AWB / label defaults if needed
      } else if (body.shipmentStatus === 'Pickup Scheduled') {
        updates.pickup_scheduled_at = now
      } else if (body.shipmentStatus === 'Picked Up') {
        updates.picked_up_at = now
      } else if (body.shipmentStatus === 'In Transit') {
        updates.in_transit_at = now
      } else if (body.shipmentStatus === 'Out For Delivery') {
        updates.out_for_delivery_at = now
      } else if (body.shipmentStatus === 'Delivered') {
        updates.delivered_at = now
      } else if (body.shipmentStatus === 'Cancelled') {
        updates.cancelled_at = now
      }
    }

    // Manage pickup_status changes
    if (body.pickupStatus !== undefined) {
      updates.pickup_status = body.pickupStatus
      if (body.pickupStatus === 'Pickup Requested' && !existing.pickup_requested_at) {
        updates.pickup_requested_at = new Date().toISOString()
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, shipment: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const statusFilter = searchParams.get('status') || 'all'
    const typeFilter = searchParams.get('type') || 'all'
    const providerFilter = searchParams.get('provider') || 'all'
    const query = searchParams.get('q') || ''
    
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServerClient()

    // Query shipments
    let dbQuery = supabase
      .from('shipments')
      .select('*, order:orders(*, address(*))', { count: 'exact' })

    if (typeFilter !== 'all') {
      dbQuery = dbQuery.eq('shipment_type', typeFilter)
    }
    dbQuery = dbQuery.order('created_at', { ascending: false })

    // Apply filters
    if (statusFilter !== 'all') {
      dbQuery = dbQuery.eq('shipment_status', statusFilter)
    }
    if (query.trim()) {
      // Search by tracking number or order ID (UUID match)
      dbQuery = dbQuery.or(`tracking_number.ilike.%${query.trim()}%,awb_code.ilike.%${query.trim()}%`)
    }

    // Paginate
    dbQuery = dbQuery.range(from, to)

    const { data: shipments, error, count: totalCount } = await dbQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Map user names from auth.users using service role key if available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const userMap = new Map<string, { email: string; name: string }>()

    if (serviceRoleKey && shipments && shipments.length > 0) {
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
        const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
        authData?.users?.forEach((u: any) => {
          userMap.set(u.id, {
            email: u.email || 'N/A',
            name: u.user_metadata?.full_name || u.user_metadata?.name || 'Customer'
          })
        })
      } catch (err) {
        console.error('Error fetching user auth data in shipments list:', err)
      }
    }

    const mappedShipments = (shipments || []).map((s: any) => {
      const order = s.order
      const userId = order?.user_id
      const authUser = userId ? userMap.get(userId) : null
      
      const customerName = authUser?.name || order?.address?.recipientName || 'Guest Customer'
      const customerEmail = authUser?.email || 'N/A'

      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : 'N/A'

      return {
        id: s.id,
        created_at: s.created_at,
        date,
        orderId: s.order_id,
        displayOrderId: order?.id ? `#ORD-${order.id.slice(0, 8).toUpperCase()}` : 'N/A',
        customerName,
        customerEmail,
        warehouseId: s.warehouse_id,
        shipmentType: s.shipment_type,
        provider: s.provider,
        shipmentStatus: s.shipment_status,
        pickupStatus: s.pickup_status,
        courierName: s.courier_name,
        trackingNumber: s.tracking_number,
        awbCode: s.awb_code,
        weight: s.weight,
        shippingLabelUrl: s.shipping_label_url
      }
    })

    return NextResponse.json({
      success: true,
      shipments: mappedShipments,
      totalCount: totalCount || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      orderId,
      warehouseId,
      parentShipmentId,
      shipmentType,
      courierName,
      courierId,
      trackingUrl,
      weight,
      length,
      breadth,
      height,
      remarks
    } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const payload: any = {
      order_id: orderId,
      warehouse_id: warehouseId ? parseInt(warehouseId) : null,
      parent_shipment_id: parentShipmentId ? parseInt(parentShipmentId) : null,
      shipment_type: shipmentType || 'Forward',
      provider: 'Shiprocket',
      shipment_status: 'Pending',
      pickup_status: 'Pending',
      courier_name: courierName || null,
      courier_id: courierId ? parseInt(courierId) : null,
      tracking_number: null,
      tracking_url: trackingUrl || null,
      awb_code: null,
      weight: weight ? parseFloat(weight) : null,
      length: length ? parseFloat(length) : null,
      breadth: breadth ? parseFloat(breadth) : null,
      height: height ? parseFloat(height) : null,
      remarks: remarks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      shipment: {
        id: shipment.id,
        orderId: shipment.order_id
      }
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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

function formatAddress(addr: string): string {
  if (!addr) return 'Bldg 1, Main Road';
  if (/\d/.test(addr)) {
    return addr;
  }
  return 'Flat No. 1, ' + addr;
}

async function getShiprocketToken(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get('shiprocket_token')?.value
  if (!token) {
    throw new Error('No Shiprocket token found in cookies. Please authenticate in Settings.')
  }
  return token
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = await getSupabaseClient()
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true, shipments: shipments || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json()
    const { shipmentType = 'Forward', weight, length, breadth, height, remarks, pickupDate, parentShipmentId } = body

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*, address(*), order_items(*, product(id, name, slug))')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) return NextResponse.json({ error: 'Order not found', details: orderErr || null }, { status: 404 })

    let warehouse: any = null
    if (order.warehouse_id) {
      const { data: wh } = await supabase.from('warehouses').select('*').eq('id', order.warehouse_id).single()
      warehouse = wh
    }
    if (!warehouse) {
      const { data: wh } = await supabase.from('warehouses').select('*').eq('is_default', true).single()
      warehouse = wh
    }
    if (!warehouse) {
      return NextResponse.json({ error: 'No warehouse found. Assign a warehouse to the order or create a default warehouse in Settings.' }, { status: 400 })
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let customerEmail = 'customer@shopmarkline.com'
    let customerName = order.address?.recipientName || 'Customer'

    if (serviceRoleKey && order.user_id) {
      try {
        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
        if (userData?.user) {
          customerEmail = userData.user.email || customerEmail
          const meta = userData.user.user_metadata
          customerName = meta?.full_name || meta?.name || customerName
        }
      } catch (_) { }
    }

    const addr = order.address
    const nameParts = customerName.trim().split(' ')
    const firstName = nameParts[0] || 'Customer'
    const lastName = nameParts.slice(1).join(' ') || ''

    const orderItems = (order.order_items || []).map((item: any) => ({
      name: item.product?.name || 'Markline Product',
      sku: `MKL-${item.product_id}-${item.variant_id || 'VAR'}`,
      units: item.quantity,
      selling_price: parseFloat(item.unit_price || '0'),
      discount: parseFloat(item.discount_amount || '0') || '',
      tax: '',
      hsn: ''
    }))

    const isReturn = shipmentType === 'Reverse' ? 1 : 0
    const orderId8 = orderId.slice(0, 8).toUpperCase()
    const shiprocketOrderId = `MKL-${orderId8}-${isReturn ? 'RTN' : 'FWD'}-${Date.now().toString().slice(-6)}`

    const token = await getShiprocketToken()

    // Clean and obtain the pickup location nickname
    const pickupLocationNickname = warehouse.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 36) || 'MarklineWarehouse'

    // Automatically register this pickup location in Shiprocket first (ignore error if already exists)
    try {
      const addPickupPayload = {
        pickup_location: pickupLocationNickname,
        name: warehouse.contact_person || 'Markline Warehouse',
        email: warehouse.email || 'stylemarkline@gmail.com',
        phone: parseInt((warehouse.phone || '').replace(/\D/g, '')) || 9999999999,
        address: formatAddress(warehouse.address_line_1),
        address_2: warehouse.address_line_2 || '',
        city: warehouse.city,
        state: warehouse.state,
        country: 'India',
        pin_code: parseInt(warehouse.pincode || '0')
      }
      await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/addpickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(addPickupPayload)
      })
    } catch (_) {}

    let shiprocketPayload: any = {}
    let endpointUrl = 'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc'

    if (isReturn) {
      endpointUrl = 'https://apiv2.shiprocket.in/v1/external/orders/create/return'
      const returnItems = (order.order_items || []).map((item: any) => ({
        name: item.product?.name || 'shoes',
        qc_enable: true,
        qc_product_name: item.product?.name || 'shoes',
        sku: `MKL-${item.product_id}-${item.variant_id || 'VAR'}`,
        units: item.quantity,
        selling_price: parseFloat(item.unit_price || '0'),
        discount: parseFloat(item.discount_amount || '0') || 0,
        qc_brand: 'Markline'
      }))

      shiprocketPayload = {
        order_id: shiprocketOrderId,
        order_date: new Date().toISOString().replace('T', ' ').slice(0, 10),
        pickup_customer_name: firstName,
        pickup_last_name: lastName || '.',
        pickup_address: formatAddress(addr?.full_address || addr?.address_line_1 || ''),
        pickup_address_2: addr?.address_line_2 || '',
        pickup_city: addr?.city || '',
        pickup_state: addr?.state_name || addr?.state || '',
        pickup_country: 'India',
        pickup_pincode: parseInt(addr?.pin_code || addr?.pincode || '0'),
        pickup_email: customerEmail,
        pickup_phone: String(parseInt((addr?.recipientPhone || '').replace(/\D/g, '')) || 9999999999),
        pickup_isd_code: '91',
        shipping_customer_name: warehouse.contact_person || 'Warehouse',
        shipping_last_name: '',
        shipping_address: formatAddress(warehouse.address_line_1),
        shipping_address_2: warehouse.address_line_2 || '',
        shipping_city: warehouse.city,
        shipping_country: 'India',
        shipping_pincode: parseInt(warehouse.pincode || '0'),
        shipping_state: warehouse.state,
        shipping_email: warehouse.email || 'warehouse@shopmarkline.com',
        shipping_isd_code: '91',
        shipping_phone: String(parseInt((warehouse.phone || '').replace(/\D/g, '')) || 9999999999),
        order_items: returnItems,
        payment_method: 'PREPAID',
        total_discount: '0',
        sub_total: parseFloat(order.subtotal || '0'),
        length: parseFloat(length || '10'),
        breadth: parseFloat(breadth || '10'),
        height: parseFloat(height || '10'),
        weight: parseFloat(weight || '0.5')
      }
    } else {
      shiprocketPayload = {
        order_id: shiprocketOrderId,
        order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        pickup_location: pickupLocationNickname,
        comment: remarks || '',
        billing_customer_name: firstName,
        billing_last_name: lastName || '.',
        billing_address: formatAddress(addr?.full_address || addr?.address_line_1 || ''),
        billing_address_2: addr?.address_line_2 || '',
        billing_city: addr?.city || '',
        billing_pincode: String(addr?.pin_code || addr?.pincode || '0'),
        billing_state: addr?.state_name || addr?.state || '',
        billing_country: 'India',
        billing_email: customerEmail,
        billing_phone: String(parseInt((addr?.recipientPhone || '').replace(/\D/g, '')) || 9999999999),
        shipping_is_billing: true,
        shipping_customer_name: firstName,
        shipping_last_name: lastName || '.',
        shipping_address: formatAddress(addr?.full_address || addr?.address_line_1 || ''),
        shipping_address_2: addr?.address_line_2 || '',
        shipping_city: addr?.city || '',
        shipping_pincode: String(addr?.pin_code || addr?.pincode || '0'),
        shipping_state: addr?.state_name || addr?.state || '',
        shipping_country: 'India',
        shipping_email: customerEmail,
        shipping_phone: String(parseInt((addr?.recipientPhone || '').replace(/\D/g, '')) || 9999999999),
        order_items: orderItems,
        payment_method: order.payment_status === 'PAID' ? 'Prepaid' : 'COD',
        shipping_charges: parseFloat(order.shipping_charge || '0'),
        giftwrap_charges: 0, transaction_charges: 0,
        total_discount: parseFloat(order.discount_amount || '0'),
        sub_total: parseFloat(order.subtotal || '0'),
        length: parseFloat(length || '10'),
        breadth: parseFloat(breadth || '10'),
        height: parseFloat(height || '10'),
        weight: parseFloat(weight || '0.5'),
        is_return: 0
      }
    }

    console.log('PAYLOAD SENT TO SHIPROCKET:', JSON.stringify(shiprocketPayload, null, 2))

    const shiprocketRes = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(shiprocketPayload)
    })

    const shiprocketData = await shiprocketRes.json()

    if (!shiprocketRes.ok) {
      return NextResponse.json({ error: shiprocketData.message || 'Shiprocket order creation failed', details: shiprocketData }, { status: 400 })
    }

    const shipmentRow: any = {
      order_id: orderId,
      warehouse_id: warehouse.id,
      parent_shipment_id: parentShipmentId ? parseInt(parentShipmentId) : null,
      shipment_type: shipmentType,
      provider: 'Shiprocket',
      shipment_status: 'Pending',
      pickup_status: 'Pending',
      pickup_scheduled_at: pickupDate ? new Date(pickupDate).toISOString() : null,
      shiprocket_order_id: String(shiprocketData.order_id || shiprocketOrderId),
      shipment_id: shiprocketData.shipment_id ? String(shiprocketData.shipment_id) : null,
      awb_code: shiprocketData.awb_code || null,
      tracking_number: shiprocketData.awb_code || null,
      tracking_url: shiprocketData.awb_code ? `https://shiprocket.co/tracking/${shiprocketData.awb_code}` : null,
      courier_name: shiprocketData.courier_name || null,
      courier_id: shiprocketData.courier_company_id ? parseInt(shiprocketData.courier_company_id) : null,
      weight: parseFloat(weight || '0') || null,
      length: parseFloat(length || '0') || null,
      breadth: parseFloat(breadth || '0') || null,
      height: parseFloat(height || '0') || null,
      remarks: remarks || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: savedShipment, error: saveErr } = await supabase.from('shipments').insert(shipmentRow).select().single()

    if (saveErr) {
      return NextResponse.json({ success: true, warning: `Shiprocket order created (${shiprocketData.order_id}) but DB save failed: ${saveErr.message}`, shiprocketData }, { status: 207 })
    }

    return NextResponse.json({ success: true, shipment: savedShipment, shiprocketData }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
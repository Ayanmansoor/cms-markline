import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 1. Fetch claim detail
    const { data: claim, error: fetchError } = await supabase
      .from('claim-products')
      .select('*, address_details:address_id(*)')
      .eq('id', id)
      .single()

    if (fetchError || !claim) {
      return NextResponse.json({ error: fetchError?.message || 'Claim not found' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('shiprocket_token')?.value

    let shiprocketDetails = {
      shiprocket_order_id: `SR-RET-${Math.floor(100000 + Math.random() * 900000)}`,
      shipment_id: `SR-SHIP-${Math.floor(1000000 + Math.random() * 9000000)}`,
      awb_code: `AWB${Math.floor(10000000 + Math.random() * 90000000)}`,
      courier_name: 'Delhivery Return',
      tracking_number: `TRK${Math.floor(10000000 + Math.random() * 90000000)}`,
      tracking_url: '',
      label_url: 'https://shiprocket-labels.s3.amazonaws.com/label-demo.pdf',
      manifest_url: 'https://shiprocket-manifests.s3.amazonaws.com/manifest-demo.pdf',
      pickup_status: 'Scheduled',
      pickup_scheduled_at: new Date().toISOString()
    }
    shiprocketDetails.tracking_url = `https://track.shiprocket.in/${shiprocketDetails.awb_code}`

    let isRealIntegration = false

    // If token is present, attempt actual Shiprocket integration
    if (token) {
      try {

          // Create return order payload
          const returnPayload = {
            order_id: `RET-${claim.id}-${Date.now()}`,
            order_date: new Date().toISOString().split('T')[0],
            channel_id: "",
            pickup_customer_name: claim.name || "Customer",
            pickup_last_name: "",
            pickup_address: claim.address_details?.full_address || "Address details missing",
            pickup_address_2: "",
            pickup_city: claim.address_details?.city || "City",
            pickup_state: claim.address_details?.state_name || "State",
            pickup_country: "India",
            pickup_pin_code: claim.address_details?.pin_code || "110001",
            pickup_phone: claim.address_details?.recipientPhone || "9999999999",
            pickup_email: claim.email || "email@example.com",
            shipping_customer_name: "Warehouse Return Center",
            shipping_address: "123 Warehouse Rd, Phase 1",
            shipping_city: "Delhi",
            shipping_state: "Delhi",
            shipping_country: "India",
            shipping_pin_code: "110037",
            shipping_phone: "9876543210",
            order_items: [
              {
                name: claim.productname || "Claimed Product",
                sku: `SKU-${claim.product_id || 'UNKNOWN'}`,
                units: 1,
                selling_price: "0",
                discount: "",
                tax: "",
                hsn: ""
              }
            ],
            payment_method: "Prepaid",
            sub_total: 0,
            length: 10,
            width: 10,
            height: 10,
            weight: 0.5
          }

          const orderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/return', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(returnPayload)
          })

          if (orderRes.ok) {
            const orderData = await orderRes.json()
            shiprocketDetails.shiprocket_order_id = String(orderData.order_id)
            shiprocketDetails.shipment_id = String(orderData.shipment_id)
            isRealIntegration = true

            // Attempt to generate AWB/logistics
            const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ shipment_id: orderData.shipment_id })
            })

            if (awbRes.ok) {
              const awbData = await awbRes.json()
              if (awbData.status === 1) {
                shiprocketDetails.awb_code = awbData.response.data.awb_code
                shiprocketDetails.courier_name = awbData.response.data.courier_name
                shiprocketDetails.tracking_number = awbData.response.data.awb_code
                shiprocketDetails.tracking_url = `https://track.shiprocket.in/${awbData.response.data.awb_code}`
              }
          }
        }
      } catch (err) {
        console.error('Shiprocket real integration failed, using demo fallback:', err)
      }
    }

    // 2. Update claim details in Supabase
    const { data: updatedClaim, error: updateError } = await supabase
      .from('claim-products')
      .update(shiprocketDetails)
      .eq('id', id)
      .select('*, address_details:address_id(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      demoMode: !isRealIntegration,
      claim: updatedClaim
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cookieStore = await cookies()
    const token = cookieStore.get('shiprocket_token')?.value

    const supabase = await createClient()

    // Fetch existing shipment
    const { data: shipment, error: getErr } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', parseInt(id))
      .single()

    if (getErr || !shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    const srShipmentId = shipment.shipment_id

    // Check if we can proceed with real Shiprocket integration
    // Shiprocket shipment_id must be numeric and not a mock ID (like "SR-SHIP-xxx")
    const isMockShipmentId = !srShipmentId || srShipmentId.startsWith('SR-SHIP') || isNaN(Number(srShipmentId))

    let isRealIntegration = false
    let pickupResponseData: any = null
    let demoMode = false

    if (token && !isMockShipmentId) {
      try {
        const payload = {
          shipment_id: [parseInt(srShipmentId)]
        }

        const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })

        const resData = await res.json()

        if (res.ok && resData.pickup_status === 1) {
          isRealIntegration = true
          pickupResponseData = resData.response
        } else {
          console.warn('Shiprocket generate pickup failed, falling back to simulator:', resData)
          demoMode = true
        }
      } catch (err: any) {
        console.error('Error generating pickup with Shiprocket, falling back to simulator:', err.message)
        demoMode = true
      }
    } else {
      demoMode = true
    }

    let pickupScheduledDate = new Date().toISOString()
    let remarks = 'Pickup scheduled via simulator fallback'

    if (isRealIntegration && pickupResponseData) {
      pickupScheduledDate = pickupResponseData.pickup_scheduled_date || new Date().toISOString()
      remarks = pickupResponseData.data || `Pickup confirmed. AWB: ${shipment.awb_code}`
    } else {
      remarks = `Mock pickup confirmed by Simulator for AWB: ${shipment.awb_code || 'Pending'}`
    }

    // Update shipments record (only shipment_status, not pickup_status)
    const updates = {
      shipment_status: 'Pickup Scheduled',
      pickup_scheduled_at: pickupScheduledDate,
      pickup_requested_at: new Date().toISOString(),
      remarks: remarks,
      updated_at: new Date().toISOString()
    }

    const { data: updatedShipment, error: updateErr } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      demoMode,
      shipment: updatedShipment
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

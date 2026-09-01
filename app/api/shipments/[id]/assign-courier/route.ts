import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { courierId, courierName } = body

    if (!courierId || !courierName) {
      return NextResponse.json({ error: 'courierId and courierName are required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const token = cookieStore.get('shiprocket_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No Shiprocket token found in cookies. Please authenticate in Settings.' },
        { status: 401 }
      )
    }

    const supabase = await createServerClient()

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

    let awbCode = null
    let trackingUrl = null
    let demoMode = false

    if (srShipmentId) {
      try {
        const assignPayload = {
          shipment_id: parseInt(srShipmentId),
          courier_id: parseInt(courierId)
        }

        const assignRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(assignPayload)
        })

        const assignData = await assignRes.json()

        console.log(assignData, 'this is assigndata')

        // Handle ShipRocket wallet / balance errors (status_code 350)
        if (assignData.awb_assign_status === 0) {
          const errMsg = assignData.response?.data?.awb_assign_error || assignData.message || 'AWB assignment failed'
          return NextResponse.json({ error: errMsg, shiprocketStatusCode: assignData.status_code }, { status: 402 })
        }

        if (assignData.response?.data?.awb_code) {
          awbCode = assignData.response.data.awb_code
          trackingUrl = `https://www.shiprocket.in/shipment-tracking/${awbCode}`
        } else {
          console.warn('Shiprocket AWB allocation failed, no awb_code in response:', assignData)
          demoMode = true
        }
      } catch (err: any) {
        console.error('Error assigning AWB with Shiprocket:', err.message)
        demoMode = true
      }
    } else {
      demoMode = true
    }

    // Update shipments record with courier and AWB details
    const updates: Record<string, any> = {
      courier_id: parseInt(courierId),
      courier_name: courierName,
      updated_at: new Date().toISOString()
    }

    if (awbCode) {
      updates.awb_code = awbCode
      updates.tracking_number = awbCode
      updates.tracking_url = trackingUrl
      updates.shipment_status = 'AWB Generated'
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
      // shipment: updatedShipment
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getShiprocketToken } from '@/lib/shiprocket'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { courierId, courierName } = body

    console.log('[DEBUG assign-courier API] Incoming Request params ID:', id, 'Body:', body)

    if (!courierId || !courierName) {
      console.warn('[DEBUG assign-courier API] Missing courierId or courierName')
      return NextResponse.json({ error: 'courierId and courierName are required' }, { status: 400 })
    }

    let token: string | null = null
    try {
      token = await getShiprocketToken()
      console.log('[DEBUG assign-courier API] Shiprocket token obtained successfully:', token ? `${token.slice(0, 15)}...` : 'NULL')
    } catch (error: any) {
      console.error('[DEBUG assign-courier API] Failed to obtain Shiprocket token:', error?.message || error)
      return NextResponse.json(
        { error: 'Failed to obtain Shiprocket token.' },
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
      console.error('[DEBUG assign-courier API] Shipment not found in DB for ID:', id, 'Error:', getErr)
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })
    }

    console.log('[DEBUG assign-courier API] Found Shipment in DB:', shipment)

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

        const endpointUrl = `${process.env.SHIPROCKET_API_URL}/courier/assign/awb`
        console.log('[DEBUG assign-courier API] Calling Shiprocket AWB assign endpoint:', endpointUrl, 'Payload:', assignPayload)

        const assignRes = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(assignPayload)
        })

        const assignData = await assignRes.json()

        console.log('[DEBUG assign-courier API] Shiprocket Response HTTP Status:', assignRes.status, 'Response Data:', JSON.stringify(assignData, null, 2))

        // Handle ShipRocket wallet / balance errors (status_code 350)
        if (assignData.awb_assign_status === 0) {
          const errMsg = assignData.response?.data?.awb_assign_error || assignData.message || 'AWB assignment failed'
          console.error('[DEBUG assign-courier API] AWB Assignment Failed (awb_assign_status=0):', errMsg, assignData)
          return NextResponse.json({ error: errMsg, shiprocketStatusCode: assignData.status_code, details: assignData }, { status: 402 })
        }

        if (assignData.response?.data?.awb_code) {
          awbCode = assignData.response.data.awb_code
          trackingUrl = `https://www.shiprocket.in/shipment-tracking/${awbCode}`
          console.log('[DEBUG assign-courier API] AWB Code successfully assigned:', awbCode, 'Tracking URL:', trackingUrl)
        } else {
          console.warn('[DEBUG assign-courier API] Shiprocket AWB allocation failed, no awb_code in response:', assignData)
          demoMode = true
        }
      } catch (err: any) {
        console.error('[DEBUG assign-courier API] Error assigning AWB with Shiprocket:', err.message, err)
        demoMode = true
      }
    } else {
      console.warn('[DEBUG assign-courier API] No srShipmentId (shipment_id) found on shipment record, falling back to demo mode.')
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

    console.log('[DEBUG assign-courier API] Updating DB shipments table with payload:', updates)

    const { data: updatedShipment, error: updateErr } = await supabase
      .from('shipments')
      .update(updates)
      .eq('id', parseInt(id))
      .select()
      .single()

    if (updateErr) {
      console.error('[DEBUG assign-courier API] Error updating DB shipment record:', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    console.log('[DEBUG assign-courier API] Successfully updated shipment record in DB:', updatedShipment)

    return NextResponse.json({
      success: true,
      demoMode,
      shipment: updatedShipment
    })

  } catch (error: any) {
    console.error('[DEBUG assign-courier API] Unhandled Exception:', error?.message || error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: claim, error } = await supabase
      .from('claim-products')
      .select('*, address_details:address_id(*)')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, claim })
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
    const supabase = await createClient()
    const body = await request.json()

    // Accept all valid claim-products columns for update
    const writableFields = [
      'status', 'description', 'claim_type', 'reason', 'assigned_to', 
      'admin_note', 'rejected_reason', 'approved_at', 'approved_by',
      'pickup_scheduled_at', 'shiprocket_order_id', 'shipment_id', 'awb_code',
      'courier_name', 'tracking_number', 'tracking_url', 'label_url', 'manifest_url',
      'received_at', 'received_by', 'qc_note', 'qc_images', 'qc_checked_by',
      'qc_checked_at', 'refund_amount', 'razorpay_payment_id', 'razorpay_refund_id',
      'refund_reason', 'refund_processed_by', 'refund_processed_at', 'refund_failure_reason',
      'customer_notified', 'customer_notified_at', 'pickup_status', 'refund_status', 'qc_status'
    ]

    const updatePayload: any = {}
    for (const field of writableFields) {
      if (body[field] !== undefined) {
        updatePayload[field] = body[field]
      }
    }

    const { data, error } = await supabase
      .from('claim-products')
      .update(updatePayload)
      .eq('id', id)
      .select('*, address_details:address_id(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, claim: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from('claim-products')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Claim deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

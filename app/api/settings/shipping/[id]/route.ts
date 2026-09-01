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

// GET single shipping setting by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()
    const { data: setting, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, setting })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// PUT / UPDATE shipping setting by ID
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    }

    if (body.shipping_enabled !== undefined) {
      updatePayload.shipping_enabled = Boolean(body.shipping_enabled)
    }
    if (body.free_delivery_enabled !== undefined) {
      updatePayload.free_delivery_enabled = Boolean(body.free_delivery_enabled)
    }
    if (body.free_delivery_min_amount !== undefined) {
      const minAmount = Number(body.free_delivery_min_amount)
      if (isNaN(minAmount) || minAmount < 0) {
        return NextResponse.json({ error: 'Invalid free delivery minimum amount' }, { status: 400 })
      }
      updatePayload.free_delivery_min_amount = minAmount
    }
    if (body.shipping_charge !== undefined) {
      const charge = Number(body.shipping_charge)
      if (isNaN(charge) || charge < 0) {
        return NextResponse.json({ error: 'Invalid shipping charge' }, { status: 400 })
      }
      updatePayload.shipping_charge = charge
    }

    const { data, error } = await supabase
      .from('shipping_settings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, setting: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE shipping setting by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('shipping_settings')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const updatePayload: any = {}
    if (body.name !== undefined) updatePayload.name = body.name?.trim() || null
    if (body.contactPerson !== undefined) updatePayload.contact_person = body.contactPerson?.trim() || null
    if (body.phone !== undefined) updatePayload.phone = body.phone?.trim() || null
    if (body.email !== undefined) updatePayload.email = body.email?.trim() || null
    if (body.addressLine1 !== undefined) updatePayload.address_line_1 = body.addressLine1?.trim() || null
    if (body.addressLine2 !== undefined) updatePayload.address_line_2 = body.addressLine2?.trim() || null
    if (body.landmark !== undefined) updatePayload.landmark = body.landmark?.trim() || null
    if (body.city !== undefined) updatePayload.city = body.city?.trim() || null
    if (body.state !== undefined) updatePayload.state = body.state?.trim() || null
    if (body.country !== undefined) updatePayload.country = body.country?.trim() || null
    if (body.pincode !== undefined) updatePayload.pincode = body.pincode?.trim() || null
    if (body.latitude !== undefined) updatePayload.latitude = body.latitude ? Number(body.latitude) : null
    if (body.longitude !== undefined) updatePayload.longitude = body.longitude ? Number(body.longitude) : null
    if (body.gstNumber !== undefined) updatePayload.gst_number = body.gstNumber?.trim() || null
    if (body.isDefault !== undefined) updatePayload.is_default = body.isDefault === true
    if (body.isActive !== undefined) updatePayload.is_active = body.isActive === true

    // If setting as default, unset other defaults
    if (body.isDefault === true) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id)
    }

    updatePayload.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('warehouses')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, warehouse: data })
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
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('warehouses')
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

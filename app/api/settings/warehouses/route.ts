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

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    const { data: warehouses, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, warehouses: warehouses || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const {
      name,
      contactPerson,
      phone,
      email,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      gstNumber,
      isDefault,
      isActive
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Warehouse name is required' }, { status: 400 })
    }
    if (!contactPerson?.trim()) {
      return NextResponse.json({ error: 'Contact person is required' }, { status: 400 })
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }
    if (!addressLine1?.trim()) {
      return NextResponse.json({ error: 'Address line 1 is required' }, { status: 400 })
    }
    if (!city?.trim()) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }
    if (!state?.trim()) {
      return NextResponse.json({ error: 'State is required' }, { status: 400 })
    }
    if (!country?.trim()) {
      return NextResponse.json({ error: 'Country is required' }, { status: 400 })
    }
    if (!pincode?.trim()) {
      return NextResponse.json({ error: 'Pincode is required' }, { status: 400 })
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('warehouses')
        .update({ is_default: false })
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert({
        name: name.trim(),
        contact_person: contactPerson.trim(),
        phone: phone.trim(),
        email: email?.trim() || null,
        address_line_1: addressLine1.trim(),
        address_line_2: addressLine2?.trim() || null,
        landmark: landmark?.trim() || null,
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: pincode.trim(),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        gst_number: gstNumber?.trim() || null,
        is_default: isDefault === true,
        is_active: isActive !== false
      })
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

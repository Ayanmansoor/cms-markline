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

// GET all shipping settings
export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    const { data: settings, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, settings: settings || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// POST create new shipping setting
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const {
      shipping_enabled = true,
      free_delivery_enabled = true,
      free_delivery_min_amount = 600.00,
      shipping_charge = 79.00
    } = body

    const minAmount = Number(free_delivery_min_amount)
    const charge = Number(shipping_charge)

    if (isNaN(minAmount) || minAmount < 0) {
      return NextResponse.json({ error: 'Invalid free delivery minimum amount' }, { status: 400 })
    }
    if (isNaN(charge) || charge < 0) {
      return NextResponse.json({ error: 'Invalid shipping charge' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shipping_settings')
      .insert({
        shipping_enabled: Boolean(shipping_enabled),
        free_delivery_enabled: Boolean(free_delivery_enabled),
        free_delivery_min_amount: minAmount,
        shipping_charge: charge,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
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

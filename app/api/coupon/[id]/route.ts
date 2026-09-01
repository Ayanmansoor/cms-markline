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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()

    const isNumeric = /^\d+$/.test(id)
    let query = supabase.from('coupons').select('*')
    
    if (isNumeric) {
      query = query.eq('id', parseInt(id))
    } else {
      query = query.eq('coupon_id', id)
    }

    const { data, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, coupon: data })
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

    const isNumeric = /^\d+$/.test(id)
    let query = supabase.from('coupons').delete()
    
    if (isNumeric) {
      query = query.eq('id', parseInt(id))
    } else {
      query = query.eq('coupon_id', id)
    }

    const { error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
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
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const {
      code,
      title,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount_amount,
      usage_limit,
      per_user_limit,
      starts_at,
      expires_at,
      is_active
    } = body

    if (!code || !title) {
      return NextResponse.json({ error: 'Code and Title are required' }, { status: 400 })
    }

    if (!discount_type) {
      return NextResponse.json({ error: 'Discount Type is required' }, { status: 400 })
    }

    const isNumeric = /^\d+$/.test(id)
    let query = supabase.from('coupons').update({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description ? description.trim() : null,
      discount_type,
      discount_value: discount_value ? parseFloat(discount_value) : 0,
      minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : 0,
      maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      per_user_limit: per_user_limit ? parseInt(per_user_limit) : 1,
      starts_at: starts_at || null,
      expires_at: expires_at || null,
      is_active: !!is_active,
      updated_at: new Date().toISOString()
    })

    if (isNumeric) {
      query = query.eq('id', parseInt(id))
    } else {
      query = query.eq('coupon_id', id)
    }

    const { data, error } = await query.select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, coupon: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

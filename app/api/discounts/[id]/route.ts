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

    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('discount_id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, discount: data })
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
      name,
      code,
      inPercent,
      discount_persent,
      discount_start,
      discount_end,
      isMinimumRequirement,
      purchase_amount,
      quantity,
      user,
      limit_per_customer
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discounts')
      .update({
        name,
        code: code || null,
        inPercent: !!inPercent,
        discount_persent: discount_persent ? parseFloat(discount_persent) : 0,
        discount_start: discount_start || null,
        discount_end: discount_end || null,
        isMinimumRequirement: !!isMinimumRequirement,
        purchase_amount: purchase_amount !== undefined ? purchase_amount : null,
        quantity: quantity !== undefined ? quantity : null,
        user: user || null,
        limit_per_customer: !!limit_per_customer
      })
      .eq('discount_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, discount: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

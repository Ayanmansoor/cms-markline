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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const statusFilter = searchParams.get('status') || 'all' // all, active, upcoming, expired
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await getSupabaseClient()

    const { data: coupons, error, count } = await supabase
      .from('coupons')
      .select('*', { count: 'exact' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const now = new Date()

    const mappedCoupons = (coupons || []).map((c: any) => {
      let status: 'Active' | 'Upcoming' | 'Expired' = 'Active'
      let statusDot = 'bg-emerald-500'
      let statusColor = 'text-emerald-600'
      let validityColor = 'text-emerald-500'
      
      const startDate = c.starts_at ? new Date(c.starts_at) : null
      const endDate = c.expires_at ? new Date(c.expires_at) : null

      if (startDate && now < startDate) {
        status = 'Upcoming'
        statusDot = 'bg-blue-600'
        statusColor = 'text-blue-600'
        validityColor = 'text-blue-500'
      } else if (endDate && now > endDate) {
        status = 'Expired'
        statusDot = 'bg-red-500'
        statusColor = 'text-red-600'
        validityColor = 'text-red-500'
      }

      // If is_active is false, force status to Inactive/Expired
      if (!c.is_active) {
        status = 'Expired'
        statusDot = 'bg-slate-400'
        statusColor = 'text-slate-500'
        validityColor = 'text-slate-400'
      }

      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }

      const validityMain = (c.starts_at && c.expires_at)
        ? `${formatDate(c.starts_at)} - ${formatDate(c.expires_at)}`
        : 'Ongoing'

      const validitySub = status === 'Active' ? 'Active' : status === 'Upcoming' ? 'Scheduled' : 'Expired'

      return {
        ...c,
        validityMain,
        validitySub,
        validityColor,
        status,
        statusColor,
        statusDot,
      }
    })

    // Filter by status if requested
    let filteredCoupons = mappedCoupons
    if (statusFilter !== 'all') {
      filteredCoupons = mappedCoupons.filter((c: any) => c.status.toLowerCase() === statusFilter.toLowerCase())
    }

    const paginatedCoupons = filteredCoupons.slice(from, to + 1)

    // Calculate metrics
    const activeCount = mappedCoupons.filter((c: any) => c.status === 'Active').length
    const upcomingCount = mappedCoupons.filter((c: any) => c.status === 'Upcoming').length
    const totalCount = filteredCoupons.length

    return NextResponse.json({
      success: true,
      coupons: paginatedCoupons,
      totalCount,
      metrics: {
        activeCount,
        upcomingCount,
        totalCount: mappedCoupons.length
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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

    const payload: any = {
      coupon_id: crypto.randomUUID(),
      code: code.trim().toUpperCase(),
      title: title.trim(),
      description: description ? description.trim() : null,
      discount_type, // 'Percentage', 'Fixed', or 'Free Shipping'
      discount_value: discount_value ? parseFloat(discount_value) : 0,
      minimum_order_amount: minimum_order_amount ? parseFloat(minimum_order_amount) : 0,
      maximum_discount_amount: maximum_discount_amount ? parseFloat(maximum_discount_amount) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      per_user_limit: per_user_limit ? parseInt(per_user_limit) : 1,
      starts_at: starts_at || null,
      expires_at: expires_at || null,
      is_active: !!is_active
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, coupon: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

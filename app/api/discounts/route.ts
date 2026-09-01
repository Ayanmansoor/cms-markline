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

    const { data: discounts, error, count } = await supabase
      .from('discounts')
      .select('*', { count: 'exact' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const now = new Date()

    const mappedDiscounts = discounts.map((d: any) => {
      let status: 'Active' | 'Upcoming' | 'Expired' = 'Active'
      let statusDot = 'bg-emerald-500'
      let statusColor = 'text-emerald-600'
      let validityColor = 'text-emerald-500'
      
      const startDate = d.discount_start ? new Date(d.discount_start) : null
      const endDate = d.discount_end ? new Date(d.discount_end) : null

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

      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }

      const validityMain = (d.discount_start && d.discount_end)
        ? `${formatDate(d.discount_start)} - ${formatDate(d.discount_end)}`
        : 'Ongoing'

      const validitySub = status === 'Active' ? 'Active' : status === 'Upcoming' ? 'Scheduled' : 'Expired'

      const usageCount = d.usage || 0
      const totalCapacity = 2500 // Mock capacity threshold
      const progress = status === 'Expired' ? 100 : Math.min(100, Math.round((usageCount / totalCapacity) * 100))

      return {
        id: d.discount_id,
        name: d.name || 'Unnamed Discount',
        code: d.code || (d.name ? d.name.toUpperCase().replace(/\s+/g, '') : 'PROMO'),
        type: d.inPercent ? 'PERCENTAGE' : 'FIXED AMOUNT',
        percentage: d.inPercent ? `${d.discount_persent}%` : `₹${d.discount_persent}`,
        validityMain,
        validitySub,
        validityColor,
        status,
        statusColor,
        statusDot,
        usage: usageCount,
        progress,
        progressColor: status === 'Active' ? 'bg-emerald-500' : status === 'Upcoming' ? 'bg-blue-500' : 'bg-red-500',
        user: d.user || null,
        limit_per_customer: !!d.limit_per_customer
      }
    })

    // Filter by status if requested
    let filteredDiscounts = mappedDiscounts
    if (statusFilter !== 'all') {
      filteredDiscounts = mappedDiscounts.filter((d: any) => d.status.toLowerCase() === statusFilter.toLowerCase())
    }

    const paginatedDiscounts = filteredDiscounts.slice(from, to + 1)

    // Calculate metrics
    const activeCount = mappedDiscounts.filter((d: any) => d.status === 'Active').length
    const upcomingCount = mappedDiscounts.filter((d: any) => d.status === 'Upcoming').length
    const totalUsage = discounts.reduce((acc: number, curr: any) => acc + (curr.usage || 0), 0)

    return NextResponse.json({
      success: true,
      discounts: paginatedDiscounts,
      totalCount: filteredDiscounts.length,
      metrics: {
        activeCount,
        upcomingCount,
        totalUsage
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
    const { name, code, inPercent, discount_persent, discount_start, discount_end, isMinimumRequirement, purchase_amount, quantity, user, limit_per_customer } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('discounts')
      .insert({
        name,
        code: code || null,
        inPercent: !!inPercent,
        discount_persent: discount_persent ? parseFloat(discount_persent) : 0,
        discount_start: discount_start || null,
        discount_end: discount_end || null,
        usage: 0,
        isMinimumRequirement: !!isMinimumRequirement,
        purchase_amount: purchase_amount !== undefined ? purchase_amount : null,
        quantity: quantity !== undefined ? quantity : null,
        user: user || null,
        limit_per_customer: !!limit_per_customer
      })
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing discount ID' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    const { error } = await supabase
      .from('discounts')
      .delete()
      .eq('discount_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

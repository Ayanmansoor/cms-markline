import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { parseImageUrl } from '@/lib/utils'

const formatImageUrl = (raw: any): string => {
  if (!raw) return ''
  let str = ''
  if (Array.isArray(raw) && raw.length > 0) {
    str = typeof raw[0] === 'string' ? raw[0] : ''
  } else if (typeof raw === 'string') {
    str = raw
  }
  if (!str) return ''
  try {
    const parsed = JSON.parse(str)
    str = parsed.download_url || parsed.url || parsed.image_url || parsed.path || str
  } catch {
    // string fallback
  }
  if (str && !str.startsWith('http://') && !str.startsWith('https://')) {
    str = `https://raw.githubusercontent.com/Ayandev1/image/main/${str}`
  }
  return str
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const paymentStatusFilter = searchParams.get('payment_status') || 'all'
    const fulfillmentStatusFilter = searchParams.get('fulfillment_status') || 'all'
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServerClient()

    // 1. Fetch orders with address relation
    let query = supabase
      .from('orders')
      .select('*, address(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply database filters
    if (paymentStatusFilter !== 'all') {
      query = query.eq('payment_status', paymentStatusFilter.toUpperCase())
    }
    if (fulfillmentStatusFilter !== 'all') {
      const mapping: Record<string, string> = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        packed: 'Packed',
        ready_to_ship: 'Ready To Ship',
        shipped: 'Shipped',
        delivered: 'Delivered',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
      const mapped = mapping[fulfillmentStatusFilter.toLowerCase()] || fulfillmentStatusFilter
      query = query.eq('fulfillment_status', mapped)
    }

    // Apply pagination
    query = query.range(from, to)

    const { data: orders, error: ordersError, count: totalCount } = await query

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 400 })
    }

    // 2. Fetch item counts, product names & images for displayed orders
    let itemCountMap = new Map<string, number>()
    let firstItemImageMap = new Map<string, string>()
    let firstItemNameMap = new Map<string, string>()

    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      const { data: items } = await supabase
        .from('order_items')
        .select('order_id, product(id, name, product_variants(image_url))')
        .in('order_id', orderIds)

      items?.forEach((item: any) => {
        itemCountMap.set(item.order_id, (itemCountMap.get(item.order_id) || 0) + 1)
        
        if (item.product?.name && !firstItemNameMap.has(item.order_id)) {
          firstItemNameMap.set(item.order_id, item.product.name)
        }

        if (!firstItemImageMap.has(item.order_id)) {
          const rawImg = item.product?.image_url || item.product?.product_variants?.[0]?.image_url
          const imgUrl = parseImageUrl(rawImg)
          if (imgUrl) {
            firstItemImageMap.set(item.order_id, imgUrl)
          }
        }
      })
    }

    // 3. Map user details from auth.users if service role is available
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const userMap = new Map<string, { email: string; name: string }>()

    if (serviceRoleKey && orders && orders.length > 0) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
      authData?.users?.forEach((u: any) => {
        userMap.set(u.id, {
          email: u.email || 'N/A',
          name: u.user_metadata?.full_name || u.user_metadata?.name || 'Customer'
        })
      })
    }

    const avatarColors = [
      { bg: 'bg-slate-100', text: 'text-slate-700' },
      { bg: 'bg-blue-100', text: 'text-blue-700' },
      { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      { bg: 'bg-amber-100', text: 'text-amber-700' },
      { bg: 'bg-purple-100', text: 'text-purple-700' }
    ]

    const mappedOrders = (orders || []).map((o: any, idx: number) => {
      const userId = o.user_id
      const authUser = userId ? userMap.get(userId) : null
      
      const addressFullName = o.address ? `${o.address.first_name || ''} ${o.address.last_name || ''}`.trim() : ''
      const customerName = addressFullName || authUser?.name || 'Storefront Guest'
      const customerEmail = authUser?.email || (userId ? `guest-${userId.slice(0, 8)}@shopmarkline.com` : 'guest@shopmarkline.com')
      const productName = firstItemNameMap.get(o.id) || 'Markline Product'
      
      const initials = (productName || customerName)
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'PR'

      const colorScheme = avatarColors[idx % avatarColors.length]

      const date = o.created_at ? new Date(o.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }) : 'N/A, '

      let paymentStatus = o.payment_status || 'PENDING'
      let paymentColor = 'amber'
      if (paymentStatus === 'PAID') {
        paymentColor = 'emerald'
      } else if (paymentStatus === 'FAILED') {
        paymentColor = 'red'
      }

      let fulfillmentStatus = o.fulfillment_status || 'Pending'
      let fulfillmentColor = 'slate'
      const fStatusLower = fulfillmentStatus.toLowerCase()
      if (fStatusLower === 'delivered' || fStatusLower === 'completed') {
        fulfillmentColor = 'emerald'
      } else if (fStatusLower === 'shipped' || fStatusLower === 'ready to ship' || fStatusLower === 'packed' || fStatusLower === 'confirmed') {
        fulfillmentColor = 'blue'
      } else if (fStatusLower === 'cancelled') {
        fulfillmentColor = 'red'
      }

      const formattedTotal = `₹${Number(o.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

      return {
        id: o.id,
        displayId: `ORD-${o.id.toString().slice(0, 6)}`,
        order_number: `ORD-${o.id.toString().slice(0, 6)}`,
        productName: productName,
        product_name: productName,
        customerName: customerName,
        customer_name: customerName,
        customerEmail: customerEmail,
        customer_email: customerEmail,
        initials: initials,
        customer_initials: initials,
        avatarBg: colorScheme.bg,
        avatar_bg: colorScheme.bg,
        avatarText: colorScheme.text,
        avatar_text: colorScheme.text,
        image_url: firstItemImageMap.get(o.id) || null,
        date: date,
        created_at: date,
        raw_date: o.created_at,
        paymentStatus: paymentStatus,
        payment_status: paymentStatus,
        paymentColor: paymentColor,
        payment_color: paymentColor,
        fulfillmentStatus: fulfillmentStatus,
        fulfillment_status: fulfillmentStatus,
        fulfillmentColor: fulfillmentColor,
        fulfillment_color: fulfillmentColor,
        total: formattedTotal,
        grand_total: o.grand_total,
        total_amount: o.grand_total,
        subtotal: o.subtotal,
        discount_amount: o.discount_amount,
        shipping_charge: o.shipping_charge,
        tax_amount: o.tax_amount,
        payment_method: o.payment_method || 'Online Payment',
        items_count: itemCountMap.get(o.id) || 1,
        address: o.address
      }
    })

    return NextResponse.json({
      success: true,
      orders: mappedOrders,
      totalCount: totalCount || mappedOrders.length,
      page,
      limit,
      totalPages: Math.ceil((totalCount || mappedOrders.length) / limit)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

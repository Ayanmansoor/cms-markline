import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 25
    const status = searchParams.get('status') || 'all' // all, active, inactive
    
    // Advanced Filter parameters
    const search = searchParams.get('search') || ''
    const hasOrdersParam = searchParams.get('hasOrders') || 'all' // all, yes, no
    const hasCartParam = searchParams.get('hasCart') || 'all' // all, yes, no
    const hasWishlistParam = searchParams.get('hasWishlist') || 'all' // all, yes, no
    const hasReviewsParam = searchParams.get('hasReviews') || 'all' // all, yes, no
    const hasAddressParam = searchParams.get('hasAddress') || 'all' // all, yes, no

    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createServerClient()

    // 1. Fetch public metrics for all users - use grand_total from orders
    const { data: orders } = await supabase
      .from('orders')
      .select('user_id, grand_total')

    const { data: wishlists } = await supabase
      .from('wishlist')
      .select('user_id')

    const { data: reviews } = await supabase
      .from('reviews')
      .select('user_id')

    const { data: carts } = await supabase
      .from('cart')
      .select('user_id, variant_price, quantity')

    const { data: addresses } = await supabase
      .from('address')
      .select('user_id')

    // Fetch discounts using correct primary key 'discount_id'
    const { data: discounts } = await supabase
      .from('discounts')
      .select('discount_id, name, discount_persent')

    const discountMap = new Map<string, { name: string; discount_persent: number }>()
    discounts?.forEach((d: any) => {
      if (d.discount_id) {
        discountMap.set(d.discount_id, { name: d.name, discount_persent: d.discount_persent })
      }
    })

    // Aggregate public metrics in memory
    const orderStats: Record<string, { count: number; ltv: number }> = {}
    orders?.forEach((o: any) => {
      if (!o.user_id) return
      if (!orderStats[o.user_id]) {
        orderStats[o.user_id] = { count: 0, ltv: 0 }
      }
      orderStats[o.user_id].count += 1
      orderStats[o.user_id].ltv += parseFloat(o.grand_total || '0')
    })

    const wishlistStats: Record<string, number> = {}
    wishlists?.forEach((w: any) => {
      if (!w.user_id) return
      wishlistStats[w.user_id] = (wishlistStats[w.user_id] || 0) + 1
    })

    const reviewStats: Record<string, number> = {}
    reviews?.forEach((r: any) => {
      if (!r.user_id) return
      reviewStats[r.user_id] = (reviewStats[r.user_id] || 0) + 1
    })

    const cartStats: Record<string, number> = {}
    carts?.forEach((c: any) => {
      if (!c.user_id) return
      cartStats[c.user_id] = (cartStats[c.user_id] || 0) + 1
    })

    const addressStats: Record<string, number> = {}
    addresses?.forEach((a: any) => {
      if (!a.user_id) return
      addressStats[a.user_id] = (addressStats[a.user_id] || 0) + 1
    })

    let usersList: any[] = []
    let isFallback = false

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (serviceRoleKey) {
      // 2. Fetch users from auth.users using supabaseAdmin
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

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      usersList = authData.users.map((u: any) => {
        const userId = u.id
        const stats = orderStats[userId] || { count: 0, ltv: 0 }
        const wishlistCount = wishlistStats[userId] || 0
        const reviewCount = reviewStats[userId] || 0
        const cartCount = cartStats[userId] || 0
        const addressCount = addressStats[userId] || 0
        
        // Extract discount key from raw user metadata
        const discountKey = u.raw_user_meta_data?.discount_key || u.user_metadata?.discount_key || null
        const discountDetails = discountKey ? discountMap.get(discountKey) : null

        return {
          id: userId,
          name: u.user_metadata?.full_name || u.user_metadata?.name || 'Customer',
          email: u.email || 'N/A',
          phone: u.phone || 'N/A',
          orders: stats.count,
          wishlist: wishlistCount,
          reviews: reviewCount,
          cartCount: cartCount,
          addressCount: addressCount,
          hasOrders: stats.count > 0,
          hasCart: cartCount > 0,
          hasWishlist: wishlistCount > 0,
          hasReviews: reviewCount > 0,
          hasAddress: addressCount > 0,
          ltv: stats.ltv,
          joined: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          }) : 'N/A',
          isActive: stats.count > 0 || wishlistCount > 0 || cartCount > 0,
          discount: discountDetails
        }
      })
    } else {
      // 3. Fallback: Aggregate unique user_ids from orders/wishlist/cart/address/reviews
      isFallback = true
      const uniqueUserIds = new Set<string>([
        ...Object.keys(orderStats),
        ...Object.keys(wishlistStats),
        ...Object.keys(reviewStats),
        ...Object.keys(cartStats),
        ...Object.keys(addressStats)
      ])

      usersList = Array.from(uniqueUserIds).map((userId, idx) => {
        const stats = orderStats[userId] || { count: 0, ltv: 0 }
        const wishlistCount = wishlistStats[userId] || 0
        const reviewCount = reviewStats[userId] || 0
        const cartCount = cartStats[userId] || 0
        const addressCount = addressStats[userId] || 0

        // Mock some discount assignments for guest view demonstration
        const mockDiscountKeys = Array.from(discountMap.keys())
        const discountKey = mockDiscountKeys.length > 0 ? mockDiscountKeys[idx % mockDiscountKeys.length] : null
        const discountDetails = discountKey ? discountMap.get(discountKey) : null

        return {
          id: userId,
          name: `Guest Customer ${idx + 1}`,
          email: `guest-${userId.slice(0, 8)}@shopmarkline.com`,
          phone: 'N/A',
          orders: stats.count,
          wishlist: wishlistCount,
          reviews: reviewCount,
          cartCount: cartCount,
          addressCount: addressCount,
          hasOrders: stats.count > 0,
          hasCart: cartCount > 0,
          hasWishlist: wishlistCount > 0,
          hasReviews: reviewCount > 0,
          hasAddress: addressCount > 0,
          ltv: stats.ltv,
          joined: 'N/A',
          isActive: stats.count > 0 || wishlistCount > 0 || cartCount > 0,
          discount: discountDetails
        }
      })
    }

    // Filter by status (active vs inactive)
    let filteredUsers = usersList
    if (status === 'active') {
      filteredUsers = filteredUsers.filter(u => u.isActive)
    } else if (status === 'inactive') {
      filteredUsers = filteredUsers.filter(u => !u.isActive)
    }

    // Apply Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      filteredUsers = filteredUsers.filter(u => 
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    }

    // Apply Relational Advanced Filters
    if (hasOrdersParam !== 'all') {
      const target = hasOrdersParam === 'yes'
      filteredUsers = filteredUsers.filter(u => u.hasOrders === target)
    }

    if (hasCartParam !== 'all') {
      const target = hasCartParam === 'yes'
      filteredUsers = filteredUsers.filter(u => u.hasCart === target)
    }

    if (hasWishlistParam !== 'all') {
      const target = hasWishlistParam === 'yes'
      filteredUsers = filteredUsers.filter(u => u.hasWishlist === target)
    }

    if (hasReviewsParam !== 'all') {
      const target = hasReviewsParam === 'yes'
      filteredUsers = filteredUsers.filter(u => u.hasReviews === target)
    }

    if (hasAddressParam !== 'all') {
      const target = hasAddressParam === 'yes'
      filteredUsers = filteredUsers.filter(u => u.hasAddress === target)
    }

    // Pagination
    const totalCount = filteredUsers.length
    const paginatedUsers = filteredUsers.slice(from, to + 1)

    // Calculate metrics summaries
    const totalSpentSum = usersList.reduce((acc, curr) => acc + curr.ltv, 0)
    const avgLtv = totalCount > 0 ? totalSpentSum / totalCount : 0
    const activeCount = usersList.filter(u => u.isActive).length
    const activeRate = usersList.length > 0 ? (activeCount / usersList.length) * 100 : 0

    let abandonedCartsAmount = 0
    const abandonedCartsCount = carts?.length || 0
    carts?.forEach((c: any) => {
      const price = parseFloat(c.variant_price || '0')
      const qty = parseInt(c.quantity || '1')
      abandonedCartsAmount += price * (isNaN(qty) ? 1 : qty)
    })

    return NextResponse.json({
      success: true,
      customers: paginatedUsers,
      totalCount,
      isFallback,
      metrics: {
        totalCustomers: usersList.length,
        activeUsers: activeCount,
        totalSales: totalSpentSum,
        abandonedCartsCount,
        abandonedCartsAmount,
        avgLtv,
        activeRate
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    // 1. Fetch user profile from Supabase auth (if admin key is configured)
    let userDetails: any = null
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      try {
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
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(id)
        if (!authError && authData?.user) {
          const u = authData.user
          userDetails = {
            id: u.id,
            name: u.user_metadata?.full_name || u.user_metadata?.name || 'Customer',
            email: u.email || 'N/A',
            phone: u.phone || 'N/A',
            joined: u.created_at,
            raw_metadata: u.user_metadata || {}
          }
        }
      } catch (authErr) {
        console.error("Auth user lookup failed:", authErr)
      }
    }

    // Fallback if not configured or user not found
    if (!userDetails) {
      userDetails = {
        id: id,
        name: `Guest Customer (${id.slice(0, 8)})`,
        email: `guest-${id.slice(0, 8)}@shopmarkline.com`,
        phone: 'N/A',
        joined: new Date().toISOString(),
        raw_metadata: {}
      }
    }

    // 2. Fetch Orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // 3. Fetch order items with product details for all user orders
    let ordersWithProducts: any[] = []
    if (orders && orders.length > 0) {
      const orderIds = orders.map(o => o.id)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*, product(id, name, slug, image_url, product_variants(id, image_url))')
        .in('order_id', orderIds)

      // Group items by order_id and resolve images
      const itemsByOrder = new Map<string, any[]>()
      ;(orderItems || []).forEach((item: any) => {
        let imageUrl = item.product?.image_url || null
        if (item.variant_id && item.product?.product_variants) {
          const variant = item.product.product_variants.find((v: any) => v.id === item.variant_id)
          if (variant?.image_url) {
            try {
              const parsed = JSON.parse(variant.image_url[0])
              imageUrl = parsed.image_url || imageUrl
            } catch {
              imageUrl = typeof variant.image_url[0] === 'string' ? variant.image_url[0] : imageUrl
            }
          }
        }

        const mapped = {
          ...item,
          product: {
            name: item.product?.name,
            slug: item.product?.slug,
            image_url: imageUrl
          }
        }

        if (!itemsByOrder.has(item.order_id)) {
          itemsByOrder.set(item.order_id, [])
        }
        itemsByOrder.get(item.order_id)!.push(mapped)
      })

      ordersWithProducts = orders.map(o => ({
        ...o,
        order_items: itemsByOrder.get(o.id) || [],
        // Keep first item's product for backward compatibility with the UI
        product: (itemsByOrder.get(o.id) || [])[0]?.product || null
      }))
    }

    // 4. Fetch Cart Items
    const { data: carts } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // 5. Fetch Addresses
    const { data: addresses } = await supabase
      .from('address')
      .select('*')
      .eq('user_id', id)
      .order('id', { ascending: true })

    // 6. Fetch Wishlist Items
    const { data: wishlist } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    // 7. Fetch Reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })

    const reviewProductIds = Array.from(new Set(reviews?.map(r => r.product_id).filter(Boolean) || []))
    let reviewProductMap = new Map()
    if (reviewProductIds.length > 0) {
      const { data: products } = await supabase.from('product').select('id, name, slug').in('id', reviewProductIds)
      products?.forEach(p => reviewProductMap.set(p.id, p))
    }
    const reviewsWithProducts = reviews?.map(r => ({
      ...r,
      product: reviewProductMap.get(r.product_id) || null
    })) || []

    // Calculate aggregated user stats using grand_total
    const totalSpent = orders?.reduce((sum, o) => sum + parseFloat(o.grand_total || '0'), 0) || 0
    const totalOrdersCount = orders?.length || 0
    const aov = totalOrdersCount > 0 ? totalSpent / totalOrdersCount : 0

    return NextResponse.json({
      success: true,
      customer: userDetails,
      metrics: {
        totalSpent,
        totalOrdersCount,
        aov
      },
      orders: ordersWithProducts,
      carts: carts || [],
      addresses: addresses || [],
      wishlist: wishlist || [],
      reviews: reviewsWithProducts
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

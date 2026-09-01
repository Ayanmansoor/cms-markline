import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMap } from '../helper'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Resolve products in memory
    const productIds = Array.from(new Set(reviews?.map((r: any) => r.product_id).filter(Boolean) || []))
    let productMap = new Map()
    if (productIds.length > 0) {
      const { data: products } = await supabase.from('product').select('id, name, slug').in('id', productIds)
      products?.forEach(p => productMap.set(p.id, p))
    }

    const userMap = await getUserMap()
    const reviewsWithDetails = reviews?.map((review: any) => {
      const user = userMap.get(review.user_id) || { name: 'Guest Customer', email: 'guest@shopmarkline.com' }
      const prod = productMap.get(review.product_id) || null
      return {
        ...review,
        customerName: user.name,
        customerEmail: user.email,
        product: prod
      }
    }) || []

    return NextResponse.json({ success: true, reviews: reviewsWithDetails })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

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
    const gender = searchParams.get('gender')
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await getSupabaseClient()

    // Query brands table and join product table to count associated products
    let query = supabase
      .from('brands')
      .select('*, product(id), discounts(name, discount_persent)', { count: 'exact' })

    if (gender && gender !== 'all' && gender !== 'global') {
      query = query.eq('gender', gender.toUpperCase())
    }

    query = query.order('name', { ascending: true })

    const { data, error, count } = await query.range(from, to)

    if (error) {
      // Fallback: If product join fails, fetch brands without product join but keep discounts join if possible
      let fallbackQuery = supabase
        .from('brands')
        .select('*, discounts(name, discount_persent)', { count: 'exact' })

      if (gender && gender !== 'all' && gender !== 'global') {
        fallbackQuery = fallbackQuery.eq('gender', gender.toUpperCase())
      }

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        .order('name', { ascending: true })
        .range(from, to)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        brands: fallbackData.map((b: any) => ({ ...b, productsCount: 0 })),
        totalCount: fallbackCount || 0,
        page,
        limit
      })
    }

    // Map product(id) to count of products
    const brandsWithCounts = data.map((b: any) => {
      const productsCount = b.product ? b.product.length : 0
      const { product, ...brandData } = b
      return {
        ...brandData,
        productsCount
      }
    })

    return NextResponse.json({
      success: true,
      brands: brandsWithCounts,
      totalCount: count || 0,
      page,
      limit
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const { name, description, image_url, since_year, discount_key, gender } = body

    const { data, error } = await supabase
      .from('brands')
      .insert({
        name,
        description,
        image_url: image_url || null,
        since_year: since_year || null,
        discount_key: discount_key || null,
        gender: gender ? gender.toUpperCase() : null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, brand: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

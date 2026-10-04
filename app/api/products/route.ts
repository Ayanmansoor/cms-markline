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
    const brand = searchParams.get('brand')
    const collection = searchParams.get('collection')
    const group = searchParams.get('group')
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await getSupabaseClient()

    // Query product table, join product_variants and brands
    let query = supabase
      .from('product')
      .select('*, product_variants(*), brands!brand_key(name), group!grouptype(id, heading)', { count: 'exact' })

    if (gender) {
      query = query.eq('gender', gender.toUpperCase())
    }
    if (brand) {
      query = query.eq('brand_key', brand)
    }
    if (collection) {
      query = query.eq('collection_key', collection)
    }
    if (group) {
      query = query.eq('grouptype', group)
    }

    // Sort by created_at descending by default
    query = query.order('created_at', { ascending: false })

    const { data, error, count } = await query.range(from, to)

    if (error) {
      // Fallback: if brands!brand_key join fails due to missing constraint in dev database,
      // query products without join first
      let fallbackQuery = supabase
        .from('product')
        .select('*, product_variants(*)', { count: 'exact' })

      if (gender) {
        fallbackQuery = fallbackQuery.eq('gender', gender.toUpperCase())
      }
      if (brand) {
        fallbackQuery = fallbackQuery.eq('brand_key', brand)
      }
      if (collection) {
        fallbackQuery = fallbackQuery.eq('collection_key', collection)
      }
      if (group) {
        fallbackQuery = fallbackQuery.eq('grouptype', group)
      }

      const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery
        .order('created_at', { ascending: false })
        .range(from, to)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        products: fallbackData,
        totalCount: fallbackCount || 0,
        page,
        limit
      })
    }

    return NextResponse.json({
      success: true,
      products: data,
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

    const {
      name,
      description,
      gender,
      materials_used,
      collection_key,
      brand_key,
      is_limited_edition,
      is_new_arrival,
      is_active,
      seoTitle,
      seoDescription,
      slug,
      grouptype,
      variants, // Array of variant objects
      keywords,
      amazon_url,
      flipkart_url,
    } = body

    // 1. Insert product
    const { data: productData, error: productError } = await supabase
      .from('product')
      .insert({
        name,
        description,
        gender: gender ? gender.toUpperCase() : null,
        materials_used,
        collection_key: collection_key ? parseInt(collection_key) : null,
        brand_key: brand_key || null,
        is_limited_edition: !!is_limited_edition,
        is_new_arrival: !!is_new_arrival,
        isActive: is_active !== undefined ? !!is_active : true,
        seoTitle,
        seoDescription,
        slug,
        grouptype: grouptype ? parseInt(grouptype) : null,
        keywords: keywords || [],
        amazon_url: amazon_url ? amazon_url.trim() : null,
        flipkart_url: flipkart_url ? flipkart_url.trim() : null,
      })
      .select()
      .single()

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    const productId = productData.id

    // 2. Insert variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsToInsert = variants.map((v: any) => ({
        sku: v.sku || null,
        colors: v.colors || [],
        sizes: v.sizes || [],
        stock: v.stock !== undefined ? parseFloat(v.stock) : null,
        image_url: v.image_url || [],
        is_active: v.is_active !== undefined ? !!v.is_active : true,
        discount_key: v.discount_key || null,
        mrp: v.mrp !== undefined ? parseFloat(v.mrp) : null,
        retail_price: v.retail_price !== undefined ? parseFloat(v.retail_price) : null,
        products_id: productId,
      }))

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)

      if (variantsError) {
        // Rollback
        await supabase.from('product').delete().eq('id', productId)
        return NextResponse.json({ error: `Failed to insert variants: ${variantsError.message}` }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true, product: productData })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { productId, is_active, grouptype } = await request.json()
    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 })
    }

    const supabase = await getSupabaseClient()

    const updateFields: any = {}
    if (is_active !== undefined) {
      updateFields.is_active = is_active
    }
    if (grouptype !== undefined) {
      updateFields.grouptype = grouptype ? parseInt(String(grouptype)) : null
    }

    // 1. Update the product table fields
    const { error: productError } = await supabase
      .from('product')
      .update(updateFields)
      .eq('id', productId)

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    // 2. Cascade active status to variants if is_active was provided
    if (is_active !== undefined) {
      const { error: variantsError } = await supabase
        .from('product_variants')
        .update({ is_active })
        .eq('products_id', productId)

      if (variantsError) {
        return NextResponse.json({ error: variantsError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

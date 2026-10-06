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
    const rawBody = await request.json()

    const productPayload = rawBody.product || rawBody
    const variantsPayload = rawBody.variants || productPayload.variants

    const name = productPayload.name
    const description = productPayload.description
    const gender = productPayload.gender
    const materials_used = productPayload.materials_used !== undefined ? productPayload.materials_used : productPayload.materials
    const collection_key = productPayload.collection_key !== undefined ? productPayload.collection_key : productPayload.collection_id
    const brand_key = productPayload.brand_key !== undefined ? productPayload.brand_key : productPayload.brand_id
    const is_limited_edition = productPayload.is_limited_edition
    const is_new_arrival = productPayload.is_new_arrival
    const is_active = productPayload.is_active !== undefined ? productPayload.is_active : productPayload.isActive
    const seoTitle = productPayload.seoTitle !== undefined ? productPayload.seoTitle : productPayload.seo_title
    const seoDescription = productPayload.seoDescription !== undefined ? productPayload.seoDescription : productPayload.seo_description
    const slug = productPayload.slug
    const grouptype = productPayload.grouptype
    const keywords = productPayload.keywords
    const amazon_url = productPayload.amazon_url
    const flipkart_url = productPayload.flipkart_url

    // 1. Insert product
    const { data: productData, error: productError } = await supabase
      .from('product')
      .insert({
        name,
        description,
        gender: gender ? String(gender).toUpperCase() : null,
        materials_used,
        collection_key: collection_key ? parseInt(String(collection_key)) : null,
        brand_key: brand_key ? String(brand_key) : null,
        is_limited_edition: !!is_limited_edition,
        is_new_arrival: !!is_new_arrival,
        isActive: is_active !== undefined ? !!is_active : true,
        seoTitle,
        seoDescription,
        slug,
        grouptype: grouptype ? parseInt(String(grouptype)) : null,
        keywords: keywords || [],
        amazon_url: amazon_url ? String(amazon_url).trim() : null,
        flipkart_url: flipkart_url ? String(flipkart_url).trim() : null,
      })
      .select()
      .single()

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    const productId = productData.id

    // 2. Insert variants if provided
    if (variantsPayload && Array.isArray(variantsPayload) && variantsPayload.length > 0) {
      const variantsToInsert = variantsPayload.map((v: any) => {
        let finalImageUrls: string[] = []
        const rawImgs = v.image_url || v.images || v.imageUrls
        if (Array.isArray(rawImgs)) {
          finalImageUrls = rawImgs.map((img: any) => {
            if (typeof img === 'string') return img
            if (img && typeof img === 'object') return img.url || img.image_url || ""
            return ""
          }).filter(Boolean)
        } else if (typeof rawImgs === 'string') {
          try {
            const parsed = JSON.parse(rawImgs)
            if (Array.isArray(parsed)) {
              finalImageUrls = parsed.map((img: any) => typeof img === 'string' ? img : (img?.url || img?.image_url || "")) .filter(Boolean)
            } else {
              finalImageUrls = [rawImgs]
            }
          } catch {
            finalImageUrls = [rawImgs]
          }
        }

        let finalSizes: string[] = []
        if (Array.isArray(v.sizes)) {
          finalSizes = v.sizes.map((s: any) => {
            if (typeof s === 'string') {
              try {
                const parsed = JSON.parse(s)
                if (parsed && typeof parsed === 'object' && parsed.size) return JSON.stringify(parsed)
              } catch {}
              const num = parseInt(s)
              const unit = !isNaN(num) && num >= 30 ? 'EU' : (!isNaN(num) && num > 0 ? 'UK' : 'STD')
              return JSON.stringify({ size: String(s), unit })
            } else if (typeof s === 'object' && s !== null) {
              return JSON.stringify(s)
            }
            return String(s)
          })
        }

        let finalColors: string[] = []
        if (Array.isArray(v.colors)) {
          finalColors = v.colors.map((c: any) => {
            if (typeof c === 'string') {
              try {
                const parsed = JSON.parse(c)
                if (parsed && typeof parsed === 'object' && parsed.name) return JSON.stringify(parsed)
              } catch {}
              return JSON.stringify({ name: String(c), hex: v.colorHex || '#000000' })
            } else if (typeof c === 'object' && c !== null) {
              return JSON.stringify(c)
            }
            return String(c)
          })
        } else if (v.colorName || v.color) {
          finalColors = [
            JSON.stringify({
              name: String(v.colorName || v.color),
              hex: String(v.colorHex || '#000000'),
            })
          ]
        }

        return {
          sku: v.sku || null,
          colors: finalColors,
          sizes: finalSizes,
          stock: v.stock !== undefined ? parseFloat(String(v.stock)) : null,
          image_url: finalImageUrls,
          is_active: v.is_active !== undefined ? !!v.is_active : (v.isActive !== undefined ? !!v.isActive : true),
          discount_key: v.discount_key || v.discount_id || v.discountKey || null,
          mrp: v.mrp !== undefined ? parseFloat(String(v.mrp)) : null,
          retail_price: v.retail_price !== undefined ? parseFloat(String(v.retail_price)) : null,
          products_id: productId,
        }
      })

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

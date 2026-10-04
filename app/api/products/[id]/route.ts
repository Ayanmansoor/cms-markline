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
      .from('product')
      .select('*, product_variants(*)')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, product: data })
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

    // 1. Update product details
    const { error: productError } = await supabase
      .from('product')
      .update({
        name,
        description,
        gender: gender ? gender.toUpperCase() : null,
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
        amazon_url: amazon_url !== undefined ? (amazon_url ? String(amazon_url).trim() : null) : undefined,
        flipkart_url: flipkart_url !== undefined ? (flipkart_url ? String(flipkart_url).trim() : null) : undefined,
      })
      .eq('id', id)

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    // 2. Update variants if provided
    if (variantsPayload && Array.isArray(variantsPayload)) {
      const { data: existingVariants, error: fetchVariantsError } = await supabase
        .from('product_variants')
        .select('*')
        .eq('products_id', id)

      if (fetchVariantsError) {
        return NextResponse.json({ error: `Failed to fetch existing variants: ${fetchVariantsError.message}` }, { status: 400 })
      }

      const existingMapById = new Map<number, any>()
      const existingMapBySku = new Map<string, any>()
      existingVariants?.forEach((ev: any) => {
        existingMapById.set(ev.id, ev)
        if (ev.sku) existingMapBySku.set(ev.sku, ev)
      })

      const processedIds = new Set<number>()

      for (const v of variantsPayload) {
        // Extract array of image URLs
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
              finalImageUrls = parsed.map((img: any) => typeof img === 'string' ? img : (img?.url || img?.image_url || "")).filter(Boolean)
            } else {
              finalImageUrls = [rawImgs]
            }
          } catch {
            finalImageUrls = [rawImgs]
          }
        }

        // Format sizes as array of stringified JSON objects matching DB format
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

        // Format colors as array of stringified JSON objects matching DB format
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

        const variantData = {
          sku: v.sku || null,
          color: v.color || v.colorName || null,
          colors: finalColors,
          sizes: finalSizes,
          stock: v.stock !== undefined ? parseFloat(String(v.stock)) : null,
          image_url: finalImageUrls,
          is_active: v.is_active !== undefined ? !!v.is_active : (v.isActive !== undefined ? !!v.isActive : true),
          discount_key: v.discount_key || v.discount_id || v.discountKey || null,
          mrp: v.mrp !== undefined ? parseFloat(String(v.mrp)) : null,
          retail_price: v.retail_price !== undefined ? parseFloat(String(v.retail_price)) : null,
          price: v.retail_price !== undefined ? parseFloat(String(v.retail_price)) : null,
          products_id: parseInt(id),
        }

        const existing = (v.id && existingMapById.get(v.id)) || (v.sku && existingMapBySku.get(v.sku))

        if (existing) {
          processedIds.add(existing.id)
          const { error: updateVarErr } = await supabase
            .from('product_variants')
            .update(variantData)
            .eq('id', existing.id)

          if (updateVarErr) {
            return NextResponse.json({ error: `Failed to update variant ${existing.sku || existing.id}: ${updateVarErr.message}` }, { status: 400 })
          }
        } else {
          const { error: insertVarErr } = await supabase
            .from('product_variants')
            .insert(variantData)

          if (insertVarErr) {
            return NextResponse.json({ error: `Failed to save new variant ${v.sku || ''}: ${insertVarErr.message}` }, { status: 400 })
          }
        }
      }

      // Handle variants removed from UI
      if (existingVariants) {
        for (const ev of existingVariants) {
          if (!processedIds.has(ev.id)) {
            const { error: delErr } = await supabase
              .from('product_variants')
              .delete()
              .eq('id', ev.id)

            if (delErr) {
              await supabase
                .from('product_variants')
                .update({ is_active: false })
                .eq('id', ev.id)
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Product updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()

    // 1. Delete associated variants first
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('products_id', id)

    if (variantsError) {
      return NextResponse.json({ error: variantsError.message }, { status: 400 })
    }

    // 2. Delete the product
    const { error: productError } = await supabase
      .from('product')
      .delete()
      .eq('id', id)

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Product deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

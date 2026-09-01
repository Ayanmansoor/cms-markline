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
      variants, // Array of updated variant objects
      keywords,
      amazon_url,
      flipkart_url,
    } = body

    // 1. Update product details
    const { error: productError } = await supabase
      .from('product')
      .update({
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
        amazon_url: amazon_url !== undefined ? (amazon_url ? amazon_url.trim() : null) : undefined,
        flipkart_url: flipkart_url !== undefined ? (flipkart_url ? flipkart_url.trim() : null) : undefined,
      })
      .eq('id', id)

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 400 })
    }

    // 2. Update variants if provided
    if (variants && Array.isArray(variants)) {
      // First, delete existing variants for this product
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('products_id', id)

      if (deleteError) {
        return NextResponse.json({ error: `Failed to clear existing variants: ${deleteError.message}` }, { status: 400 })
      }

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
        price: v.retail_price !== undefined ? parseFloat(v.retail_price) : null,
        products_id: parseInt(id),
      }))

      const { error: insertError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)

      if (insertError) {
        return NextResponse.json({ error: `Failed to save new variants: ${insertError.message}` }, { status: 400 })
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

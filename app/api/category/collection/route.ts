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

export async function GET() {
  try {
    const supabase = await getSupabaseClient()

    // 1. Try querying collection with joined products to get accurate product counts
    const { data: collectionsData, error } = await supabase
      .from('collection')
      .select('*, product(id)')
      .order('id', { ascending: true })

    if (!error && collectionsData) {
      const collections = collectionsData.map((col: any) => ({
        ...col,
        productCount: Array.isArray(col.product) ? col.product.length : 0,
      }))
      return NextResponse.json({ success: true, collections })
    }

    // 2. Fallback: try with explicit foreign key `product!collection_key(id)`
    const { data: collectionsFk, error: fkError } = await supabase
      .from('collection')
      .select('*, product!collection_key(id)')
      .order('id', { ascending: true })

    if (!fkError && collectionsFk) {
      const collections = collectionsFk.map((col: any) => ({
        ...col,
        productCount: Array.isArray(col.product) ? col.product.length : 0,
      }))
      return NextResponse.json({ success: true, collections })
    }

    // 3. Fallback: select collections and map product collection_key counts in memory
    const { data: rawCollections, error: rawError } = await supabase
      .from('collection')
      .select('*')
      .order('id', { ascending: true })

    if (rawError) {
      return NextResponse.json({ error: rawError.message }, { status: 400 })
    }

    const { data: productCounts } = await supabase
      .from('product')
      .select('collection_key')

    const countMap: Record<string | number, number> = {}
    if (productCounts) {
      for (const p of productCounts) {
        if (p.collection_key !== null && p.collection_key !== undefined) {
          countMap[p.collection_key] = (countMap[p.collection_key] || 0) + 1
        }
      }
    }

    const collections = (rawCollections || []).map((col: any) => ({
      ...col,
      productCount: countMap[col.id] || 0,
    }))

    return NextResponse.json({ success: true, collections })
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
      slug,
      is_new_collection,
      seoDescription,
      seoTitle,
      is_show,
      type,
      banner_image,
      image_urls,
      keywords
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('collection')
      .insert({
        name,
        description: description || null,
        gender: gender || null,
        slug: slug || null,
        is_new_collection: is_new_collection ?? false,
        seoDescription: seoDescription || null,
        seoTitle: seoTitle || null,
        is_show: is_show ?? true,
        type: type || 'ALL',
        banner_image: banner_image || null,
        image_urls: image_urls || null,
        keywords: keywords || []
      })
      .select()
      .single()

      console.log({ error } , 'this errror');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, collection: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

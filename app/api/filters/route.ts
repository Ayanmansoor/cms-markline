import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch Brands
    const { data: brands, error: brandsError } = await supabase
      .from('brands')
      .select('id, name')
      .order('name', { ascending: true })

    // 2. Fetch Collections (with fallback if table does not exist)
    let collections: any[] = []
    const { data: collectionsData, error: collectionsError } = await supabase
      .from('collection')
      .select('id, name')
      .order('name', { ascending: true })

    if (!collectionsError && collectionsData) {
      collections = collectionsData
    } else {
      // Fallback: Fetch unique collection_keys from product table
      const { data: productsData } = await supabase
        .from('product')
        .select('collection_key')

      if (productsData) {
        const uniqueKeys = Array.from(new Set(productsData.map(p => p.collection_key).filter(Boolean)))
        collections = uniqueKeys.map(key => ({ id: key, name: `Collection ${key}` }))
      }
    }

    // 3. Fetch Groups
    const { data: groupsData } = await supabase
      .from('group')
      .select('id, heading')
      .order('heading', { ascending: true })

    const groups = (groupsData || []).map((g: any) => ({
      id: g.id,
      name: g.heading
    }))

    return NextResponse.json({
      success: true,
      brands: brands || [],
      collections: collections || [],
      groups: groups
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

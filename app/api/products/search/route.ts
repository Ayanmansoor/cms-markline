import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20

    const supabase = await createServerClient()

    let dbQuery = supabase
      .from('product')
      .select('id, name, image_url, is_active')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(limit)

    if (query.trim()) {
      dbQuery = dbQuery.ilike('name', `%${query.trim()}%`)
    }

    const { data: products, error } = await dbQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      products: (products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        image: p.image_url || null
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

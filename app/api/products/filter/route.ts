import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const supabase = await createClient()

    let query = supabase
      .from('product')
      .select('id, name')
      .order('name', { ascending: true })
      .limit(limit)

    if (search.trim()) {
      query = query.ilike('name', `%${search.trim()}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      products: (data || []).map((p: any) => ({ id: p.id, name: p.name || 'Unnamed Product' }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

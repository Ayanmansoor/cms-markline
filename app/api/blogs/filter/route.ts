import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const exclude = searchParams.get('exclude') || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

    const supabase = await createClient()

    let query = supabase
      .from('blogs')
      .select('id, title')
      .order('title', { ascending: true })
      .limit(limit)

    if (search.trim()) {
      query = query.ilike('title', `%${search.trim()}%`)
    }

    // Exclude current blog from its own related list
    if (exclude) {
      const excludeId = parseInt(exclude)
      if (!isNaN(excludeId)) {
        query = query.neq('id', excludeId)
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      blogs: (data || []).map((b: any) => ({ id: b.id, title: b.title || 'Untitled Blog' }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

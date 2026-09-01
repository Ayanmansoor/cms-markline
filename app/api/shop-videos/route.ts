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
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const statusFilter = searchParams.get('status') || 'all' // all, active, inactive
    const search = searchParams.get('search') || ''
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await getSupabaseClient()

    let query = supabase
      .from('shop_videos')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (search) {
      query = query.ilike('internal_url', `%${search}%`)
    }

    const { data: videos, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      videos: videos || [],
      totalCount: count || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()
    const { internal_url, sort_order, is_active } = body

    if (!internal_url) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shop_videos')
      .insert({
        internal_url,
        sort_order: sort_order !== undefined && sort_order !== null ? parseInt(sort_order) : 0,
        is_active: is_active === true || is_active === 'true',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, video: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

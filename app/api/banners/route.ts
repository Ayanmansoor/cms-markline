import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const deviceFilter = searchParams.get('device') || 'all' // all, mobile, desktop
    const search = searchParams.get('search') || ''
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()

    let query = supabase
      .from('HomeBanner')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (deviceFilter === 'mobile') {
      query = query.eq('isMobile', true)
    } else if (deviceFilter === 'desktop') {
      query = query.eq('isMobile', false)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,url.ilike.%${search}%`)
    }

    const { data: banners, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      banners: banners || [],
      totalCount: count || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { name, image_url, url, slug, isMobile, isEnable } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('HomeBanner')
      .insert({
        name,
        image_url: image_url || null,
        url: url || null,
        slug: slug || null,
        isMobile: isMobile === true || isMobile === 'true',
        isEnable: isEnable === true || isEnable === 'true'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, banner: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

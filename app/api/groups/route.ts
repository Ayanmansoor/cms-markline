import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // 1. Fetch all groups sorted by index, then id
    const { data: groups, error: groupsError } = await supabase
      .from('group')
      .select('*')
      .order('index', { ascending: true })
      .order('id', { ascending: true })

    if (groupsError) {
      return NextResponse.json({ error: groupsError.message }, { status: 400 })
    }

    // 2. Fetch product counts for each group
    const mappedGroups = await Promise.all(
      (groups || []).map(async (g: any) => {
        const { count, error: countError } = await supabase
          .from('product')
          .select('*', { count: 'exact', head: true })
          .eq('grouptype', g.id)

        return {
          id: g.id,
          heading: g.heading || 'Unnamed Group',
          discription: g.discription || 'No description provided.',
          type: g.type || 'ALL',
          url: g.url || '',
          urlText: g.urlText || '',
          isActive: !!g.isActive,
          index: g.index !== null ? Number(g.index) : 0,
          created_at: g.created_at,
          productCount: count || 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      groups: mappedGroups
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { heading, discription, type, url, urlText, isActive, index } = body

    if (!heading) {
      return NextResponse.json({ error: 'Heading is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('group')
      .insert({
        heading,
        discription: discription || null,
        type: type || 'ALL',
        url: url || null,
        urlText: urlText || null,
        isActive: isActive !== undefined ? isActive : false,
        index: index !== undefined ? Number(index) : 0
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, group: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

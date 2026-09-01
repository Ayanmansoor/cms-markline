import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: banners, error } = await supabase
      .from('collectionBanner')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, banners: banners || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      image_url,
      name,
      url,
      gender,
      isMobile,
      isEnable,
      collection_id,
      home_promotional
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('collectionBanner')
      .insert({
        image_url: image_url || null,
        name,
        url: url || null,
        gender: gender || null,
        isMobile: isMobile ?? false,
        isEnable: isEnable ?? true,
        collection_id: collection_id ? parseInt(collection_id.toString(), 10) : null,
        home_promotional: home_promotional ?? false
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

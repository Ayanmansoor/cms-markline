import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const updatePayload: any = {}
    if (image_url !== undefined) updatePayload.image_url = image_url
    if (name !== undefined) updatePayload.name = name
    if (url !== undefined) updatePayload.url = url
    if (gender !== undefined) updatePayload.gender = gender
    if (isMobile !== undefined) updatePayload.isMobile = isMobile
    if (isEnable !== undefined) updatePayload.isEnable = isEnable
    if (collection_id !== undefined) {
      updatePayload.collection_id = collection_id ? parseInt(collection_id.toString(), 10) : null
    }
    if (home_promotional !== undefined) updatePayload.home_promotional = home_promotional

    const { data, error } = await supabase
      .from('collectionBanner')
      .update(updatePayload)
      .eq('id', id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('collectionBanner')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

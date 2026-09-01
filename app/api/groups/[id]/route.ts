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
    const { heading, discription, type, url, urlText, isActive, index } = body

    const updatePayload: any = {}
    if (heading !== undefined) updatePayload.heading = heading
    if (discription !== undefined) updatePayload.discription = discription
    if (type !== undefined) updatePayload.type = type
    if (url !== undefined) updatePayload.url = url
    if (urlText !== undefined) updatePayload.urlText = urlText
    if (isActive !== undefined) updatePayload.isActive = isActive
    if (index !== undefined) updatePayload.index = index !== null ? Number(index) : 0

    const { data, error } = await supabase
      .from('group')
      .update(updatePayload)
      .eq('id', id)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('group')
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

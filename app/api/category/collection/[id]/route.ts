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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()

    const { data: collection, error } = await supabase
      .from('collection')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, collection })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseClient()
    const body = await request.json()

    const {
      name,
      description,
      gender,
      slug,
      is_new_collection,
      seoDescription,
      seoTitle,
      is_show,
      type,
      banner_image,
      image_urls,
      keywords
    } = body

    const updatePayload: any = {}
    if (name !== undefined) updatePayload.name = name
    if (description !== undefined) updatePayload.description = description
    if (gender !== undefined) updatePayload.gender = gender
    if (slug !== undefined) updatePayload.slug = slug
    if (is_new_collection !== undefined) updatePayload.is_new_collection = is_new_collection
    if (seoDescription !== undefined) updatePayload.seoDescription = seoDescription
    if (seoTitle !== undefined) updatePayload.seoTitle = seoTitle
    if (is_show !== undefined) updatePayload.is_show = is_show
    if (type !== undefined) updatePayload.type = type
    if (banner_image !== undefined) updatePayload.banner_image = banner_image
    if (image_urls !== undefined) updatePayload.image_urls = image_urls
    if (keywords !== undefined) updatePayload.keywords = keywords

    const { data, error } = await supabase
      .from('collection')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, collection: data })
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
    const supabase = await getSupabaseClient()

    const { error } = await supabase
      .from('collection')
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

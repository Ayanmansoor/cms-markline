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

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    const { data: headers, error } = await supabase
      .from('header')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, headers: headers || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()
    const { text, color, isActive, url } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('header')
      .insert({
        text,
        color: color || null,
        isActive: isActive === true || isActive === 'true',
        url: url || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, header: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

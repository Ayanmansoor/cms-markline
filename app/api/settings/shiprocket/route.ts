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
    const { data: tokens, error } = await supabase
      .from('shiprocket_token')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, tokens: tokens || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient()
    const body = await request.json()
    const { token_value, expires_at } = body

    if (!token_value) {
      return NextResponse.json({ error: 'Token value is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('shiprocket_token')
      .insert({
        token_value,
        expires_at: expires_at || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const response = NextResponse.json({ success: true, token: data })
    response.cookies.set('shiprocket_token', token_value, { maxAge: 10 * 24 * 60 * 60, path: '/' })
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

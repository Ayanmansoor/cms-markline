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

export async function POST() {
  try {
    const email = process.env.SHIPROCKET_API_EMAIL
    const password = process.env.SHIPROCKET_API_PASSWORD

    if (!email || !password) {
      return NextResponse.json(
        { error: 'SHIPROCKET_API_EMAIL and SHIPROCKET_API_PASSWORD must be set in .env' },
        { status: 400 }
      )
    }

    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const authData = await authRes.json()

    if (!authRes.ok || !authData.token) {
      return NextResponse.json(
        { error: authData.message || 'Failed to authenticate with Shiprocket' },
        { status: authRes.status || 500 }
      )
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)

    const supabase = await getSupabaseClient()
    const { data, error } = await supabase
      .from('shiprocket_token')
      .insert({
        token_value: authData.token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const response = NextResponse.json({ success: true, token: data })
    response.cookies.set('shiprocket_token', authData.token, { maxAge: 10 * 24 * 60 * 60, path: '/' })
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

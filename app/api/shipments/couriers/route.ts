import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
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
    const cookieStore = await cookies()
    let token = cookieStore.get('shiprocket_token')?.value

    if (!token) {
      throw new Error('No Shiprocket token found');
    }

    // Call shiprocket courier list API
    const courierRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/courierListWithCounts', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })

    const courierData = await courierRes.json()

    if (!courierRes.ok) {
      return NextResponse.json({ error: courierData.message || 'Failed to fetch couriers from Shiprocket' }, { status: courierRes.status })
    }

    // Set cookie on response
    const response = NextResponse.json({ success: true, couriers: courierData })
    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

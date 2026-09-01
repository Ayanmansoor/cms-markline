import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMap } from '../helper'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: addresses, error } = await supabase
      .from('address')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userMap = await getUserMap()
    const addressesWithUsers = addresses?.map((addr: any) => {
      const user = userMap.get(addr.user_id) || { name: 'Guest Customer', email: 'guest@shopmarkline.com' }
      return {
        ...addr,
        customerName: user.name,
        customerEmail: user.email
      }
    }) || []

    return NextResponse.json({ success: true, addresses: addressesWithUsers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

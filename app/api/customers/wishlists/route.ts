import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMap } from '../helper'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: wishlists, error } = await supabase
      .from('wishlist')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const userMap = await getUserMap()
    const wishlistsWithUsers = wishlists?.map((item: any) => {
      const user = userMap.get(item.user_id) || { name: 'Guest Customer', email: 'guest@shopmarkline.com' }
      return {
        ...item,
        customerName: user.name,
        customerEmail: user.email
      }
    }) || []

    return NextResponse.json({ success: true, wishlists: wishlistsWithUsers })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

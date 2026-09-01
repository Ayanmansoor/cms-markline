import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserMap } from '../../helper'
import { sendCartReminderEmail } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { cartId, bulk } = body

    const supabase = await createClient()
    const userMap = await getUserMap()

    if (bulk) {
      // 1. Fetch all items in cart
      const { data: carts, error } = await supabase.from('cart').select('*')
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      if (!carts || carts.length === 0) {
        return NextResponse.json({ success: true, count: 0, message: "No active carts to notify" })
      }

      let count = 0
      for (const cart of carts) {
        const user = userMap.get(cart.user_id) || { name: 'Guest Customer', email: `guest-${cart.user_id.slice(0,8)}@shopmarkline.com` }
        // Trigger simulation
        await sendCartReminderEmail(
          user.email,
          cart.product_name || `Product ID: ${cart.product_id}`,
          cart.image_url || '',
          cart.variant_price || 0
        )
        count++
      }

      return NextResponse.json({ success: true, count, message: `Dispatched ${count} checkout reminder notifications successfully!` })
    } else {
      if (!cartId) {
        return NextResponse.json({ error: "cartId parameter is required for individual reminders" }, { status: 400 })
      }

      // 2. Fetch specific cart record
      const { data: cart, error } = await supabase
        .from('cart')
        .select('*')
        .eq('id', cartId)
        .single()

      if (error || !cart) {
        return NextResponse.json({ error: error?.message || "Cart item not found" }, { status: 400 })
      }

      const user = userMap.get(cart.user_id) || { name: 'Guest Customer', email: `guest-${cart.user_id.slice(0,8)}@shopmarkline.com` }

      await sendCartReminderEmail(
        user.email,
        cart.product_name || `Product ID: ${cart.product_id}`,
        cart.image_url || '',
        cart.variant_price || 0
      )

      return NextResponse.json({ success: true, message: `Reminder email successfully dispatched to ${user.email}.` })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Fetch order items to aggregate sales by product_id
    const { data: orderItems, error: itemsErr } = await supabase
      .from("order_items")
      .select("product_id, quantity, price, product(id, name, slug, product_variants(price, image_url))")

    if (itemsErr || !orderItems || orderItems.length === 0) {
      // Fallback: Fetch top 4 active products directly if no sales items logged yet
      const { data: activeProducts } = await supabase
        .from("products")
        .select("id, name, slug, product_variants(price, image_url)")
        .limit(4)

      const formatted = (activeProducts || []).map((p: any) => {
        const firstVariant = p.product_variants?.[0]
        const priceVal = firstVariant?.price ? `₹${Number(firstVariant.price).toFixed(2)}` : "₹0.00"
        let imgUrl = ""
        if (firstVariant?.image_url) {
          if (typeof firstVariant.image_url === "string") {
            try {
              const parsed = JSON.parse(firstVariant.image_url)
              imgUrl = parsed.url || parsed.image_url || firstVariant.image_url
            } catch {
              imgUrl = firstVariant.image_url
            }
          } else if (Array.isArray(firstVariant.image_url) && firstVariant.image_url.length > 0) {
            imgUrl = typeof firstVariant.image_url[0] === "string" ? firstVariant.image_url[0] : ""
          }
        }
        return {
          id: p.id,
          name: p.name,
          units: 0,
          price: priceVal,
          pct: "0%",
          imgUrl,
        }
      })

      return NextResponse.json({ success: true, products: formatted })
    }

    // Aggregate quantity and total sales per product_id
    const salesMap = new Map<number | string, { product: any; units: number; totalRevenue: number }>()

    orderItems.forEach((item: any) => {
      if (!item.product_id) return
      const existing = salesMap.get(item.product_id) || {
        product: item.product,
        units: 0,
        totalRevenue: 0,
      }
      existing.units += Number(item.quantity) || 1
      existing.totalRevenue += (Number(item.quantity) || 1) * (Number(item.price) || 0)
      salesMap.set(item.product_id, existing)
    })

    // Sort by highest units sold
    const sortedSales = Array.from(salesMap.values()).sort((a, b) => b.units - a.units)
    const topSales = sortedSales.slice(0, 4)
    const maxUnits = topSales.length > 0 ? topSales[0].units : 1

    const products = topSales.map((item) => {
      const p = item.product
      const firstVariant = p?.product_variants?.[0]
      const priceVal = firstVariant?.price ? `₹${Number(firstVariant.price).toFixed(2)}` : "₹0.00"
      let imgUrl = ""
      if (firstVariant?.image_url) {
        if (typeof firstVariant.image_url === "string") {
          try {
            const parsed = JSON.parse(firstVariant.image_url)
            imgUrl = parsed.url || parsed.image_url || firstVariant.image_url
          } catch {
            imgUrl = firstVariant.image_url
          }
        } else if (Array.isArray(firstVariant.image_url) && firstVariant.image_url.length > 0) {
          imgUrl = typeof firstVariant.image_url[0] === "string" ? firstVariant.image_url[0] : ""
        }
      }

      const pctVal = Math.round((item.units / maxUnits) * 100)

      return {
        id: p?.id,
        name: p?.name || "Product",
        units: item.units,
        price: priceVal,
        pct: `${pctVal}%`,
        imgUrl,
      }
    })

    return NextResponse.json({ success: true, products })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

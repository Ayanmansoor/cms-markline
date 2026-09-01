import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch products and their variants and brand names
    const { data: products, error } = await supabase
      .from('product')
      .select('id, name, brand_key, brands!brand_key(name), product_variants(id, stock)')

    if (error) {
      // Fallback if brand join constraint is missing in dev DB
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('product')
        .select('id, name, brand_key, product_variants(id, stock)')
      
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 })
      }
      return NextResponse.json(calculateAnalytics(fallbackData))
    }

    return NextResponse.json(calculateAnalytics(products))
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

function calculateAnalytics(products: any[]) {
  if (!products || products.length === 0) {
    return {
      success: true,
      stockAvailability: 0,
      trendData: []
    }
  }

  // 1. Stock Availability percentage:
  // Count variants that are in stock (stock > 0)
  let totalVariants = 0
  let inStockVariants = 0

  // For grouping by brand
  const brandStockMap: Record<string, { total: number; inStock: number }> = {}

  products.forEach((p) => {
    const brandName = p.brands?.name || 'Originals'
    const variants = p.product_variants || []
    
    if (!brandStockMap[brandName]) {
      brandStockMap[brandName] = { total: 0, inStock: 0 }
    }

    variants.forEach((v: any) => {
      totalVariants++
      brandStockMap[brandName].total++

      if (v.stock && v.stock > 0) {
        inStockVariants++
        brandStockMap[brandName].inStock++
      }
    })
  })

  const stockAvailability = totalVariants > 0 
    ? Math.round((inStockVariants / totalVariants) * 100) 
    : 0

  // Generate trend/comparison data for BarChart
  // Map each brand to its availability percentage
  const trendData = Object.entries(brandStockMap).map(([name, stats]) => {
    const availability = stats.total > 0
      ? Math.round((stats.inStock / stats.total) * 100)
      : 0
    return {
      name,
      availability
    }
  })

  return {
    success: true,
    stockAvailability,
    trendData
  }
}

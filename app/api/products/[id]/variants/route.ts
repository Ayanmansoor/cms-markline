import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()

    const { data: variants, error } = await supabase
      .from('product_variants')
      .select('id, sku, colors, sizes, stock, mrp, retail_price, image_url, is_active')
      .eq('products_id', parseInt(id))
      .eq('is_active', true)
      .order('retail_price', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Parse colors/sizes from _text array fields
    const parsed = (variants || []).map((v: any) => {
      let colors: string[] = []
      let sizes: string[] = []
      let imageUrl: string | null = null

      // Parse colors - stored as array of JSON strings like '{"name":"Black","hex":"#000000"}'
      if (v.colors && Array.isArray(v.colors)) {
        colors = v.colors.map((c: string) => {
          try {
            const parsed = JSON.parse(c)
            return parsed.name || c
          } catch {
            return c
          }
        })
      }

      // Parse sizes - stored as array of JSON strings like '{"size":"42","unit":"EU"}'
      if (v.sizes && Array.isArray(v.sizes)) {
        sizes = v.sizes.map((s: string) => {
          try {
            const parsed = JSON.parse(s)
            let sizeVal = parsed.size || ''
            let unitVal = parsed.unit || ''
            const sizeNum = parseInt(sizeVal)
            if (!isNaN(sizeNum) && sizeNum >= 30) {
              sizeVal = String(sizeNum - 30)
              unitVal = 'UK'
            }
            return sizeVal ? `${sizeVal} ${unitVal}`.trim() : s
          } catch {
            const sizeNum = parseInt(s)
            if (!isNaN(sizeNum) && sizeNum >= 30) {
              return `${sizeNum - 30} UK`
            }
            return s
          }
        })
      }

      // Parse first image
      if (v.image_url && Array.isArray(v.image_url) && v.image_url.length > 0) {
        try {
          const parsed = JSON.parse(v.image_url[0])
          imageUrl = parsed.image_url || null
        } catch {
          imageUrl = typeof v.image_url[0] === 'string' ? v.image_url[0] : null
        }
      }

      return {
        id: v.id,
        sku: v.sku || null,
        colors,
        sizes,
        mrp: parseFloat(v.mrp || '0'),
        retail_price: parseFloat(v.retail_price || '0'),
        stock: parseFloat(v.stock || '0'),
        imageUrl
      }
    })

    return NextResponse.json({
      success: true,
      variants: parsed
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

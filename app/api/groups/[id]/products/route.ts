import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Query products belonging to this group ID
    const { data: products, error } = await supabase
      .from('product')
      .select('*, brands!brand_key(name)')
      .eq('grouptype', parseInt(id))
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback in case brand_key foreign key constraint join fails on some dev configurations
      const { data: fallbackProds, error: fallbackError } = await supabase
        .from('product')
        .select('*')
        .eq('grouptype', parseInt(id))
        .order('created_at', { ascending: false })

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        products: fallbackProds || []
      })
    }

    return NextResponse.json({
      success: true,
      products: products || []
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

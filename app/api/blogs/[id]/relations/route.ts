import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const blogId = parseInt(id)
    const supabase = await createClient()

    // Fetch related products
    const { data: blogProducts, error: bpError } = await supabase
      .from('blog_products')
      .select('product_id')
      .eq('blog_id', blogId)

    if (bpError) {
      return NextResponse.json({ error: bpError.message }, { status: 400 })
    }

    // Fetch related blogs
    const { data: relatedBlogs, error: rbError } = await supabase
      .from('related_blogs')
      .select('related_blog_id')
      .eq('blog_id', blogId)

    if (rbError) {
      return NextResponse.json({ error: rbError.message }, { status: 400 })
    }

    const productIds = (blogProducts || []).map((r: any) => r.product_id)
    const relatedBlogIds = (relatedBlogs || []).map((r: any) => r.related_blog_id)

    // Fetch product names
    let related_products: { id: number; name: string }[] = []
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('product')
        .select('id, name')
        .in('id', productIds)
      related_products = (products || []).map((p: any) => ({ id: p.id, name: p.name || 'Unnamed Product' }))
    }

    // Fetch related blog titles
    let related_blogs: { id: number; title: string }[] = []
    if (relatedBlogIds.length > 0) {
      const { data: blogs } = await supabase
        .from('blogs')
        .select('id, title')
        .in('id', relatedBlogIds)
      related_blogs = (blogs || []).map((b: any) => ({ id: b.id, title: b.title || 'Untitled Blog' }))
    }

    return NextResponse.json({ success: true, related_products, related_blogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const blogId = parseInt(id)
    const body = await request.json()
    const { productIds = [], relatedBlogIds = [] } = body

    const supabase = await createClient()

    // ── Related Products ──────────────────────────────────────────────────────

    // Get current product links
    const { data: existingProducts } = await supabase
      .from('blog_products')
      .select('product_id')
      .eq('blog_id', blogId)

    const existingProductIds: number[] = (existingProducts || []).map((r: any) => r.product_id)
    const newProductIds: number[] = productIds.map((id: any) => parseInt(id))

    const productsToAdd = newProductIds.filter(pid => !existingProductIds.includes(pid))
    const productsToRemove = existingProductIds.filter(pid => !newProductIds.includes(pid))

    if (productsToRemove.length > 0) {
      await supabase
        .from('blog_products')
        .delete()
        .eq('blog_id', blogId)
        .in('product_id', productsToRemove)
    }

    if (productsToAdd.length > 0) {
      await supabase
        .from('blog_products')
        .insert(productsToAdd.map(pid => ({ blog_id: blogId, product_id: pid })))
    }

    // ── Related Blogs ─────────────────────────────────────────────────────────

    const { data: existingRelated } = await supabase
      .from('related_blogs')
      .select('related_blog_id')
      .eq('blog_id', blogId)

    const existingRelatedIds: number[] = (existingRelated || []).map((r: any) => r.related_blog_id)
    const newRelatedIds: number[] = relatedBlogIds.map((id: any) => parseInt(id))

    const blogsToAdd = newRelatedIds.filter(bid => !existingRelatedIds.includes(bid))
    const blogsToRemove = existingRelatedIds.filter(bid => !newRelatedIds.includes(bid))

    if (blogsToRemove.length > 0) {
      await supabase
        .from('related_blogs')
        .delete()
        .eq('blog_id', blogId)
        .in('related_blog_id', blogsToRemove)
    }

    if (blogsToAdd.length > 0) {
      await supabase
        .from('related_blogs')
        .insert(blogsToAdd.map(bid => ({ blog_id: blogId, related_blog_id: bid, tags: null })))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

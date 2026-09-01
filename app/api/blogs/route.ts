import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10
    const statusFilter = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const from = (page - 1) * limit
    const to = from + limit - 1

    const supabase = await createClient()

    let query = supabase
      .from('blogs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter.toUpperCase())
    }

    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    const { data: blogs, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const mappedBlogs = (blogs || []).map((blog: any) => {
      // Calculate dynamic SEO Score out of 100
      let seoScoreVal = 50
      if (blog.title && blog.title.length > 30 && blog.title.length < 70) seoScoreVal += 15
      if (blog.discription) seoScoreVal += 15
      if (blog.seoDescription) seoScoreVal += 10
      if (blog.image || blog.bannerImage) seoScoreVal += 10
      
      let seoScore = `${seoScoreVal}/100`
      let seoColor = 'text-emerald-500'
      let seoDot = 'bg-emerald-500'

      if (seoScoreVal < 60) {
        seoColor = 'text-red-500'
        seoDot = 'bg-red-500'
      } else if (seoScoreVal < 80) {
        seoColor = 'text-blue-500'
        seoDot = 'bg-blue-500'
      }

      // Map Status Color
      const status = blog.status || 'DRAFT'
      let statusColor = 'text-slate-600 bg-slate-100 border-slate-200'
      if (status === 'PUBLISHED') {
        statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200'
      } else if (status === 'SCHEDULED' || status === 'PENDING') {
        statusColor = 'text-blue-600 bg-blue-50 border-blue-200'
      }

      // Map dynamic Categories based on Title keywords
      const titleLower = (blog.title || '').toLowerCase()
      const categories = []
      if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('footwear')) {
        categories.push('FOOTWEAR')
      }
      if (titleLower.includes('tech') || titleLower.includes('material') || titleLower.includes('future')) {
        categories.push('TECH')
      }
      if (categories.length === 0) {
        categories.push('EDITORIAL')
      }

      // Formatted date
      const created = blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'N/A'

      return {
        id: blog.id,
        title: blog.title || 'Untitled Post',
        slug: blog.slug ? `/blog/${blog.slug}` : '/blog/untitled-post',
        image: blog.image || blog.bannerImage || null,
        categories,
        seoScore,
        seoColor,
        seoDot,
        status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        statusColor,
        created,
        lastUpdated: created // We use created as fallback since updated_at is not standard
      }
    })

    return NextResponse.json({
      success: true,
      blogs: mappedBlogs,
      totalCount: count || 0
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { title, slug, image, description, seoTitle, seoDescription, status, content, bannerImage } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('blogs')
      .insert({
        title,
        slug: slug || null,
        image: image || null,
        discription: description || null,
        seoDescription: seoDescription || null,
        status: status ? status.toUpperCase() : 'DRAFT',
        content: content || null,
        bannerImage: bannerImage || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, blog: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Missing blog ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

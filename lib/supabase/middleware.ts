import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublicRoute = pathname === "/login" || pathname.startsWith("/api/auth")

  // Fast path: if visiting a public route (like /login) and no Supabase auth cookies exist,
  // skip external Supabase network calls and client initialization entirely.
  const cookies = request.cookies.getAll()
  const hasSupabaseAuthCookie = cookies.some(c => c.name.startsWith('sb-') || c.name.includes('auth-token'))

  let supabaseResponse = NextResponse.next({
    request,
  })

  if (isPublicRoute && !hasSupabaseAuthCookie) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const hasNextAuthCookie = request.cookies.getAll().some(c => 
    c.name.includes('next-auth.session-token') || 
    c.name.includes('authjs.session-token')
  )

  if (
    !user &&
    !hasNextAuthCookie &&
    !isPublicRoute &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/static")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // If next-auth session exists and trying to access login page, redirect to dashboard
  if (hasNextAuthCookie && pathname === "/login") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // If user exists, check role from user_roles
  if (user && !pathname.startsWith("/_next") && !pathname.startsWith("/static")) {
    // Query user_roles table
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = roleData?.role === 'ADMIN'

    if (!isAdmin && !isPublicRoute) {
      // User is logged in but not an ADMIN, deny access to CMS
      // For now, redirect them to login or an unauthorized page
      // We will sign them out first so they can try another account
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(url)
    }

    if (isAdmin && pathname === "/login") {
      // If admin goes to login page, redirect to dashboard
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

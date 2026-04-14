import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  const pathname = request.nextUrl.pathname
  
  // BYPASS PWA AND STATIC FILES IMMEDIATELY
  const isPwaFile = pathname.endsWith('/manifest.json') || 
                    pathname.endsWith('/sw.js') || 
                    pathname.endsWith('.png') || 
                    pathname.endsWith('.ico')
  
  if (isPwaFile) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  // Refresh token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes based on authentication status
  const isLoginPage = pathname.startsWith('/login')
  const isEmployeePage = pathname.startsWith('/dashboard-karyawan')
  const isApiRoute = pathname.startsWith('/api')

  // Admin-only pages (everything under the (dashboard) route group)
  const adminOnlyPaths = ['/', '/karyawan', '/absensi', '/rekap-absensi', '/cuti', '/gaji', '/laporan']
  const isAdminPage = adminOnlyPaths.includes(pathname)

  // If not logged in and not on login page, redirect to login
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If logged in, check role for routing
  if (user && !isApiRoute) {
    // Lookup role using admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const { data: profile } = await supabaseAdmin
      .from('karyawan')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    const role = profile?.role || 'karyawan'
    const isAdmin = role === 'admin' || role === 'hr'

    // If on login page, redirect to appropriate dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = isAdmin ? '/' : '/dashboard'
      return NextResponse.redirect(url)
    }

    // If karyawan tries to access admin pages, redirect to employee dashboard
    if (!isAdmin && isAdminPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard-karyawan'
      return NextResponse.redirect(url)
    }

    // If admin tries to access employee dashboard, redirect to admin dashboard
    if (isAdmin && isEmployeePage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}


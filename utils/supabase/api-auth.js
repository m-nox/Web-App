import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function getApiAuthSession() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, profile: null }
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: profile } = await supabaseAdmin
    .from('karyawan')
    .select('role, id, email')
    .eq('email', user.email)
    .maybeSingle()

  return { user, profile }
}

export async function requireRole(allowedRoles = ['admin', 'hr']) {
  const { user, profile } = await getApiAuthSession()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user, profile, error: null }
}

export async function requireAuth() {
  const { user, profile } = await getApiAuthSession()
  if (!user) {
    return { error: 'Unauthorized', status: 401 }
  }
  return { user, profile, error: null }
}

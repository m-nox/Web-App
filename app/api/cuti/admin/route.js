import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
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

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is Admin/HR
    const { data: adminProfile } = await supabaseAdmin
      .from('karyawan')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all leave requests with employee details
    const { data: cuti, error } = await supabaseAdmin
      .from('pengajuan_cuti')
      .select(`
        *,
        karyawan:karyawan_id (
          nama_depan,
          nama_belakang,
          email
        )
      `)
      .order('status', { ascending: true }) // Pending first
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ data: cuti })
  } catch (err) {
    console.error('CUTI ADMIN GET ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request) {
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

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is Admin/HR
    const { data: adminProfile } = await supabaseAdmin
      .from('karyawan')
      .select('role')
      .eq('email', user.email)
      .maybeSingle()

    if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'hr')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, status, catatan_admin } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing ID or Status' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('pengajuan_cuti')
      .update({ status, catatan_admin })
      .eq('id', id)
      .select()

    if (error) throw error

    return NextResponse.json({ message: `Pengajuan cuti berhasil ${status.toLowerCase()}.`, data })
  } catch (err) {
    console.error('CUTI ADMIN PATCH ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Find Karyawan
  const { data: karyawan } = await supabaseAdmin
    .from('karyawan')
    .select('id')
    .eq('email', user.email)
    .maybeSingle()

  if (!karyawan) return NextResponse.json({ data: [] })

  // Get leave requests for this employee
  const { data: cuti, error } = await supabaseAdmin
    .from('pengajuan_cuti')
    .select('*')
    .eq('karyawan_id', karyawan.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: cuti })
}

export async function POST(request) {
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

    // Find Karyawan
    const { data: karyawan } = await supabaseAdmin
      .from('karyawan')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!karyawan) return NextResponse.json({ error: 'Profil karyawan tidak ditemukan.' }, { status: 404 })

    const body = await request.json()
    const { jenis_cuti, tanggal_mulai, tanggal_selesai, alasan } = body

    if (!jenis_cuti || !tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('pengajuan_cuti')
      .insert({
        karyawan_id: karyawan.id,
        jenis_cuti,
        tanggal_mulai,
        tanggal_selesai,
        alasan,
        status: 'Pending'
      })
      .select()

    if (error) throw error

    return NextResponse.json({ message: 'Pengajuan cuti berhasil dikirim.', data }, { status: 201 })
  } catch (err) {
    console.error('CUTI API ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

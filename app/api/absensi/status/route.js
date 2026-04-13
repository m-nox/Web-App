import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  // NEXT.JS 15+ REQUIRED AWAIT
  const cookieStore = await cookies()
  const headerList = await headers()

  try {
    // 1. Get Client IP
    let clientIp = headerList.get('x-forwarded-for')?.split(',')[0] || 
                   headerList.get('x-real-ip') || 
                   '127.0.0.1'
    if (clientIp.includes('::ffff:')) clientIp = clientIp.replace('::ffff:', '')
    
    const officeIp = process.env.OFFICE_IP
    const isAtOffice = clientIp === officeIp || clientIp === '127.0.0.1' || clientIp === '::1'

    // 2. Auth Check
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

    // 3. Find Karyawan (Admin Client)
    const { data: karyawan } = await supabaseAdmin
      .from('karyawan')
      .select('id, nama_depan, nama_belakang')
      .eq('email', user.email)
      .maybeSingle()

    if (!karyawan) {
      return NextResponse.json({ 
        error: 'Profil karyawan tidak ditemukan.', 
        email: user.email 
      }, { status: 404 })
    }

    // 4. Get Today's Attendance
    const today = new Date().toLocaleDateString('en-CA')
    const { data: attendance } = await supabaseAdmin
      .from('absensi')
      .select('*')
      .eq('karyawan_id', karyawan.id)
      .eq('tanggal', today)
      .maybeSingle()

    return NextResponse.json({
      karyawan,
      attendance,
      clientIp,
      officeIp: officeIp || 'NOT_SET',
      isAtOffice
    })
  } catch (err) {
    console.error('STATUS API ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

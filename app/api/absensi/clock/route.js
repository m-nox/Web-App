import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getClientIp, checkIsAtOffice } from '@/utils/supabase/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const cookieStore = await cookies()

  try {
    // 1. IP Verification (centralized, supports IPv6 prefix)
    const clientIp = await getClientIp()
    const isAtOffice = checkIsAtOffice(clientIp)

    if (!isAtOffice) {
      return NextResponse.json({ error: `Absensi hanya dapat dilakukan di jaringan kantor. (IP: ${clientIp})` }, { status: 403 })
    }

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
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!karyawan) return NextResponse.json({ error: 'Profil karyawan tidak ditemukan.' }, { status: 404 })

    // Get current time in Jakarta (WIB - GMT+7)
    const jakartaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date())
    const jakartaTime = new Intl.DateTimeFormat('en-GB', { 
      timeZone: 'Asia/Jakarta', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    }).format(new Date())

    const today = jakartaDate
    const now = jakartaTime

    // 4. Check Existing record (Admin Client)
    const { data: attendance } = await supabaseAdmin
      .from('absensi')
      .select('*')
      .eq('karyawan_id', karyawan.id)
      .eq('tanggal', today)
      .maybeSingle()

    if (!attendance) {
      // CLOCK IN
      const isLate = now > '08:03:00'
      const { error } = await supabaseAdmin
        .from('absensi')
        .insert({
          karyawan_id: karyawan.id,
          tanggal: today,
          jam_masuk: now,
          status: 'Hadir',
          terlambat: isLate
        })
      if (error) throw error
      return NextResponse.json({ 
        message: isLate ? 'Absen masuk berhasil. (Terlambat)' : 'Absen masuk berhasil.', 
        type: 'in' 
      })
    } else if (!attendance.jam_keluar) {
      // CLOCK OUT
      // Time restriction: Only allow clock-out after 17:03:00
      if (now < '17:03:00') {
        return NextResponse.json({ 
          error: 'Belum waktunya jam pulang. Absen keluar hanya diizinkan setelah pukul 17:03.' 
        }, { status: 403 })
      }

      const { error } = await supabaseAdmin
        .from('absensi')
        .update({ jam_keluar: now })
        .eq('id', attendance.id)
      if (error) throw error
      return NextResponse.json({ message: 'Absen keluar berhasil.', type: 'out' })
    } else {
      return NextResponse.json({ error: 'Anda sudah melakukan absensi keluar hari ini.' }, { status: 400 })
    }
  } catch (err) {
    console.error('CLOCK API ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

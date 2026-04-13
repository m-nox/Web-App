import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // 1-12
    const year = searchParams.get('year')   // 2024, 2025...
    const date = searchParams.get('date')   // YYYY-MM-DD for daily recap

    // 1. Get all employees
    const { data: karyawanList, error: kError } = await supabaseAdmin
      .from('karyawan')
      .select('id, nama_depan, nama_belakang, email')
    
    if (kError) throw kError

    // 2. Build attendance query
    let query = supabaseAdmin.from('absensi').select('*')
    
    if (date) {
      query = query.eq('tanggal', date)
    } else {
      if (year) {
        // Simple string comparison for year
        query = query.gte('tanggal', `${year}-01-01`).lte('tanggal', `${year}-12-31`)
      }
      if (month && year) {
          const lastDay = new Date(year, month, 0).getDate()
          const monthStr = month.padStart(2, '0')
          query = supabaseAdmin.from('absensi')
            .select('*')
            .gte('tanggal', `${year}-${monthStr}-01`)
            .lte('tanggal', `${year}-${monthStr}-${lastDay}`)
      }
    }

    const { data: attendanceData, error: aError } = await query
    if (aError) throw aError

    // 3. Aggregate data per employee
    const recap = karyawanList.map(emp => {
      const logs = attendanceData.filter(a => a.karyawan_id === emp.id)
      return {
        id: emp.id,
        nama: `${emp.nama_depan} ${emp.nama_belakang || ''}`.trim(),
        email: emp.email,
        stats: {
          hadir: logs.filter(l => l.status === 'Hadir').length,
          izin: logs.filter(l => l.status === 'Izin').length,
          sakit: logs.filter(l => l.status === 'Sakit').length,
          alpa: logs.filter(l => l.status === 'Alpa').length,
          terlambat: logs.filter(l => l.terlambat).length,
          total: logs.length
        }
      }
    })

    return NextResponse.json({ data: recap })
  } catch (err) {
    console.error('RECAP ERROR:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireRole } from '@/utils/supabase/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    // Fetch total employees
    const { count: totalKaryawan, error: err1 } = await supabaseAdmin
      .from('karyawan')
      .select('*', { count: 'exact', head: true })

    // Fetch active attendance for today (simplified)
    const today = new Date().toISOString().split('T')[0]
    const { count: hadirToday, error: err2 } = await supabaseAdmin
      .from('absensi')
      .select('*', { count: 'exact', head: true })
      .eq('tanggal', today)
      .eq('status', 'Hadir')

    // Fetch pending leaves
    const { count: pendingCuti, error: err3 } = await supabaseAdmin
      .from('cuti')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')

    if (err1 || err2 || err3) {
      console.error('Stats fetch error:', err1 || err2 || err3)
    }

    return NextResponse.json({
      totalKaryawan: totalKaryawan || 0,
      hadirToday: hadirToday || 0,
      pendingCuti: pendingCuti || 0
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireRole } from '@/utils/supabase/api-auth'

// Service role client to bypass RLS for Admin fetching
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = supabaseAdmin
      .from('gaji')
      .select(`
        *,
        karyawan!karyawan_id (
          nama_depan,
          nama_belakang,
          jabatan:jabatan_id (
            nama_jabatan
          )
        )
      `);

    // Add filtering if provided
    if (month && year) {
      // Construction of date string to avoid timezone shifts
      const monthStr = String(month).padStart(2, '0');
      const normalizedDate = `${year}-${monthStr}-01`;
      query = query.eq('periode_gaji', normalizedDate);
    }

    const { data, error } = await query.order('periode_gaji', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

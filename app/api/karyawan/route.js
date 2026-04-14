import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireRole } from '@/utils/supabase/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  let query = supabaseAdmin
    .from('karyawan')
    .select(`
      *,
      jabatan!jabatan_id ( nama_jabatan ),
      departemen!departemen_id ( nama_departemen )
    `)
    .order('nama_depan', { ascending: true })

  if (email) {
    query = query.eq('email', email)
  }

  const { data: karyawan, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ data: karyawan })
}

export async function POST(request) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const body = await request.json()
    const { email, nama_depan, nama_belakang, role, password } = body
    const finalPassword = password || 'Hris123!'
    
    // 1. Create Supabase Auth User Automatically
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${nama_depan} ${nama_belakang || ''}`.trim()
      }
    })

    if (authError) {
      return NextResponse.json({ error: `Gagal membuat akun Auth: ${authError.message}` }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Create Employee Record linked to the new Auth User
    const employeeData = {
      ...body,
      id: userId, // Use the Auth UID as the employee ID for RLS compatibility
      role: role || 'karyawan',
      password: finalPassword
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('karyawan')
      .insert([employeeData])
      .select()

    if (dbError) {
      // Cleanup: remove the auth user if DB insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Gagal membuat profil karyawan: ${dbError.message}` }, { status: 400 })
    }
    
    return NextResponse.json({ 
      message: 'Karyawan dan Akun Login berhasil dibuat.', 
      data: data,
      credentials: {
        email: email,
        password: 'Hris123!'
      }
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { ids } = await request.json()
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Array ID diperlukan' }, { status: 400 })
    }

    // 1. Delete from Supabase Auth (Bulk)
    // Note: admin.deleteUser doesn't support bulk, so we loop but keep it server-side
    // This is the "burden" the user wants to avoid on the client, but it must happen server-side
    const deletePromises = ids.map(id => supabaseAdmin.auth.admin.deleteUser(id))
    await Promise.all(deletePromises)

    // 2. Delete from Database (Bulk)
    const { error } = await supabaseAdmin
      .from('karyawan')
      .delete()
      .in('id', ids)

    if (error) {
      return NextResponse.json({ error: `Gagal hapus data DB: ${error.message}` }, { status: 400 })
    }
    
    return NextResponse.json({ message: `${ids.length} Karyawan berhasil dihapus secara massal` })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

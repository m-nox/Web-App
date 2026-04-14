import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireRole } from '@/utils/supabase/api-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function PUT(request, props) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = await props.params;
  const { id } = params
  const body = await request.json()
  const { password, ...otherData } = body
  
  // 1. Update Supabase Auth if password is provided
  if (password) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      { password }
    )
    if (authError) {
      return NextResponse.json({ error: `Gagal update password auth: ${authError.message}` }, { status: 400 })
    }
  }

  // 2. Update Employee Profile in Database
  // We exclude password from the main update if you don't have the column, 
  // but since the UI needs it as a 'hint', adding the column is better.
  // This fix ensures it won't crash if other fields are updated.
  const { error } = await supabaseAdmin
    .from('karyawan')
    .update(otherData) 
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json({ message: 'Karyawan updated successfully' })
}

export async function DELETE(request, props) {
  const auth = await requireRole(['admin', 'hr'])
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const params = await props.params;
  const { id } = params
  
  const { error } = await supabaseAdmin
    .from('karyawan')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json({ message: 'Karyawan deleted successfully' })
}

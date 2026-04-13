require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = `
CREATE TABLE IF NOT EXISTS public.pengajuan_cuti (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  karyawan_id uuid REFERENCES public.karyawan(id) ON DELETE CASCADE,
  jenis_cuti text NOT NULL,
  tanggal_mulai date NOT NULL,
  tanggal_selesai date NOT NULL,
  alasan text,
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Disetujui', 'Ditolak')),
  catatan_admin text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pengajuan_cuti ENABLE ROW LEVEL SECURITY;

-- Note: We rely on the service role for now, or the user can add policies later.
-- But let's add basic ones for the test.
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Karyawan can view own leave requests') THEN
    CREATE POLICY "Karyawan can view own leave requests" ON public.pengajuan_cuti FOR SELECT USING (auth.uid() = karyawan_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Karyawan can insert own leave requests') THEN
    CREATE POLICY "Karyawan can insert own leave requests" ON public.pengajuan_cuti FOR INSERT WITH CHECK (auth.uid() = karyawan_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can do everything on leave requests') THEN
    CREATE POLICY "Admin can do everything on leave requests" ON public.pengajuan_cuti FOR ALL USING (
      EXISTS (SELECT 1 FROM public.karyawan WHERE id = auth.uid() AND (role = 'admin' OR role = 'hr'))
    );
  END IF;
END $$;
`;

async function main() {
  console.log('Attempting to execute SQL via RPC exec_sql...');
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.error('Error executing SQL:', error);
    console.log('\n--- IMPORTANT ---');
    console.log('If you see "function exec_sql() does not exist", please run the SQL manually in the Supabase Dashboard.');
    console.log('SQL to run:\n', sql);
  } else {
    console.log('Success! Table and policies set up.');
  }
}

main();

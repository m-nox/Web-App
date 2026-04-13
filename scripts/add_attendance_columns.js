
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

if (fs.existsSync('.env.local')) {
  const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Adding columns to gaji table...');
  
  // We'll try to use a dummy upsert to trigger column creation in some cases, 
  // but better is a direct SQL approach if possible.
  // Since we can't do direct SQL easily without exec_sql, 
  // we will try to RUN a migration if we have access to a tool, 
  // or just inform the user.
  
  // Actually, I'll try to use the 'exec_sql' RPC which might exist now 
  // if prior turns added it.
  
  const sql = `
    ALTER TABLE gaji ADD COLUMN IF NOT EXISTS jumlah_izin INTEGER DEFAULT 0;
    ALTER TABLE gaji ADD COLUMN IF NOT EXISTS jumlah_sakit INTEGER DEFAULT 0;
    ALTER TABLE gaji ADD COLUMN IF NOT EXISTS jumlah_cuti INTEGER DEFAULT 0;
    ALTER TABLE gaji ADD COLUMN IF NOT EXISTS jumlah_terlambat_menit INTEGER DEFAULT 0;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Error adding columns:', error.message);
    console.log('If exec_sql is missing, please run this SQL manually in Supabase Dashboard:');
    console.log(sql);
  } else {
    console.log('Columns added successfully.');
  }
}

run();

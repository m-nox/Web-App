const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedBankData() {
  console.log('Seeding Bank Data for Employees...');
  
  // Get all employees
  const { data: employees, error: fetchError } = await supabase
    .from('karyawan')
    .select('id, nama_depan');

  if (fetchError) {
    console.error('Error fetching employees:', fetchError);
    return;
  }

  const banks = ['BCA', 'Mandiri', 'BNI', 'BRI'];

  for (const emp of employees) {
    const randomBank = banks[Math.floor(Math.random() * banks.length)];
    const randomAccount = Math.floor(Math.random() * 900000000) + 100000000; // 9 digits

    const { error: updateError } = await supabase
      .from('karyawan')
      .update({ 
        nama_bank: randomBank,
        nomor_rekening: randomAccount.toString()
      })
      .eq('id', emp.id);
    
    if (updateError) {
      console.error(`Error updating ${emp.nama_depan}:`, updateError.message);
    } else {
      console.log(`✅ ${emp.nama_depan} set to ${randomBank} (${randomAccount})`);
    }
  }
}

seedBankData();

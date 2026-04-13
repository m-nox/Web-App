const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedMatrixGaji() {
  const matrix = [
    { 
      name: 'Senior Software Engineer', 
      salary: 20000000, 
      tunjangan_jabatan: 5000000, 
      tunjangan_keluarga: 2000000 
    },
    { 
      name: 'Software Engineer', 
      salary: 10000000, 
      tunjangan_jabatan: 2000000, 
      tunjangan_keluarga: 1000000 
    },
    { 
      name: 'Product Manager', 
      salary: 15000000, 
      tunjangan_jabatan: 4000000, 
      tunjangan_keluarga: 1500000 
    },
    { 
      name: 'HR Specialist', 
      salary: 12000000, 
      tunjangan_jabatan: 3000000, 
      tunjangan_keluarga: 1200000 
    },
    { 
      name: 'Accountant', 
      salary: 12000000, 
      tunjangan_jabatan: 3000000, 
      tunjangan_keluarga: 1200000 
    },
  ];

  console.log('Seeding Salary Matrix...');

  for (const item of matrix) {
    const { error } = await supabase
      .from('jabatan')
      .update({ 
        gaji_pokok: item.salary,
        tunjangan_jabatan: item.tunjangan_jabatan,
        tunjangan_keluarga: item.tunjangan_keluarga
      })
      .eq('nama_jabatan', item.name);
    
    if (error) {
      console.error(`Error updating ${item.name}:`, error.message);
    } else {
      console.log(`✅ ${item.name}: GP=${item.salary}, TJ=${item.tunjangan_jabatan}, TK=${item.tunjangan_keluarga}`);
    }
  }
}

seedMatrixGaji();

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPayrollLogic() {
  const period_date = '2026-04-28';
  console.log('--- Uji Coba Kalkulasi Payroll ---');
  console.log(`Periode: ${period_date}`);

  const payday = new Date(period_date);
  const year = payday.getFullYear();
  const month = payday.getMonth(); 
  const startDate = new Date(year, month - 1, 21);
  const endDate = new Date(year, month, 20);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const { data: employees, error: empError } = await supabase
      .from('karyawan')
      .select('*, jabatan(*)');

    if (empError) throw empError;

    console.log(`Ditemukan ${employees.length} karyawan.`);

    for (const emp of employees) {
      if (!emp.jabatan) {
        console.log(`Skipping ${emp.nama_depan}: Jabatan tidak ditemukan.`);
        continue;
      }

      const gaji_pokok = parseFloat(emp.jabatan.gaji_pokok || 0);
      const tunjangan_jabatan = parseFloat(emp.jabatan.tunjangan_jabatan || 0);
      const tunjangan_keluarga = parseFloat(emp.jabatan.tunjangan_keluarga || 0);
      
      const { data: attendance, error: attError } = await supabase
        .from('absensi')
        .select('*')
        .eq('karyawan_id', emp.id)
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr);

      if (attError) throw attError;

      const totalHadir = attendance.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
      const totalTerlambat = attendance.filter(a => a.status === 'Terlambat').length;

      const tunjanganMakan = totalHadir * 30000;
      const tunjanganTransport = totalHadir * 20000;
      const potonganTerlambat = totalTerlambat * 10000;
      
      const bpjsKS = gaji_pokok * 0.01;
      const bpjsTK = gaji_pokok * 0.02;
      
      const grossIncome = gaji_pokok + tunjangan_jabatan + tunjangan_keluarga + tunjanganMakan + tunjanganTransport;
      const taxableIncome = grossIncome - (bpjsKS + bpjsTK);
      const pph21 = taxableIncome > 5000000 ? taxableIncome * 0.05 : 0;

      const totalGaji = grossIncome - (bpjsKS + bpjsTK + pph21 + potonganTerlambat);

      const payrollData = {
        karyawan_id: emp.id,
        periode_gaji: period_date,
        gaji_pokok,
        tunjangan_jabatan,
        tunjangan_keluarga,
        tunjangan_makan: tunjanganMakan,
        tunjangan_transport: tunjanganTransport,
        tunjangan: tunjanganMakan + tunjanganTransport + tunjangan_jabatan + tunjangan_keluarga,
        potongan: bpjsKS + bpjsTK + pph21 + potonganTerlambat,
        total_gaji: totalGaji,
        jumlah_hadir: totalHadir,
        jumlah_terlambat: totalTerlambat,
        potongan_bpjs_ks: bpjsKS,
        potongan_bpjs_tk: bpjsTK,
        pajak_pph21: pph21,
        nama_bank: emp.nama_bank || '-',
        nomor_rekening: emp.nomor_rekening || '-',
        status_pembayaran: 'Pending'
      };

      console.log(`\nMenghitung untuk: ${emp.nama_depan}`);
      console.log(`- Gaji Pokok: ${gaji_pokok}`);
      console.log(`- Tj. Jabatan: ${tunjangan_jabatan}`);
      console.log(`- Kehadiran: ${totalHadir} Hari`);
      console.log(`- Total Gaji Bersih: ${totalGaji.toLocaleString('id-ID')}`);

      // Use upsert or fallback to simple insert if the constraint isn't ready
      const { error: upsertError } = await supabase
        .from('gaji')
        .upsert(payrollData, { onConflict: 'karyawan_id, periode_gaji' });

      if (upsertError) {
        console.warn(`Upsert failed, falling back to simple insert for ${emp.nama_depan}:`, upsertError.message);
        const { error: insertError } = await supabase.from('gaji').insert(payrollData);
        if (insertError) console.error(`Insert failed for ${emp.nama_depan}:`, insertError.message);
        else console.log(`✅ ${emp.nama_depan} payroll registered (insert fallback).`);
      } else {
        console.log(`✅ ${emp.nama_depan} payroll registered (upsert).`);
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testPayrollLogic();

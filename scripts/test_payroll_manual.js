const { createClient } = require('@supabase/supabase-js');
const { PAYROLL_CONFIG } = require('../utils/payroll-constants'); // Path adjustment if needed
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function countWorkingDays(start, end) {
  let count = 0;
  let curDate = new Date(start.getTime());
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

function getMinutesLate(jamMasuk) {
  if (!jamMasuk) return 0;
  const [h, m, s] = jamMasuk.split(':').map(Number);
  const [oh, om, os] = PAYROLL_CONFIG.ATTENDANCE.OFFICE_START_TIME.split(':').map(Number);
  const entryMinutes = h * 60 + m;
  const officeMinutes = oh * 60 + om;
  return Math.max(0, entryMinutes - officeMinutes);
}

async function runTestPayroll(period_date) {
  console.log(`Starting Test Payroll for period: ${period_date}`);
  
  const payday = new Date(period_date);
  const year = payday.getFullYear();
  const month = payday.getMonth();
  const startDate = new Date(year, month - 1, PAYROLL_CONFIG.CUT_OFF.START_DAY);
  const endDate = new Date(year, month, PAYROLL_CONFIG.CUT_OFF.END_DAY);
  const totalWorkingDays = countWorkingDays(startDate, endDate);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log(`Period Range: ${startDateStr} to ${endDateStr} (${totalWorkingDays} working days)`);

  const { data: employees, error: empError } = await supabase
    .from('karyawan')
    .select('*, jabatan(*)');

  if (empError) throw empError;

  let totalDisbursement = 0;
  const results = [];

  for (const emp of employees) {
    const gaji_pokok = parseFloat(emp.jabatan?.gaji_pokok || 0);
    const tunjangan_jabatan = parseFloat(emp.jabatan?.tunjangan_jabatan || 0);
    const tunjangan_keluarga = parseFloat(emp.jabatan?.tunjangan_keluarga || 0);
    
    const { data: attendance, error: attError } = await supabase
      .from('absensi')
      .select('*')
      .eq('karyawan_id', emp.id)
      .gte('tanggal', startDateStr)
      .lte('tanggal', endDateStr);

    if (attError) throw attError;

    let totalDaysForMakan = 0;
    let totalDaysForTransport = 0;
    let totalTerlambat = 0;
    let totalHadirCount = 0;

    attendance.forEach(record => {
      if (record.status === 'Hadir' || record.status === 'Terlambat') {
        totalHadirCount++;
        const minutesLate = getMinutesLate(record.jam_masuk);
        if (record.status === 'Terlambat') totalTerlambat++;
        
        if (record.status === 'Hadir') {
          totalDaysForMakan++;
          totalDaysForTransport++;
        } else if (record.status === 'Terlambat') {
          if (minutesLate <= PAYROLL_CONFIG.ATTENDANCE.LATE_THRESHOLD_MINUTES) {
            totalDaysForMakan++;
          }
        }
      }
    });

    const { data: leaves } = await supabase
      .from('cuti')
      .select('*')
      .eq('karyawan_id', emp.id)
      .eq('status', 'Approved')
      .gte('tanggal_mulai', startDateStr)
      .lte('tanggal_mulai', endDateStr);

    const leaveDaysCount = (leaves || []).length;
    const jumlahAlfa = Math.max(0, totalWorkingDays - (totalHadirCount + leaveDaysCount));
    
    const potonganAlfa = jumlahAlfa * PAYROLL_CONFIG.RATES.POTONGAN_ALFA;
    const tunjanganMakan = totalDaysForMakan * PAYROLL_CONFIG.RATES.TUNJANGAN_MAKAN;
    const tunjanganTransport = totalDaysForTransport * PAYROLL_CONFIG.RATES.TUNJANGAN_TRANSPORT;
    const potonganTerlambat = totalTerlambat * PAYROLL_CONFIG.RATES.POTONGAN_TERLAMBAT;
    
    const bpjsKS = gaji_pokok * PAYROLL_CONFIG.BPJS.KESEHATAN_EMPLOYEE;
    const bpjsTK = gaji_pokok * PAYROLL_CONFIG.BPJS.KETENAGAKERJAAN_JHT_EMPLOYEE;
    
    const grossIncome = gaji_pokok + tunjangan_jabatan + tunjangan_keluarga + tunjanganMakan + tunjanganTransport;
    const taxableMonth = Math.max(0, grossIncome - PAYROLL_CONFIG.TAX.PTKP_BULANAN - (bpjsKS + bpjsTK));
    const pph21 = taxableMonth * PAYROLL_CONFIG.TAX.TARIFF_PROGRESSIVE_1;

    const totalPotongan = bpjsKS + bpjsTK + pph21 + potonganTerlambat + potonganAlfa;
    const totalGaji = Math.max(0, grossIncome - totalPotongan);

    const payrollData = {
      karyawan_id: emp.id,
      periode_gaji: period_date,
      gaji_pokok,
      tunjangan_jabatan,
      tunjangan_keluarga,
      tunjangan_makan: tunjanganMakan,
      tunjangan_transport: tunjanganTransport,
      tunjangan: tunjangan_jabatan + tunjangan_keluarga + tunjanganMakan + tunjanganTransport,
      potongan: totalPotongan,
      total_gaji: totalGaji,
      jumlah_hadir: totalHadirCount,
      jumlah_terlambat: totalTerlambat,
      jumlah_alfa: jumlahAlfa,
      potongan_alfa: potonganAlfa,
      potongan_bpjs_ks: bpjsKS,
      potongan_bpjs_tk: bpjsTK,
      pajak_pph21: pph21,
      nama_bank: emp.nama_bank || '-',
      nomor_rekening: emp.nomor_rekening || '-',
      status_pembayaran: 'Pending'
    };

    const { error: upsertError } = await supabase
      .from('gaji')
      .upsert(payrollData, { onConflict: 'karyawan_id, periode_gaji' });

    if (upsertError) console.error(`Failed to upsert for ${emp.nama_depan}:`, upsertError.message);
    
    totalDisbursement += totalGaji;
    results.push({ name: emp.nama_depan, amount: totalGaji, alfa: jumlahAlfa, late: totalTerlambat });
  }

  console.log("\n--- TEST PAYROLL RESULTS ---");
  console.table(results);
  console.log(`\nTotal Disbursement: Rp ${totalDisbursement.toLocaleString('id-ID')}`);
}

runTestPayroll('2026-04-28').catch(console.error);

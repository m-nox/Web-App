import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { PAYROLL_CONFIG } from '@/utils/payroll-constants';

// Service role client to bypass RLS (avoid "infinite recursion" in policies)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to count working days (Mon-Fri) between two dates
function countWorkingDays(start, end) {
  let count = 0;
  let curDate = new Date(start.getTime());
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // 0=Sun, 6=Sat
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

// Helper to calculate minutes late
function getMinutesLate(jamMasuk) {
  if (!jamMasuk) return 0;
  const [h, m, s] = jamMasuk.split(':').map(Number);
  const [oh, om, os] = PAYROLL_CONFIG.ATTENDANCE.OFFICE_START_TIME.split(':').map(Number);
  
  const entryMinutes = h * 60 + m;
  const officeMinutes = oh * 60 + om;
  
  return Math.max(0, entryMinutes - officeMinutes);
}

export async function POST(request) {
  const { period_date } = await request.json(); 

  if (!period_date) {
    return NextResponse.json({ error: 'Periode gajian diperlukan' }, { status: 400 });
  }

  // 1. Verify Authentication & Role using Server Client (RLS enabled)
  const serverSupabase = await createServerClient();
  const { data: { user }, error: authError } = await serverSupabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if actual user is Admin/HR
  const { data: currentUser, error: userError } = await supabaseAdmin
    .from('karyawan')
    .select('role')
    .eq('email', user.email)
    .single();

  if (userError || !['admin', 'hr'].includes(currentUser?.role)) {
    return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
  }

  const payday = new Date(period_date);
  const year = payday.getFullYear();
  const month = payday.getMonth(); 

  // Normalize to 1st of the month to prevent duplicates in the same month
  // We use string interpolation to avoid timezone shifts common with Date.toISOString()
  const normalizedPeriod = `${year}-${String(month + 1).padStart(2, '0')}-01`;

  // Use Cut-off from Config
  const startDate = new Date(year, month - 1, PAYROLL_CONFIG.CUT_OFF.START_DAY);
  const endDate = new Date(year, month, PAYROLL_CONFIG.CUT_OFF.END_DAY);
  const totalWorkingDays = countWorkingDays(startDate, endDate);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    // 2. Perform actual logic using supabaseAdmin (Bypass RLS)
    const { data: employees, error: empError } = await supabaseAdmin
      .from('karyawan')
      .select('*, jabatan(*)');

    if (empError) throw empError;

    const results = [];
    let totalDisbursement = 0;

    for (const emp of employees) {
      const gaji_pokok = parseFloat(emp.jabatan?.gaji_pokok || 0);
      const tunjangan_jabatan = parseFloat(emp.jabatan?.tunjangan_jabatan || 0);
      const tunjangan_keluarga = parseFloat(emp.jabatan?.tunjangan_keluarga || 0);
      
      const nama_bank = emp.nama_bank || '-';
      const nomor_rekening = emp.nomor_rekening || '-';

      // 1. Fetch attendance
      const { data: attendance, error: attError } = await supabaseAdmin
        .from('absensi')
        .select('*')
        .eq('karyawan_id', emp.id)
        .gte('tanggal', startDateStr)
        .lte('tanggal', endDateStr);

      if (attError) throw attError;

      let totalDaysForMakan = 0;
      let totalDaysForTransport = 0;
      let totalTerlambat = 0;
      let totalHadirCount = 0; // For summary/info

      attendance.forEach(record => {
        // Rule: Must have both check-in and check-out to be considered "Present"
        // If either is missing, it is considered Alpha and will not increment totalHadirCount
        const isFullyPresent = (record.status === 'Hadir' || record.status === 'Terlambat') && 
                               record.jam_masuk && record.jam_pulang;

        if (isFullyPresent) {
          totalHadirCount++;
          const minutesLate = getMinutesLate(record.jam_masuk);
          
          if (record.status === 'Terlambat') {
            totalTerlambat++;
          }

          // Rule: If late > 30 mins, no transport AND no meal
          // Rule: If late <= 30 mins, no transport but GET meal
          // Rule: If on-time, GET both
          if (record.status === 'Hadir') {
            totalDaysForMakan++;
            totalDaysForTransport++;
          } else if (record.status === 'Terlambat') {
            if (minutesLate <= PAYROLL_CONFIG.ATTENDANCE.LATE_THRESHOLD_MINUTES) {
              totalDaysForMakan++; // Still get meal if < 30 mins
              // totalDaysForTransport remains same (0 for this day)
            }
            // If > 30 mins, both stay 0 for this day
          }
        }
      });

      // 2. Fetch approved leaves
      const { data: leaves, error: leaveError } = await supabaseAdmin
        .from('cuti')
        .select('*')
        .eq('karyawan_id', emp.id)
        .eq('status', 'Approved')
        .gte('tanggal_mulai', startDateStr)
        .lte('tanggal_mulai', endDateStr);

      if (leaveError) throw leaveError;
      
      let countCuti = 0;
      let countIzin = 0;
      let countSakit = 0;

      (leaves || []).forEach(l => {
        const type = (l.tipe_cuti || '').toLowerCase();
        if (type.includes('sakit')) countSakit++;
        else if (type.includes('izin')) countIzin++;
        else countCuti++;
      });
      
      const leaveDaysCount = countCuti + countIzin + countSakit;

      // 3. Calculate Alpha (Absence)
      const jumlahAlfa = Math.max(0, totalWorkingDays - (totalHadirCount + leaveDaysCount));
      const potonganAlfa = jumlahAlfa * PAYROLL_CONFIG.RATES.POTONGAN_ALFA;

      // 4. Detailed Calculations
      const tunjanganMakan = totalDaysForMakan * PAYROLL_CONFIG.RATES.TUNJANGAN_MAKAN;
      const tunjanganTransport = totalDaysForTransport * PAYROLL_CONFIG.RATES.TUNJANGAN_TRANSPORT;
      const potonganTerlambat = totalTerlambat * PAYROLL_CONFIG.RATES.POTONGAN_TERLAMBAT;
      
      const bpjsKS = gaji_pokok * PAYROLL_CONFIG.BPJS.KESEHATAN_EMPLOYEE;
      const bpjsTK = gaji_pokok * PAYROLL_CONFIG.BPJS.KETENAGAKERJAAN_JHT_EMPLOYEE;
      
      const fixedAllowances = tunjangan_jabatan + tunjangan_keluarga;
      const variableAllowances = tunjanganMakan + tunjanganTransport;
      const grossIncome = gaji_pokok + fixedAllowances + variableAllowances;
      
      // Simplified PPH21 with PTKP
      const taxableMonth = Math.max(0, grossIncome - PAYROLL_CONFIG.TAX.PTKP_BULANAN - (bpjsKS + bpjsTK));
      const pph21 = taxableMonth * PAYROLL_CONFIG.TAX.TARIFF_PROGRESSIVE_1;

      const totalPotongan = bpjsKS + bpjsTK + pph21 + potonganTerlambat + potonganAlfa;
      const totalGaji = Math.max(0, grossIncome - totalPotongan);

      const payrollData = {
        karyawan_id: emp.id,
        periode_gaji: normalizedPeriod,
        gaji_pokok,
        tunjangan_jabatan,
        tunjangan_keluarga,
        tunjangan_makan: tunjanganMakan,
        tunjangan_transport: tunjanganTransport,
        tunjangan: fixedAllowances + variableAllowances,
        potongan: totalPotongan,
        total_gaji: totalGaji,
        jumlah_hadir: totalHadirCount,
        jumlah_terlambat: totalTerlambat,
        jumlah_alfa: jumlahAlfa,
        jumlah_cuti: countCuti,
        jumlah_izin: countIzin,
        jumlah_sakit: countSakit,
        potongan_alfa: potonganAlfa,
        potongan_terlambat: potonganTerlambat,
        potongan_bpjs_ks: bpjsKS,
        potongan_bpjs_tk: bpjsTK,
        pajak_pph21: pph21,
        nama_bank,
        nomor_rekening,
        status_pembayaran: 'Pending'
      };

      const { error: upsertError } = await supabaseAdmin
        .from('gaji')
        .upsert(payrollData, { onConflict: 'karyawan_id, periode_gaji' });

      if (upsertError) {
        await supabaseAdmin.from('gaji').insert(payrollData);
      }
      
      totalDisbursement += totalGaji;
      results.push({ 
        name: `${emp.nama_depan} ${emp.nama_belakang || ''}`, 
        amount: totalGaji,
        status: 'Processed'
      });
    }

    return NextResponse.json({ 
      message: 'Automated Payroll Generated Successfully (Bypassed RLS Recursion)', 
      summary: {
        total_employees: employees.length,
        total_disbursement: totalDisbursement,
        period: `${startDateStr} to ${endDateStr}`
      },
      results 
    });

  } catch (error) {
    console.error('Error generating payroll:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Payroll Configuration Constants
 * Definisi tarif dan persentase untuk kalkulasi gaji HRIS.
 */

export const PAYROLL_CONFIG = {
  // Potongan Kehadiran
  RATES: {
    POTONGAN_ALFA: 100000,      // Potongan per hari tidak hadir (Alpha)
    POTONGAN_TERLAMBAT: 10000,  // Potongan per kejadian terlambat
    TUNJANGAN_MAKAN: 30000,      // Tunjangan per hari hadir
    TUNJANGAN_TRANSPORT: 30000,  // Tunjangan per hari hadir (jika tidak terlambat)
  },

  // Peraturan Kehadiran
  ATTENDANCE: {
    OFFICE_START_TIME: "08:00:00", // Jam masuk kantor standar
    LATE_THRESHOLD_MINUTES: 30,    // Batas keterlambatan untuk tunjangan makan
  },

  // Potongan Wajib (BPJS) - Persentase dari Gaji Pokok
  BPJS: {
    KESEHATAN_EMPLOYEE: 0.01,    // 1% dipotong dari karyawan
    KETENAGAKERJAAN_JHT_EMPLOYEE: 0.02, // 2% JHT dipotong dari karyawan
    // Opsional: Untuk info perusahaan jika diperlukan di masa depan
    KESEHATAN_EMPLOYER: 0.04,
    KETENAGAKERJAAN_JHT_EMPLOYER: 0.037,
  },

  // Peraturan Pajak (PPH21) - Sederhana
  TAX: {
    PTKP_BULANAN: 4500000, // Penghasilan Tidak Kena Pajak (Kategori TK/0: Rp 54jt/tahun)
    TARIFF_PROGRESSIVE_1: 0.05, // 5% untuk PKP sampai Rp 60jt/tahun
  },

  // Pengaturan Periode
  CUT_OFF: {
    START_DAY: 21,
    END_DAY: 20,
    PAYDAY: 28,
  }
};

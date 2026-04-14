'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Loader2,
  Calculator,
  FileText,
  Download,
  Wallet,
  History,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  Users,
  Filter,
  Calendar,
  Eye,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const COMPANY_INFO = {
  name: 'Liniswara',
  address: 'Gg. Dukuhan Baru, Sawah, Gunungsring, Kec. Muntilan\nKabupaten Magelang, Jawa Tengah 56415',
  signatures: {
    hr: { name: 'Rizky Minansyah Putri P.', title: 'Kepala Divisi HRGA' },
    finance: { name: 'Maya Yunita Dewi', title: 'Accounting' }
  }
};

function formatTerbilang(n) {
  if (n === 0) return "Nol Rupiah";
  const satuan = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];

  function konversi(v) {
    if (v < 12) return satuan[v];
    if (v < 20) return konversi(v - 10) + " Belas";
    if (v < 100) return konversi(Math.floor(v / 10)) + " Puluh " + konversi(v % 10);
    if (v < 200) return "Seratus " + konversi(v - 100);
    if (v < 1000) return konversi(Math.floor(v / 100)) + " Ratus " + konversi(v % 100);
    if (v < 2000) return "Seribu " + konversi(v - 1000);
    if (v < 1000000) return konversi(Math.floor(v / 1000)) + " Ribu " + konversi(v % 1000);
    if (v < 1000000000) return konversi(Math.floor(v / 1000000)) + " Juta " + konversi(v % 1000000);
    return "";
  }

  return (konversi(n) + " Rupiah").replace(/\s+/g, ' ').trim();
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [summary, setSummary] = useState(null);
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Filter States
  const [filterMonth, setFilterMonth] = useState((new Date().getMonth() + 1).toString());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const fetchPayrolls = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/payroll?month=${filterMonth}&year=${filterYear}`);
      const result = await response.json();
      if (response.ok) {
        setPayrolls(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  async function executePayroll() {
    setIsGenerating(true);
    setShowConfirm(false);

    // Default payday is 28th of current month
    // Use the selected filter month and year for generation
    const payday = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 28);
    const paydayStr = payday.toISOString().split('T')[0];

    try {
      const response = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period_date: paydayStr }),
      });

      const result = await response.json();
      if (response.ok) {
        setSummary(result.summary);
        fetchPayrolls();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Gagal generate payroll');
    } finally {
      setIsGenerating(false);
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('PAYROLL REPORT', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Period: ${filterMonth}/${filterYear}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID')}`, 14, 35);

    const tableColumn = ["Employee Name", "Position", "Bank", "Account No", "Net Salary"];
    const tableRows = payrolls.map(p => [
      `${p.karyawan?.nama_depan} ${p.karyawan?.nama_belakang || ''}`,
      p.karyawan?.jabatan?.nama_jabatan || '-',
      p.nama_bank || '-',
      p.nomor_rekening || '-',
      formatCurrency(p.total_gaji)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [37, 99, 235], textColor: 255 }, // Primary blue
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Payroll_Report_${filterMonth}_${filterYear}.pdf`);
  };

  const exportToExcel = () => {
    const worksheetData = payrolls.map(p => ({
      'Employee Name': `${p.karyawan?.nama_depan} ${p.karyawan?.nama_belakang || ''}`,
      'Position': p.karyawan?.jabatan?.nama_jabatan || '-',
      'Bank': p.nama_bank || '-',
      'Account No': p.nomor_rekening || '-',
      'Basic Salary': p.gaji_pokok,
      'Allowance': p.tunjangan,
      'Deduction': p.potongan,
      'Net Salary': p.total_gaji,
      'Status': p.status_pembayaran
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payroll Data");
    XLSX.writeFile(workbook, `Payroll_Data_${filterMonth}_${filterYear}.xlsx`);
  };

  const exportSlipToPDF = (p) => {
    const doc = new jsPDF();

    const logoUrl = '/logo.png';
    doc.addImage(logoUrl, 'PNG', 15, 10, 25, 25); // Increased size to 25x25 for better legibility of the 'Liniswara' text

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`SLIP GAJI KARYAWAN ${['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][filterMonth - 1]} ${filterYear}`, 105, 20, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const splitAddress = doc.splitTextToSize(COMPANY_INFO.address, 100);
    doc.text(splitAddress, 105, 26, { align: 'center' });


    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(15, 42, 195, 42);

    // Profile Section
    doc.setFontSize(9);
    doc.text('Nama     :', 15, 52);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.karyawan?.nama_depan} ${p.karyawan?.nama_belakang || ''}`, 35, 52);

    doc.setFont('helvetica', 'normal');
    doc.text('NIK         :', 15, 58);
    doc.text(p.karyawan?.id?.slice(0, 8).toUpperCase() || '-', 35, 58); // Using ID as NIK fallback

    doc.text('Rek         :', 15, 64);
    doc.text(`${p.nomor_rekening || '-'} (${p.nama_bank || 'BCA'})`, 35, 64);

    doc.text('Divisi      :', 120, 52);
    doc.text('Produksi', 140, 52); // Hardcoded Production like image

    doc.text('Jabatan  :', 120, 58);
    doc.text(p.karyawan?.jabatan?.nama_jabatan || '-', 140, 58);

    doc.text('Tanggal  :', 120, 64);
    doc.text(`${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, 64);

    // Table Content
    autoTable(doc, {
      startY: 72,
      head: [['NO.', 'KETERANGAN', 'JUMLAH']],
      body: [
        [{ content: 'PENDAPATAN', colSpan: 2, styles: { fontStyle: 'italic', font: 'helvetica' } }, ''],
        ['1', 'Gaji Pokok', { content: formatCurrency(p.gaji_pokok || 0), styles: { halign: 'right' } }],
        ['2', 'Tunjangan Jabatan', { content: formatCurrency(p.tunjangan_jabatan || 0), styles: { halign: 'right' } }],
        ['3', `Tunjangan Makan (Rp30.000/Hari)  =>  ${p.tunjangan_makan / 30000 || 0} Hari`, { content: formatCurrency(p.tunjangan_makan || 0), styles: { halign: 'right' } }],
        ['4', `Tunjangan Transport (Rp30.000/Hari)  =>  ${p.tunjangan_transport / 30000 || 0} Hari`, { content: formatCurrency(p.tunjangan_transport || 0), styles: { halign: 'right' } }],
        ['5', 'Tunjangan Kesehatan', { content: 'Rp -', styles: { halign: 'right' } }],
        ['6', 'Lembur Karyawan (Rp12.000/jam)', { content: 'Rp -', styles: { halign: 'right' } }],
        ['7', 'Tunjangan Lainnya', { content: formatCurrency(p.tunjangan_keluarga || 0), styles: { halign: 'right' } }],
        [{ content: 'Jumlah Pendapatan', colSpan: 2, styles: { halign: 'right', fontStyle: 'italic' } }, { content: formatCurrency(p.gaji_pokok + p.tunjangan_jabatan + p.tunjangan_makan + p.tunjangan_transport + p.tunjangan_keluarga), styles: { halign: 'right', fontStyle: 'bold' } }],
        
        [{ content: 'POTONGAN', colSpan: 2, styles: { fontStyle: 'italic' } }, ''],
        ['8', 'BPJS Kesehatan (1%)', { content: formatCurrency(p.potongan_bpjs_ks || 0), styles: { halign: 'right' } }],
        ['9', 'BPJS Ketenagakerjaan (2%)', { content: formatCurrency(p.potongan_bpjs_tk || 0), styles: { halign: 'right' } }],
        ['10', 'Pajak PPh21', { content: formatCurrency(p.pajak_pph21 || 0), styles: { halign: 'right' } }],
        ['11', 'Potongan Terlambat', { content: formatCurrency(p.potongan_terlambat || 0), styles: { halign: 'right' } }],
        ['12', `Potongan Absensi / Alpha (${p.jumlah_alfa || 0} Hari)`, { content: formatCurrency(p.potongan_alfa || 0), styles: { halign: 'right' } }],
        ['13', 'Pinjaman Karyawan', { content: 'Rp -', styles: { halign: 'right' } }],
        
        [{ content: 'Jumlah Potongan', colSpan: 2, styles: { halign: 'right', fontStyle: 'italic' } }, { content: formatCurrency((p.potongan_bpjs_ks || 0) + (p.potongan_bpjs_tk || 0) + (p.pajak_pph21 || 0) + (p.potongan_alfa || 0) + (p.potongan_terlambat || 0)), styles: { halign: 'right', fontStyle: 'bold' } }],
        [{ content: 'TOTAL GAJI YANG DITERIMA', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: formatCurrency(p.total_gaji), styles: { halign: 'right', fontStyle: 'bold', fontSize: 11 } }],
      ],
      styles: { fontSize: 8, cellPadding: 2, lineColor: [44, 62, 80], lineWidth: 0.1 },
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', halign: 'center' },
      columnStyles: {
        0: { width: 10, halign: 'center' },
        2: { width: 40 }
      },
      margin: { left: 15, right: 15 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TERBILANG  :', 15, finalY);
    doc.setFont('helvetica', 'italic');
    doc.text(formatTerbilang(p.total_gaji), 40, finalY);

    // Signatures
    const sigY = finalY + 15;
    doc.setFont('helvetica', 'normal');
    doc.text('Dibuat Oleh', 40, sigY, { align: 'center' });
    doc.text('Dibayar Oleh', 160, sigY, { align: 'center' });

    doc.setFont('helvetica', 'bold', 'underline');
    doc.text(COMPANY_INFO.signatures.hr.name, 40, sigY + 25, { align: 'center' });
    doc.text(COMPANY_INFO.signatures.finance.name, 160, sigY + 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(COMPANY_INFO.signatures.hr.title, 40, sigY + 30, { align: 'center' });
    doc.text(COMPANY_INFO.signatures.finance.title, 160, sigY + 30, { align: 'center' });

    // --- PAGE 2: ATTENDANCE REPORT ---
    doc.addPage();
    
    // Header Page 2
    doc.addImage(logoUrl, 'PNG', 15, 12, 20, 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN KEHADIRAN & KETEPATAN WAKTU', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][filterMonth - 1]} ${filterYear}`, 105, 26, { align: 'center' });
    
    doc.line(15, 35, 195, 35);

    // Attendance Info Table
    autoTable(doc, {
      startY: 45,
      head: [['KATEGORI KEHADIRAN', 'JUMLAH HARI / FREKUENSI']],
      body: [
        ['Hari Kerja Efektif', `${(p.jumlah_hadir || 0) + (p.jumlah_alfa || 0) + (p.jumlah_cuti || 0) + (p.jumlah_izin || 0) + (p.jumlah_sakit || 0)} Hari`],
        ['Hadir Tepat Waktu', `${(p.jumlah_hadir || 0) - (p.jumlah_terlambat || 0)} Hari`],
        ['Terlambat (Late Arrival)', `${p.jumlah_terlambat || 0} Kali`],
        ['Izin (Permit)', `${p.jumlah_izin || 0} Hari`],
        ['Sakit (Sick Leave)', `${p.jumlah_sakit || 0} Hari`],
        ['Cuti (Annual Leave)', `${p.jumlah_cuti || 0} Hari`],
        ['Alpa (Unexcused Absence)', `${p.jumlah_alfa || 0} Hari`],
      ],
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      margin: { left: 15, right: 15 }
    });

    const attFinalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('* Laporan ini dihasilkan secara otomatis oleh sistem absensi Linisware.', 15, attFinalY);

    doc.save(`Slip_Gaji_${p.karyawan?.nama_depan}_${filterMonth}_${filterYear}.pdf`);
  };

  if (loading && payrolls.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 style={{ height: '3rem', width: '3rem', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontWeight: '500' }}>Syncing Ledger Data...</p>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'relative' }}>
      {/* Modals Container */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '28rem', width: '100%', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: '#fff7ed', color: '#f59e0b', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle style={{ width: '2rem', height: '2rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>Execute Payroll Engine?</h3>
              <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>This will calculate salaries for all active employees based on current attendance, BPJS rates, and tax regulations. This action cannot be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => setShowConfirm(false)} className="btn" style={{ flex: 1, backgroundColor: 'white', border: '1px solid var(--border-color)' }}>Cancel</button>
              <button onClick={executePayroll} className="btn btn-primary" style={{ flex: 1 }}>Execute Now</button>
            </div>
          </div>
        </div>
      )}

      {summary && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ maxWidth: '32rem', width: '100%', padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center', position: 'relative' }}>
            <button onClick={() => setSummary(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X style={{ width: '1.5rem', height: '1.5rem' }} />
            </button>
            <div style={{ width: '4rem', height: '4rem', backgroundColor: '#ecfdf5', color: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.75rem', fontWeight: '900', margin: '0 0 0.5rem 0' }}>Payroll Finalized</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Cycle period successfully processed.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', textAlign: 'left' }}>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--secondary)', borderRadius: '1.25rem' }}>
                <Users style={{ width: '1.25rem', height: '1.25rem', color: 'var(--primary)', marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Employees</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>{summary.total_employees}</p>
              </div>
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--secondary)', borderRadius: '1.25rem' }}>
                <TrendingUp style={{ width: '1.25rem', height: '1.25rem', color: '#10b981', marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Disbursed</p>
                <p style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>{formatCurrency(summary.total_disbursement)}</p>
              </div>
            </div>

            <button onClick={() => setSummary(null)} className="btn btn-primary" style={{ width: '100%', padding: '1.25rem' }}>Back to Ledger</button>
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (max-width: 1024px) {
          .summary-item { border-right: none !important; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 1.5rem; padding-right: 0 !important; }
          .summary-item:last-child { border-bottom: none; }
          .summary-header { flex-direction: column !important; align-items: flex-start !important; }
          .summary-actions { width: 100%; justify-content: flex-start; }
          .summary-title { font-size: 1.75rem !important; }
        }
        @media (max-width: 640px) {
          .summary-card { padding: 2rem !important; gap: 2rem !important; }
          .summary-value { font-size: 2rem !important; }
        }
      `}} />

      {/* Header Section */}
      <div className="card summary-header" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '4.5rem', height: '4.5rem', backgroundColor: 'var(--primary)',
            borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)'
          }}>
            <Wallet style={{ width: '2.5rem', height: '2.5rem', color: 'white' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>Payroll Hub</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.25rem 0 0 0', fontWeight: '500' }}>Manage transparency, empower people.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={exportToPDF} className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
            <FileText style={{ height: '1.1rem', width: '1.1rem', color: '#f43f5e' }} />
            PDF Report
          </button>

          <button onClick={exportToExcel} className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', gap: '0.5rem' }}>
            <Download style={{ height: '1.1rem', width: '1.1rem', color: '#10b981' }} />
            Excel Data
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={isGenerating}
            className="btn btn-primary"
            style={{ gap: '0.75rem', padding: '0.75rem 1.5rem' }}
          >
            {isGenerating ? <Loader2 style={{ animation: 'spin 1s linear infinite', height: '1.25rem', width: '1.25rem' }} /> : <Calculator style={{ height: '1.25rem', width: '1.25rem' }} />}
            {isGenerating ? 'Calculating...' : 'Execute Payroll'}
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <div className="summary-card" style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0088ba 100%)',
        borderRadius: '2.5rem',
        padding: '3rem',
        color: 'white',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '3rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="summary-item" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)', paddingRight: '2rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Total Disbursement</p>
          <h2 className="summary-value" style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>
            {formatCurrency(payrolls.reduce((acc, curr) => acc + (curr.total_gaji || 0), 0))}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>Beban operasional periode berjalan.</p>
        </div>

        <div className="summary-item" style={{ borderRight: '1px solid rgba(255, 255, 255, 0.1)', paddingRight: '2rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Data Records</p>
          <h2 className="summary-value" style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0 }}>{payrolls.length} Employees</h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>Seluruh data gaji terproses.</p>
        </div>

        <div className="summary-item">
          <p style={{ fontSize: '0.7rem', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Last Update</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History style={{ height: '1.5rem', width: '1.5rem', color: '#60a5fa' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{new Date().toLocaleDateString('id-ID')}</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>Keamanan data terjamin.</p>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0, letterSpacing: '-0.02em' }}>Financial Ledger</h3>

          {/* Period Filter Relocated Here */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'var(--secondary)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
            <Calendar style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][i]}
                </option>
              ))}
            </select>
            <div style={{ width: '1px', height: '1rem', backgroundColor: 'var(--border-color)' }}></div>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer' }}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--secondary)' }}>
              <tr>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Employee Profile</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Position</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cycle</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bank Channel</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Amount</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((payroll) => (
                <tr key={payroll.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: '2.5rem', height: '2.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                        borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800'
                      }}>
                        {payroll.karyawan?.nama_depan[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700' }}>{payroll.karyawan?.nama_depan} {payroll.karyawan?.nama_belakang}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {payroll.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-dark)' }}>
                      {payroll.karyawan?.jabatan?.nama_jabatan || '-'}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                      {new Date(payroll.periode_gaji).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)' }}>{payroll.nama_bank || 'BCA'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payroll.nomor_rekening || '-'}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '900' }}>{formatCurrency(payroll.total_gaji)}</div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '999px',
                        fontSize: '0.65rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        backgroundColor: payroll.status_pembayaran === 'Paid' ? '#ecfdf5' : '#fffbeb',
                        color: payroll.status_pembayaran === 'Paid' ? '#10b981' : '#f59e0b',
                      }}>
                        {payroll.status_pembayaran}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '1.5rem 2rem' }}>
                    <button
                      onClick={() => setSelectedSlip(payroll)}
                      className="btn"
                      style={{
                        backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                        padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: '800',
                        gap: '0.5rem', borderRadius: '0.75rem'
                      }}
                    >
                      <Eye style={{ width: '1rem', height: '1rem' }} />
                      Lihat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Slip Modal */}
      {selectedSlip && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '2rem'
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: '1rem', width: '100%', maxWidth: '850px',
            maxHeight: '95vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-color)', paddingBottom: '3rem'
          }}>
            <button
              onClick={() => setSelectedSlip(null)}
              style={{ position: 'absolute', top: '2rem', right: '2rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', zIndex: 10 }}
            >
              <X style={{ width: '2rem', height: '2rem' }} />
            </button>

            <div style={{ padding: '3rem' }}>
              {/* Header / KOP */}
              <div style={{ position: 'relative', textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid var(--text-dark)', paddingBottom: '1rem' }}>
                <div style={{ position: 'absolute', left: 0, top: 0 }}>
                  <div style={{ width: '3.5rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Liniswara Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--primary)', marginTop: '0.25rem' }}>{COMPANY_INFO.name}</div>
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: '900', margin: 0, color: 'var(--text-dark)' }}>
                  SLIP GAJI KARYAWAN {['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][filterMonth - 1]} {filterYear}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '500', maxWidth: '400px', margin: '0.5rem auto' }}>
                  {COMPANY_INFO.address}
                </p>
              </div>

              {/* Profile Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>Nama</span> <span style={{ marginRight: '10px' }}>:</span> <span style={{ fontWeight: '800' }}>{selectedSlip.karyawan?.nama_depan} {selectedSlip.karyawan?.nama_belakang}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>NIK</span> <span style={{ marginRight: '10px' }}>:</span> <span>{selectedSlip.karyawan?.id?.slice(0, 8).toUpperCase()}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>Rek</span> <span style={{ marginRight: '10px' }}>:</span> <span>{selectedSlip.nomor_rekening || '-'} ({selectedSlip.nama_bank || 'BCA'})</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>Divisi</span> <span style={{ marginRight: '10px' }}>:</span> <span>Produksi</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>Jabatan</span> <span style={{ marginRight: '10px' }}>:</span> <span>{selectedSlip.karyawan?.jabatan?.nama_jabatan || '-'}</span></div>
                  <div style={{ display: 'flex' }}><span style={{ width: '80px', fontSize: '0.85rem', fontWeight: '600' }}>Tanggal</span> <span style={{ marginRight: '10px' }}>:</span> <span>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary)', borderTop: '1px solid var(--text-dark)', borderBottom: '1px solid var(--text-dark)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'center', width: '50px', fontSize: '0.75rem', fontWeight: '800' }}>NO.</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '800' }}>KETERANGAN</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', width: '180px', fontSize: '0.75rem', fontWeight: '800' }}>JUMLAH</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ fontStyle: 'italic', fontWeight: '700' }}><td colSpan={2} style={{ padding: '0.5rem' }}>PENDAPATAN</td><td></td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>1</td><td style={{ padding: '0.5rem' }}>Gaji Pokok</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.gaji_pokok)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>2</td><td style={{ padding: '0.5rem' }}>Tunjangan Jabatan</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.tunjangan_jabatan)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>3</td><td style={{ padding: '0.5rem' }}>Tunjangan Makan <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(Rp30.000/Hari) =&gt; {selectedSlip.jumlah_hadir || 0} Hari</span></td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.tunjangan_makan)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>4</td><td style={{ padding: '0.5rem' }}>Tunjangan Transport <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(Rp30.000/Hari) =&gt; {selectedSlip.jumlah_hadir || 0} Hari</span></td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.tunjangan_transport)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>5</td><td style={{ padding: '0.5rem' }}>Tunjangan Kesehatan</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>Rp -</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>6</td><td style={{ padding: '0.5rem' }}>Lembur Karyawan <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>(Rp12.000/jam)</span></td><td style={{ textAlign: 'right', padding: '0.5rem' }}>Rp -</td></tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ textAlign: 'center', padding: '0.5rem' }}>7</td><td style={{ padding: '0.5rem' }}>Tunjangan Lainnya</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.tunjangan_keluarga)}</td></tr>
                  <tr style={{ fontStyle: 'italic', fontWeight: '800' }}>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '0.75rem' }}>Jumlah Pendapatan</td>
                    <td style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '3px Double var(--text-dark)' }}>{formatCurrency(selectedSlip.gaji_pokok + selectedSlip.tunjangan_jabatan + selectedSlip.tunjangan_makan + selectedSlip.tunjangan_transport + selectedSlip.tunjangan_keluarga)}</td>
                  </tr>

                  <tr style={{ fontStyle: 'italic', fontWeight: '700' }}><td colSpan={2} style={{ padding: '0.5rem', paddingTop: '1.5rem' }}>POTONGAN</td><td></td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>8</td><td style={{ padding: '0.5rem' }}>BPJS Kesehatan (1%)</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.potongan_bpjs_ks)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>9</td><td style={{ padding: '0.5rem' }}>BPJS Ketenagakerjaan (2%)</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.potongan_bpjs_tk)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>10</td><td style={{ padding: '0.5rem' }}>Pajak PPh21</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.pajak_pph21)}</td></tr>
                  <tr><td style={{ textAlign: 'center', padding: '0.5rem' }}>11</td><td style={{ padding: '0.5rem' }}>Potongan Terlambat</td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.potongan_terlambat)}</td></tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}><td style={{ textAlign: 'center', padding: '0.5rem' }}>12</td><td style={{ padding: '0.5rem' }}>Potongan Absensi / Alpha <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>({selectedSlip.jumlah_alfa || 0} Hari)</span></td><td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatCurrency(selectedSlip.potongan_alfa)}</td></tr>
                  <tr style={{ fontStyle: 'italic', fontWeight: '800' }}>
                    <td colSpan={2} style={{ textAlign: 'right', padding: '0.75rem' }}>Jumlah Potongan</td>
                    <td style={{ textAlign: 'right', padding: '0.75rem', borderBottom: '3px Double var(--text-dark)' }}>
                      {formatCurrency(
                        (Number(selectedSlip.potongan_bpjs_ks) || 0) + 
                        (Number(selectedSlip.potongan_bpjs_tk) || 0) + 
                        (Number(selectedSlip.pajak_pph21) || 0) + 
                        (Number(selectedSlip.potongan_alfa) || 0) + 
                        (Number(selectedSlip.potongan_terlambat) || 0)
                      )}
                    </td>
                  </tr>

                  <tr style={{ fontWeight: '900', backgroundColor: 'var(--secondary)' }}>
                    <td colSpan={2} style={{ padding: '1rem', fontSize: '1rem' }}>TOTAL GAJI YANG DITERIMA</td>
                    <td style={{ textAlign: 'right', padding: '1rem', fontSize: '1.25rem', color: 'var(--primary)' }}>{formatCurrency(selectedSlip.total_gaji)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Attendance Summary Section in Modal */}
              <div style={{ backgroundColor: 'var(--secondary)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-dark)' }}>LAPORAN KEHADIRAN & KETEPATAN WAKTU</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>HADIR</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{selectedSlip.jumlah_hadir || 0}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>ALPA</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ef4444' }}>{selectedSlip.jumlah_alfa || 0}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>TERLAMBAT</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f59e0b' }}>{selectedSlip.jumlah_terlambat || 0}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>IZIN</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{selectedSlip.jumlah_izin || 0}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>SAKIT</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{selectedSlip.jumlah_sakit || 0}</div>
                   </div>
                   <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>CUTI</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '900' }}>{selectedSlip.jumlah_cuti || 0}</div>
                   </div>
                </div>
              </div>

              {/* Terbilang & Signatures */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: '900', fontSize: '0.875rem' }}>TERBILANG :</span>
                  <span style={{ fontStyle: 'italic', fontWeight: '600' }}>{formatTerbilang(selectedSlip.total_gaji)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', marginTop: '4rem' }}>
                <div style={{ width: '200px' }}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '3rem' }}>Dibuat Oleh</p>
                  <p style={{ fontWeight: '900', textDecoration: 'underline', margin: 0 }}>{COMPANY_INFO.signatures.hr.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{COMPANY_INFO.signatures.hr.title}</p>
                </div>
                <div style={{ width: '200px' }}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '3rem' }}>Dibayar Oleh</p>
                  <p style={{ fontWeight: '900', textDecoration: 'underline', margin: 0 }}>{COMPANY_INFO.signatures.finance.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{COMPANY_INFO.signatures.finance.title}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button
                  onClick={() => exportSlipToPDF(selectedSlip)}
                  className="btn btn-primary"
                  style={{ gap: '0.75rem', padding: '1rem 2.5rem', borderRadius: '1rem' }}
                >
                  <Printer style={{ width: '1.25rem', height: '1.25rem' }} />
                  Cetak Slip Gaji
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

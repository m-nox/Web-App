'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_INFO = {
  name: 'Liniswara',
  address: 'Gg. Dukuhan Baru, Sawah, Gunungsring, Kec. Muntilan, Magelang, Jawa Tengah',
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

export default function SlipGajiPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePayroll, setActivePayroll] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMyPayrolls();
  }, []);

  async function fetchMyPayrolls() {
    setLoading(true);
    try {
      const profRes = await fetch('/api/profile');
      const { profile } = await profRes.json();
      
      const gajiRes = await fetch('/api/payroll/me');
      const { data } = await gajiRes.json();

      if (profile && data) {
        const dataWithProfile = data.map(p => ({ ...p, karyawan: profile }));
        setPayrolls(dataWithProfile);
        if (dataWithProfile.length > 0) {
          setActivePayroll(dataWithProfile[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const exportSlipToPDF = (p) => {
    const doc = new jsPDF();
    const filterMonth = new Date(p.periode_gaji).getMonth() + 1;
    const filterYear = new Date(p.periode_gaji).getFullYear();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`SLIP GAJI KARYAWAN ${['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][filterMonth - 1]} ${filterYear}`, 105, 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_INFO.address, 105, 26, { align: 'center' });
    
    doc.line(15, 32, 195, 32);

    doc.setFontSize(9);
    doc.text('Nama     :', 15, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`${p.karyawan?.nama_depan} ${p.karyawan?.nama_belakang || ''}`, 35, 42);

    doc.setFont('helvetica', 'normal');
    doc.text('NIK         :', 15, 48);
    doc.text(p.karyawan?.id?.slice(0, 8).toUpperCase() || '-', 35, 48);

    doc.text('Jabatan  :', 120, 42);
    doc.text(p.karyawan?.jabatan?.nama_jabatan || '-', 140, 42);
    doc.text('Tanggal  :', 120, 48);
    doc.text(`${new Date().toLocaleDateString('id-ID')}`, 140, 48);

    autoTable(doc, {
      startY: 55,
      head: [['NO.', 'KETERANGAN', 'JUMLAH']],
      body: [
        [{ content: 'PENDAPATAN', colSpan: 2, styles: { fontStyle: 'bold' } }, ''],
        ['1', 'Gaji Pokok', { content: formatCurrency(p.gaji_pokok || 0), styles: { halign: 'right' } }],
        ['2', 'Tunjangan Jabatan', { content: formatCurrency(p.tunjangan_jabatan || 0), styles: { halign: 'right' } }],
        ['3', `Tunjangan Makan (${p.jumlah_hadir || 0} Hari)`, { content: formatCurrency(p.tunjangan_makan || 0), styles: { halign: 'right' } }],
        ['4', `Tunjangan Transport (${p.jumlah_hadir || 0} Hari)`, { content: formatCurrency(p.tunjangan_transport || 0), styles: { halign: 'right' } }],
        ['5', 'Tunjangan Lainnya', { content: formatCurrency(p.tunjangan_keluarga || 0), styles: { halign: 'right' } }],
        [{ content: 'Jml. Pendapatan', colSpan: 2, styles: { halign: 'right' } }, { content: formatCurrency(p.gaji_pokok + p.tunjangan_jabatan + p.tunjangan_makan + p.tunjangan_transport + p.tunjangan_keluarga), styles: { halign: 'right', fontStyle: 'bold' } }],
        
        [{ content: 'POTONGAN', colSpan: 2, styles: { fontStyle: 'bold' } }, ''],
        ['6', 'BPJS Kesehatan', { content: formatCurrency(p.potongan_bpjs_ks || 0), styles: { halign: 'right' } }],
        ['7', 'BPJS Ketenagakerjaan', { content: formatCurrency(p.potongan_bpjs_tk || 0), styles: { halign: 'right' } }],
        ['8', 'Pajak PPh21', { content: formatCurrency(p.pajak_pph21 || 0), styles: { halign: 'right' } }],
        ['9', 'Potongan Terlambat', { content: formatCurrency(p.potongan_terlambat || 0), styles: { halign: 'right' } }],
        ['10', `Potongan Alpa (${p.jumlah_alfa || 0} Hari)`, { content: formatCurrency(p.potongan_alfa || 0), styles: { halign: 'right' } }],
        [{ content: 'Jml. Potongan', colSpan: 2, styles: { halign: 'right' } }, { content: formatCurrency((p.potongan_bpjs_ks || 0) + (p.potongan_bpjs_tk || 0) + (p.pajak_pph21 || 0) + (p.potongan_alfa || 0) + (p.potongan_terlambat || 0)), styles: { halign: 'right', fontStyle: 'bold' } }],
        
        [{ content: 'TOTAL GAJI YANG DITERIMA', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: formatCurrency(p.total_gaji), styles: { halign: 'right', fontStyle: 'bold' } }],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [40, 40, 40] }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text('Terbilang:', 15, finalY);
    doc.setFont('helvetica', 'italic');
    doc.text(formatTerbilang(p.total_gaji), 35, finalY);

    const sigY = finalY + 20;
    doc.setFont('helvetica', 'normal');
    doc.text('Dibuat Oleh:', 40, sigY, { align: 'center' });
    doc.text('Diterima Oleh:', 160, sigY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.signatures.hr.name, 40, sigY + 20, { align: 'center' });
    doc.text(p.karyawan?.nama_depan + ' ' + (p.karyawan?.nama_belakang || ''), 160, sigY + 20, { align: 'center' });

    doc.save(`Slip_Gaji_${p.karyawan?.nama_depan}_${filterMonth}_${filterYear}.pdf`);
  };

  const calculateGross = (p) => {
    return (p.gaji_pokok || 0) + (p.tunjangan_jabatan || 0) + (p.tunjangan_makan || 0) + (p.tunjangan_transport || 0) + (p.tunjangan_keluarga || 0);
  };

  const calculateDeductions = (p) => {
    return (p.potongan_bpjs_ks || 0) + (p.potongan_bpjs_tk || 0) + (p.pajak_pph21 || 0) + (p.potongan_alfa || 0) + (p.potongan_terlambat || 0);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Memuat data gaji...</div>;

  if (!activePayroll) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <h2>Belum Ada Catatan Gaji</h2>
        <p style={{ color: 'var(--text-muted)' }}>Data slip gaji Anda akan muncul di sini segera setelah diproses.</p>
      </div>
    );
  }

  const grossPay = calculateGross(activePayroll);
  const totalDeductions = calculateDeductions(activePayroll);

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    padding: '1.5rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-color)',
    marginBottom: '1.5rem'
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="mobile-full">
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.25rem 0', fontWeight: '800' }}>Halo, {activePayroll.karyawan?.nama_depan}!</h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.85rem' }}>Slip gaji periode ini sudah tersedia.</p>
        </div>
        <div className="mobile-full" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={activePayroll.id}
            onChange={(e) => setActivePayroll(payrolls.find(p => p.id === e.target.value))}
            className="mobile-full"
            style={{ padding: '0.6rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.875rem' }}
          >
            {payrolls.map(p => (
              <option key={p.id} value={p.id}>
                {new Date(p.periode_gaji).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
          <button 
             onClick={() => exportSlipToPDF(activePayroll)}
             className="btn btn-primary mobile-full"
             style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}
          >
            Cetak PDF
          </button>
        </div>
      </div>

      <div className="grid-stack" style={{ marginBottom: '1.25rem', gap: '1rem' }}>
        <div style={{ ...cardStyle, flex: 1, backgroundColor: 'var(--primary)', color: 'white', marginBottom: 0, padding: '1.25rem' }}>
           <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', opacity: 0.8 }}>Take Home Pay</p>
           <h3 style={{ margin: 0, fontWeight: '900' }}>{formatCurrency(activePayroll.total_gaji)}</h3>
        </div>
        <div style={{ ...cardStyle, flex: 1, marginBottom: 0, padding: '1.25rem' }}>
           <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Gross Pay</p>
           <h3 style={{ margin: 0, fontWeight: '900' }}>{formatCurrency(grossPay)}</h3>
        </div>
        <div style={{ ...cardStyle, flex: 1, marginBottom: 0, padding: '1.25rem' }}>
           <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Deductions</p>
           <h3 style={{ margin: 0, fontWeight: '900', color: 'var(--danger)' }}>-{formatCurrency(totalDeductions)}</h3>
        </div>
      </div>

      <div className="grid-stack" style={{ gap: '1.25rem' }}>
        
        {/* Rincian Pendapatan */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <h4 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary)', fontSize: '0.875rem', fontWeight: '800' }}>
            EARNINGS
          </h4>
          <div style={{ padding: '0 1.25rem' }}>
            {[
              { label: 'Gaji Pokok', value: activePayroll.gaji_pokok },
              { label: 'Tunj. Jabatan', value: activePayroll.tunjangan_jabatan },
              { label: 'Tunj. Makan', value: activePayroll.tunjangan_makan },
              { label: 'Tunj. Transport', value: activePayroll.tunjangan_transport },
              { label: 'Tunj. Khusus', value: activePayroll.tunjangan_keluarga },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: '700' }}>{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 0', fontWeight: '900', fontSize: '0.95rem' }}>
              <span>Total Earnings</span>
              <span style={{ color: 'var(--success)' }}>{formatCurrency(grossPay)}</span>
            </div>
          </div>
        </div>

        {/* Rincian Potongan */}
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginBottom: 0 }}>
          <h4 style={{ padding: '1rem', margin: 0, borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary)', fontSize: '0.875rem', fontWeight: '800' }}>
            DEDUCTIONS
          </h4>
          <div style={{ padding: '0 1.25rem' }}>
            {[
              { label: 'BPJS Kes', value: activePayroll.potongan_bpjs_ks },
              { label: 'BPJS TK', value: activePayroll.potongan_bpjs_tk },
              { label: 'Pajak PPh21', value: activePayroll.pajak_pph21 },
              { label: 'Late Deduction', value: activePayroll.potongan_terlambat },
              { label: 'Alpa Deduction', value: activePayroll.potongan_alfa },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: '700', color: 'var(--danger)' }}>-{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.25rem 0', fontWeight: '900', fontSize: '0.95rem' }}>
              <span>Total Deductions</span>
              <span style={{ color: 'var(--danger)' }}>-{formatCurrency(totalDeductions)}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

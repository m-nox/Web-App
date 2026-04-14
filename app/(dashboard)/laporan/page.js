'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  BarChart3, 
  Users, 
  Clock, 
  CalendarDays, 
  TrendingUp,
  Download,
  AlertCircle,
  ArrowUpRight,
  Target,
  Zap,
  LayoutDashboard
} from 'lucide-react';

export default function LaporanPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0,
    totalPayroll: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    setLoading(true);
    try {
      const { count: empCount } = await supabase.from('karyawan').select('*', { count: 'exact', head: true });
      const today = new Date().toISOString().split('T')[0];
      const { count: attCount } = await supabase.from('absensi').select('*', { count: 'exact', head: true }).eq('tanggal', today).or('status.eq.Hadir,status.eq.Terlambat');
      const { count: leaveCount } = await supabase.from('cuti').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`;
      const { data: payrollData } = await supabase.from('gaji').select('total_gaji').eq('periode_gaji', currentMonth);
      const totalPayroll = payrollData?.reduce((acc, curr) => acc + (parseFloat(curr.total_gaji) || 0), 0) || 0;

      setStats({
        totalEmployees: empCount || 0,
        presentToday: attCount || 0,
        pendingLeaves: leaveCount || 0,
        totalPayroll,
      });

    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Loader2 style={{ height: '4rem', width: '4rem', animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
        <p style={{ color: 'var(--text-muted)', marginTop: '1.5rem', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
          Generating Executive Insights...
        </p>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      {/* Header Section */}
      <div style={{ 
        position: 'relative', 
        backgroundColor: '#111827', 
        borderRadius: '1.25rem', 
        padding: '1.5rem', 
        overflow: 'hidden', 
        boxShadow: 'var(--shadow-lg)',
        color: 'white'
      }}>
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              padding: '0.4rem 0.75rem', 
              backgroundColor: 'rgba(31, 41, 55, 0.5)', 
              border: '1px solid rgba(55, 65, 81, 0.5)', 
              borderRadius: '0.75rem', 
              fontSize: '0.7rem', 
              fontWeight: '700',
              width: 'fit-content'
            }}>
              <Zap style={{ height: '0.875rem', width: '0.875rem', marginRight: '0.4rem', color: '#818cf8' }} />
              Live Reporting System
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.02em', margin: 0, lineHeight: '1.2' }}>
              Executive Dashboard
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', maxWidth: '24rem', fontWeight: '500', margin: 0 }}>
              Analisis operasional, kehadiran, dan anggaran keuangan perusahaan.
            </p>
          </div>
          
          <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', width: 'fit-content', fontSize: '0.875rem', borderRadius: '0.75rem' }}>
            <Download style={{ marginRight: '0.5rem', height: '1.15rem', width: '1.15rem' }} />
            Generate Summary
          </button>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '2rem' 
      }}>
        <StatCard 
          icon={<Users style={{ width: '2rem', height: '2rem' }} />} 
          label="Tenaga Kerja" 
          value={stats.totalEmployees} 
          trend="+12% bulan ini"
          color="#3b82f6"
          bg="#eff6ff"
          description="Total personel aktif"
        />
        <StatCard 
          icon={<Clock style={{ width: '2rem', height: '2rem' }} />} 
          label="Presensi Hari Ini" 
          value={`${Math.round((stats.presentToday / (stats.totalEmployees || 1)) * 100)}%`} 
          trend="Sangat Baik"
          color="#10b981"
          bg="#ecfdf5"
          description={`${stats.presentToday} Karyawan Hadir`}
        />
        <StatCard 
          icon={<CalendarDays style={{ width: '2rem', height: '2rem' }} />} 
          label="Cuti Pending" 
          value={stats.pendingLeaves} 
          trend={stats.pendingLeaves > 5 ? "Critical" : "Stable"}
          color="#f59e0b"
          bg="#fffbeb"
          description="Menunggu persetujuan"
          alert={stats.pendingLeaves > 0}
        />
        <StatCard 
          icon={<TrendingUp style={{ width: '2rem', height: '2rem' }} />} 
          label="Budget Payroll" 
          value={formatCurrency(stats.totalPayroll)} 
          trend="On Budget"
          color="#f43f5e"
          bg="#fff1f2"
          description="Estimasi bulan berjalan"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Main Chart Area */}
        <div className="card" style={{ padding: '1.5rem', flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '900', display: 'flex', alignItems: 'center', margin: 0 }}>
              <Target style={{ marginRight: '0.75rem', color: 'var(--primary)', height: '1.25rem', width: '1.25rem' }} />
              KPI Operasional
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <ModernMetric label="Tingkat Retensi Karyawan" value={94} color="var(--primary)" />
             <ModernMetric label="Efisiensi Kehadiran" value={Math.round((stats.presentToday / (stats.totalEmployees || 1)) * 100)} color="#10b981" />
             <ModernMetric label="Kepuasan Kerja (eNPS)" value={88} color="#f59e0b" />
          </div>
        </div>

        {/* System Health Area */}
        <div style={{ 
          backgroundColor: '#0f172a', 
          borderRadius: '1.25rem', 
          padding: '1.5rem', 
          color: 'white', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          gap: '1.25rem'
        }}>
          <div>
            <h3 style={{ fontSize: '0.7rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
              Status Infrastruktur
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               <SystemItem label="Core Database" status="Healthy" active={true} />
               <SystemItem label="Bio-Sync Engine" status="Online" active={true} />
               <SystemItem label="Bank Gateway" status="Standby" active={false} />
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'rgba(30, 64, 175, 0.2)', 
            borderRadius: '1rem', 
            padding: '1rem', 
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <p style={{ fontSize: '0.65rem', fontWeight: '800', color: '#93c5fd', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Data Last Sync</p>
            <p style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0 }}>{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color, bg, description, alert }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden', padding: '1.25rem' }}>
      {alert && <div style={{ position: 'absolute', top: '1rem', right: '1rem', width: '0.5rem', height: '0.5rem', backgroundColor: '#f43f5e', borderRadius: '50%' }}></div>}
      <div style={{ 
        width: '2.5rem', 
        height: '2.5rem', 
        borderRadius: '0.75rem', 
        backgroundColor: bg, 
        color: color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.25rem 0' }}>{label}</p>
        <h4 style={{ fontSize: '1.25rem', fontWeight: '900', margin: '0 0 0.15rem 0', letterSpacing: '-0.02em' }}>{value}</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)' }}>{description}</span>
          <span style={{ 
            fontSize: '0.6rem', 
            fontWeight: '800', 
            padding: '0.2rem 0.5rem', 
            borderRadius: '999px', 
            backgroundColor: bg, 
            color: color 
          }}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}

function ModernMetric({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ fontWeight: '700', color: 'var(--text-dark)', fontSize: '0.875rem' }}>{label}</span>
        <span style={{ fontSize: '1.15rem', fontWeight: '900' }}>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '0.5rem', backgroundColor: 'var(--secondary)', borderRadius: '999px', overflow: 'hidden' }}>
        <div 
          style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: '999px', transition: 'width 1s ease-out' }} 
        />
      </div>
    </div>
  );
}

function SystemItem({ label, status, active }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#94a3b8', fontWeight: '500' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: active ? '#34d399' : '#64748b', textTransform: 'uppercase' }}>
          {status}
        </span>
        <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: active ? '#34d399' : '#475569' }}></div>
      </div>
    </div>
  );
}

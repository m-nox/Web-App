'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/utils/supabase/client'

export default function Home() {
  const [stats, setStats] = useState({
    totalKaryawan: 0,
    hadirToday: 0,
    pendingCuti: 0
  })
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [processLoading, setProcessLoading] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchProfile()
    fetchAttendance()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats')
      const result = await res.json()
      if (res.ok) {
        setStats(result)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const res = await fetch(`/api/karyawan?email=${user.email}`)
      const result = await res.json()
      // Since it returns an array of karyawan, we take the first match
      if (res.ok && result.data && result.data.length > 0) {
        setProfile(result.data[0])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/absensi/status')
      const data = await res.json()
      if (res.ok) setAttendance(data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    }
  }

  const handleClock = async () => {
    setProcessLoading(true)
    try {
      const res = await fetch('/api/absensi/clock', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        fetchAttendance()
      } else {
        alert('Gagal: ' + data.error)
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan pada server.')
    } finally {
      setProcessLoading(false)
    }
  }

  const isAtOffice = attendance?.isAtOffice
  const todayAttendance = attendance?.attendance
  const canClockIn = !todayAttendance
  const canClockOut = todayAttendance && !todayAttendance.jam_keluar
  const alreadyDone = todayAttendance && todayAttendance.jam_keluar
  const isBeforeGoHomeTime = new Date().getHours() < 17 || (new Date().getHours() === 17 && new Date().getMinutes() < 3)
  const clockOutDisabled = canClockOut && isBeforeGoHomeTime

  return (
    <main>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(45deg, var(--primary), #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HRIS Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Sistem Manajemen Sumber Daya Manusia Terintegrasi.</p>
        </div>
        <Link href="/karyawan" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          Kelola Karyawan
        </Link>
      </header>

      {/* Profile Section */}
      {profile && (
        <div className="card glass" style={{ marginBottom: '2rem', padding: '1.5rem', borderLeft: '5px solid var(--primary)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--primary)', fontWeight: 'bold' }}>
            {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>Selamat Datang, {profile.nama_depan}!</h2>
            <p style={{ color: 'var(--text-muted)' }}>{profile.jabatan?.nama_jabatan || 'Karyawan'} • {profile.departemen?.nama_departemen || 'Umum'}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card glass" style={{ borderLeft: '5px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '500' }}>Total Karyawan</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
            {loading ? '...' : stats.totalKaryawan}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Terdaftar di sistem</p>
        </div>
        
        <div className="card glass" style={{ borderLeft: '5px solid var(--success)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '500' }}>Hadir Hari Ini</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--success)', margin: 0 }}>
            {loading ? '...' : stats.hadirToday}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Kehadiran real-time</p>
        </div>

        <div className="card glass" style={{ borderLeft: '5px solid var(--warning)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: '500' }}>Cuti (Pending)</h3>
          <p style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--warning)', margin: 0 }}>
            {loading ? '...' : stats.pendingCuti}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Menunggu persetujuan</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Attendance Summary */}
        <section className="card glass" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '700' }}>Presensi Hari Ini</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jam Masuk</span>
              <span style={{ fontWeight: '700' }}>{todayAttendance?.jam_masuk || '-- : --'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jam Keluar</span>
              <span style={{ fontWeight: '700' }}>{todayAttendance?.jam_keluar || '-- : --'}</span>
            </div>
          </div>
          
          {alreadyDone ? (
            <div style={{ textAlign: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--secondary)', color: 'var(--text-muted)', fontWeight: '600' }}>
              ✅ Kehadiran terekam.
            </div>
          ) : (
            <button 
              onClick={handleClock}
              disabled={!isAtOffice || processLoading || clockOutDisabled}
              className={`btn ${canClockOut ? 'btn-secondary' : 'btn-primary'}`}
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '700' }}
            >
              {processLoading ? 'Proses...' : (canClockIn ? 'Absen Masuk' : 'Absen Keluar')}
            </button>
          )}

          {!isAtOffice && !alreadyDone && (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center' }}>
              ⚠️ Di luar jangkauan Wi-Fi kantor.
            </p>
          )}
          {clockOutDisabled && (
             <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center' }}>
               Jam pulang pukul 17:03.
             </p>
          )}
        </section>

        {/* Activity Section */}
        <section className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: '700' }}>Aktivitas Terkini</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
              <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Sistem Siap</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Database Cloud Supabase telah terhubung dan siap digunakan.</p>
            </div>
            <Link href="/absensi" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'inherit' }}>
                <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Presensi Online</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Anda dapat melakukan presensi langsung dari dashboard ini.</p>
              </div>
            </Link>
          </div>
        </section>
      </div>

      <section className="card glass" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: '700', color: 'var(--primary)' }}>Pintasan Cepat</h2>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-dark)' }}>Kelola data departemen dan jabatan dengan akses cepat.</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/karyawan" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}>Manajemen Karyawan</Link>
          <Link href="/rekap-absensi" className="btn" style={{ flex: 1, backgroundColor: 'white', border: '1px solid var(--primary)', color: 'var(--primary)', textDecoration: 'none', textAlign: 'center' }}>Rekap Absensi</Link>
        </div>
      </section>
    </main>
  );
}

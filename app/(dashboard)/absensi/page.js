'use client'

import { useState, useEffect } from 'react'

export default function AbsensiPage() {
  const [time, setTime] = useState(new Date())
  const [status, setStatus] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [processLoading, setProcessLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchStatus()
    fetchHistory()
    return () => clearInterval(timer)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/absensi/status')
      const data = await res.json()
      if (res.ok) setStatus(data)
    } catch (error) {
      console.error('Error fetching status:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/absensi/history')
      const data = await res.json()
      if (res.ok) setHistory(data.data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleClock = async () => {
    setProcessLoading(true)
    try {
      const res = await fetch('/api/absensi/clock', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        alert(data.message)
        fetchStatus()
        fetchHistory()
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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat modul absensi...</div>

  const isAtOffice = status?.isAtOffice
  const attendance = status?.attendance
  
  // Can clock in if no attendance for today
  // Can clock out if attendance in exists but no out
  const canClockIn = !attendance
  const canClockOut = attendance && !attendance.jam_keluar
  const alreadyDone = attendance && attendance.jam_keluar

  // Time restriction for clock-out: 17:03:00
  const isBeforeGoHomeTime = time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() < 3)
  const clockOutDisabled = canClockOut && isBeforeGoHomeTime

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', background: 'linear-gradient(45deg, var(--primary), #00d2ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Portal Presensi Online
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Silakan lakukan pencatatan kehadiran harian Anda di sini.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* LEFT: CLOCK WIDGET */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '100px', height: '100px', background: 'var(--primary)', filter: 'blur(50px)', opacity: 0.2 }}></div>
          
          <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '1rem' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          
          <h2 style={{ fontSize: '4.5rem', fontWeight: '800', margin: '0.5rem 0', fontFamily: 'monospace', textShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>

          {attendance?.terlambat && (
             <div style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '4px', backgroundColor: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.75rem', fontWeight: '700' }}>
               Status: Terlambat (Masuk {attendance.jam_masuk})
             </div>
          )}

          <div style={{ 
            marginTop: '1.5rem', 
            padding: '0.75rem 1.5rem', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: isAtOffice ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isAtOffice ? '#166534' : '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isAtOffice ? '#22c55e' : '#ef4444' }}></div>
            {isAtOffice ? 'Terhubung Jaringan Kantor' : 'Di Luar Jangkauan Kantor'}
          </div>
          
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            IP Anda: <code style={{ color: 'var(--text-dark)' }}>{status?.clientIp}</code>
          </p>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Status Kehadiran Hari Ini</h3>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jam Masuk</span>
              <span style={{ fontWeight: '700', color: attendance?.jam_masuk ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                {attendance?.jam_masuk || '-- : --'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jam Keluar</span>
              <span style={{ fontWeight: '700', color: attendance?.jam_keluar ? 'var(--text-dark)' : 'var(--text-muted)' }}>
                {attendance?.jam_keluar || '-- : --'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status Kerja</span>
              <span style={{ 
                fontWeight: '700', 
                color: (attendance?.status === 'Hadir' && !attendance?.terlambat) ? '#166534' : 
                       attendance?.terlambat ? 'var(--danger)' : 'var(--text-muted)'
              }}>
                {attendance?.terlambat ? 'Terlambat' : (attendance?.status || 'Menunggu')}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            {alreadyDone ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'var(--secondary)', color: 'var(--text-muted)', fontWeight: '600' }}>
                ✅ Absensi hari ini telah selesai.
              </div>
            ) : (
              <button 
                onClick={handleClock}
                disabled={!isAtOffice || processLoading || clockOutDisabled} 
                className={`btn ${canClockOut ? 'btn-secondary' : 'btn-primary'}`}
                style={{ 
                  width: '100%', 
                  padding: '1.25rem', 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: clockOutDisabled ? 0.5 : 1,
                  cursor: clockOutDisabled ? 'not-allowed' : 'pointer'
                }}
              >
                {processLoading ? 'Memproses...' : (canClockIn ? 'Absen Masuk Sekarang' : 'Absen Keluar Sekarang')}
              </button>
            )}
            {clockOutDisabled && (
              <p style={{ marginTop: '1rem', fontSize: '0.813rem', color: 'var(--warning)', textAlign: 'center', fontWeight: '500' }}>
                 Jam pulang belum tiba. Silakan absen keluar pukul 17:03.
              </p>
            )}

            {!isAtOffice && !alreadyDone && (
              <p style={{ marginTop: '1rem', fontSize: '0.813rem', color: '#991b1b', textAlign: 'center', fontWeight: '500' }}>
                ⚠️ Gunakan Wi-Fi/Internet kantor untuk melakukan absen.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY TABLE */}
      <div className="card glass" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: '700', marginBottom: '1.5rem' }}>Riwayat 7 Hari Terakhir</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>TANGGAL</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>MASUK</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>KELUAR</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: '600' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada riwayat tercatat.</td></tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: '600' }}>{new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td style={{ padding: '1rem' }}>{h.jam_masuk || '--:--'}</td>
                    <td style={{ padding: '1rem' }}>{h.jam_keluar || '--:--'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: h.status === 'Hadir' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.05)', color: h.status === 'Hadir' ? '#166534' : 'var(--text-muted)' }}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

export default function EmployeeDashboard() {
  const [profile, setProfile] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [history, setHistory] = useState([])
  const [time, setTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [processLoading, setProcessLoading] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchAll()

    // Capture PWA install prompt event
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))

    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      clearInterval(timer)
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
  }

  const fetchAll = async () => {
    setLoading(true)
    await Promise.all([fetchProfile(), fetchAttendance(), fetchHistory()])
    setLoading(false)
  }

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      const data = await res.json()
      if (res.ok) setProfile(data.profile)
    } catch (err) { console.error(err) }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/absensi/status')
      const data = await res.json()
      if (res.ok) setAttendance(data)
    } catch (err) { console.error(err) }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/absensi/history')
      const data = await res.json()
      if (res.ok) setHistory(data.data || [])
    } catch (err) { console.error(err) }
  }

  const handleClock = async () => {
    setProcessLoading(true)
    try {
      const res = await fetch('/api/absensi/clock', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        await fetchAttendance()
        await fetchHistory()
      } else {
        alert('Gagal: ' + data.error)
      }
    } catch (error) {
      alert('Terjadi kesalahan pada server.')
    } finally {
      setProcessLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Memuat data dashboard...</p>
      </div>
    )
  }

  const isAtOffice = attendance?.isAtOffice
  const todayAtt = attendance?.attendance
  const canClockIn = !todayAtt
  const canClockOut = todayAtt && !todayAtt.jam_keluar
  const alreadyDone = todayAtt && todayAtt.jam_keluar
  const isBeforeGoHomeTime = time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() < 3)
  const clockOutDisabled = canClockOut && isBeforeGoHomeTime

  const totalHadir = history.filter(h => h.status === 'Hadir').length
  const totalTerlambat = history.filter(h => h.terlambat).length
  const totalOnTime = totalHadir - totalTerlambat

  const cardStyle = {
    backgroundColor: 'var(--bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.5rem',
    border: '1px solid var(--border-color)',
    marginBottom: '1.5rem'
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Install App Banner - shown only if not installed yet and prompt is available */}
      {!isInstalled && installPrompt && (
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #00AEEF 0%, #0088ba 100%)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <img src="/icon-192.png" alt="Icon" style={{ width: '52px', height: '52px', borderRadius: '12px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '180px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Install Aplikasi Lini HRIS</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Tambahkan ke Home Screen untuk akses lebih cepat tanpa buka browser</p>
          </div>
          <button
            onClick={handleInstall}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              color: '#00AEEF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.875rem',
              flexShrink: 0
            }}
          >
            📲 Install Sekarang
          </button>
        </div>
      )}

      {/* Header Profile Section */}
      {profile && (
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
             {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
          </div>
          <div>
             <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: 'var(--text-dark)' }}>{profile.nama_depan} {profile.nama_belakang || ''}</h1>
             <p style={{ margin: 0, color: 'var(--text-muted)' }}>{profile.jabatan?.nama_jabatan || 'Team Member'} • {profile.departemen?.nama_departemen || '-'}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        
        {/* Left Col: Live Clock & Actions */}
        <div style={{ flex: '1 1 300px', ...cardStyle, textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '0.25rem 1rem', 
            borderRadius: '99px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            backgroundColor: isAtOffice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: isAtOffice ? 'var(--success)' : 'var(--danger)',
            marginBottom: '1.5rem'
          }}>
            {isAtOffice ? 'Di Dalam Jaringan Kantor' : 'Di Luar Jaringan Kantor'}
          </div>
          
          {/* Permanent Network Monitoring Info */}
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'var(--text-muted)', 
            marginTop: '-1rem', 
            marginBottom: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.2rem',
            opacity: 0.8 
          }}>
            <span>IP Anda: <strong style={{ color: 'var(--text-dark)' }}>{attendance?.clientIp || 'Mendeteksi...'}</strong></span>
            <span>IP Kantor: <strong style={{ color: 'var(--text-dark)' }}>{attendance?.officeIp || 'Mendeteksi...'}</strong></span>
          </div>
              
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--text-dark)' }}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 2rem 0' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>MASUK</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{todayAtt?.jam_masuk || '--:--'}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>KELUAR</p>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{todayAtt?.jam_keluar || '--:--'}</p>
            </div>
          </div>

          <div>
            {alreadyDone ? (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontWeight: 'bold' }}>
                Presensi Selesai
              </div>
            ) : (
              <>
                <button
                  onClick={handleClock}
                  disabled={!isAtOffice || processLoading || clockOutDisabled}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: (!isAtOffice || clockOutDisabled) ? 'var(--border-color)' : (canClockIn ? 'var(--primary)' : 'var(--danger)'),
                    color: (!isAtOffice || clockOutDisabled) ? 'var(--text-muted)' : 'white',
                    fontWeight: 'bold',
                    cursor: (!isAtOffice || clockOutDisabled) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {processLoading ? 'Memproses...' : (canClockIn ? 'Presensi Masuk' : 'Presensi Pulang')}
                </button>
                {clockOutDisabled && <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>Anda baru bisa pulang pukul 17:03.</p>}
                {!isAtOffice && !alreadyDone && <p style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.5rem' }}>Harus terhubung dengan WIFI Kantor.</p>}
              </>
            )}
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
               <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-dark)' }}>{totalOnTime}</h3>
               <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--success)', fontWeight: 'bold' }}>TEPAT WAKTU</p>
            </div>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
               <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-dark)' }}>{totalTerlambat}</h3>
               <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 'bold' }}>TERLAMBAT</p>
            </div>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center' }}>
               <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.25rem 0', color: 'var(--text-dark)' }}>{totalHadir}</h3>
               <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>KEHADIRAN</p>
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1, marginBottom: 0, overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Riwayat Presensi</h3>
            {history.length === 0 ? (
               <p style={{ color: 'var(--text-muted)' }}>Belum ada data history.</p>
            ) : (
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                     <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.5rem 0' }}>Tanggal</th>
                        <th style={{ padding: '0.5rem 0' }}>Jam</th>
                        <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Status</th>
                     </tr>
                  </thead>
                  <tbody>
                     {history.slice(0, 5).map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                           <td style={{ padding: '0.75rem 0' }}>
                              {new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                           </td>
                           <td style={{ padding: '0.75rem 0' }}>
                              {h.jam_masuk || '-'} — {h.jam_keluar || '-'}
                           </td>
                           <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>
                              <span style={{ 
                                 padding: '0.25rem 0.5rem', 
                                 borderRadius: '4px', 
                                 backgroundColor: h.status === 'Hadir' ? (h.terlambat ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'rgba(100, 116, 139, 0.1)',
                                 color: h.status === 'Hadir' ? (h.terlambat ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)'
                              }}>
                                 {h.status === 'Hadir' ? (h.terlambat ? 'Terlambat' : 'Tepat Waktu') : h.status}
                              </span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

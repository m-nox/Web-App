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
    padding: '0.5rem',
    border: '1px solid var(--border-color)',
    marginBottom: '0.65rem'
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', padding: '0 0 2rem 0' }}>
      
      {/* Install App Banner - shown only if not installed yet and prompt is available */}
      {!isInstalled && installPrompt && (
        <div style={{
          ...cardStyle,
          background: 'linear-gradient(135deg, #00AEEF 0%, #0088ba 100%)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          padding: '0.75rem'
        }}>
          <img src="/icon-192.png" alt="Icon" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '160px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', color: 'white', fontSize: '0.85rem' }}>Install Aplikasi Lini HRIS</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', marginTop: '0.1rem' }}>Akses instan dari home screen Anda.</p>
          </div>
          <button
            onClick={handleInstall}
            className="mobile-full"
            style={{
              padding: '0.6rem 1.25rem',
              backgroundColor: 'white',
              color: '#00AEEF',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '0.8rem'
            }}
          >
            📲 Install
          </button>
        </div>
      )}

      {/* Header Profile Section */}
      {profile && (
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '1rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold', flexShrink: 0 }}>
             {profile.nama_depan[0]}{profile.nama_belakang?.[0] || ''}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
             <h1 style={{ margin: '0 0 0.15rem 0', fontWeight: '800', color: 'var(--text-dark)' }}>{profile.nama_depan} {profile.nama_belakang || ''}</h1>
             <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '600' }}>{profile.jabatan?.nama_jabatan || 'Team Member'} • {profile.departemen?.nama_departemen || '-'}</p>
             {(profile.nama_bank || profile.nomor_rekening) && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', backgroundColor: 'var(--primary-light)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>🏦 {profile.nama_bank || '-'}</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', backgroundColor: 'var(--secondary)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>💳 {profile.nomor_rekening || '-'}</span>
                </div>
             )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--section-gap)', flexWrap: 'wrap' }}>
        
        {/* Left Col: Live Clock & Actions */}
        <div style={{ flex: '1 1 300px', ...cardStyle, textAlign: 'center', padding: '1rem' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '0.25rem 0.75rem', 
            borderRadius: '99px',
            fontSize: '0.65rem',
            fontWeight: '800',
            backgroundColor: isAtOffice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: isAtOffice ? 'var(--success)' : 'var(--danger)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase'
          }}>
            {isAtOffice ? '📍 Kantor' : '🏠 Luar Kantor'}
          </div>
          
          <div style={{ 
            fontSize: '0.65rem', 
            color: 'var(--text-muted)', 
            marginBottom: '0.75rem', 
            display: 'flex', 
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: 0.8 
          }}>
            <span>IP: <strong>{attendance?.clientIp?.slice(0, 15)}...</strong></span>
          </div>
              
          <h2 style={{ fontSize: '1.65rem', fontWeight: '900', margin: '0 0 0.1rem 0', color: 'var(--text-dark)' }}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 0.65rem 0', fontSize: '0.7rem' }}>
            {time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '0.65rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: '800' }}>MASUK</p>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>{todayAtt?.jam_masuk || '--:--'}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--text-muted)', fontWeight: '800' }}>KELUAR</p>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>{todayAtt?.jam_keluar || '--:--'}</p>
            </div>
          </div>

          <div>
            {alreadyDone ? (
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontWeight: '800', fontSize: '0.85rem' }}>
                Presensi Selesai
              </div>
            ) : (
              <>
                <button
                  onClick={handleClock}
                  className="mobile-full"
                  disabled={!isAtOffice || processLoading || clockOutDisabled}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    backgroundColor: (!isAtOffice || clockOutDisabled) ? 'var(--border-color)' : (canClockIn ? 'var(--primary)' : 'var(--danger)'),
                    color: (!isAtOffice || clockOutDisabled) ? 'var(--text-muted)' : 'white',
                    fontWeight: '800',
                    cursor: (!isAtOffice || clockOutDisabled) ? 'not-allowed' : 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {processLoading ? '...' : (canClockIn ? 'Presensi Masuk' : 'Presensi Pulang')}
                </button>
                {clockOutDisabled && <p style={{ fontSize: '0.65rem', color: 'var(--warning)', marginTop: '0.5rem' }}>Pulang pukul 17:03.</p>}
                {!isAtOffice && !alreadyDone && <p style={{ fontSize: '0.65rem', color: 'var(--danger)', marginTop: '0.5rem' }}>Gunakan WIFI Kantor.</p>}
              </>
            )}
          </div>
        </div>

        {/* Right Col: Stats & History */}
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center', padding: '0.4rem' }}>
               <h3 style={{ margin: '0 0 0.1rem 0', fontWeight: '900', fontSize: '1rem' }}>{totalOnTime}</h3>
               <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--success)', fontWeight: '800' }}>ON TIME</p>
            </div>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center', padding: '0.4rem' }}>
               <h3 style={{ margin: '0 0 0.1rem 0', fontWeight: '900', fontSize: '1rem' }}>{totalTerlambat}</h3>
               <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--danger)', fontWeight: '800' }}>LATE</p>
            </div>
            <div style={{ ...cardStyle, flex: 1, marginBottom: 0, textAlign: 'center', padding: '0.4rem' }}>
               <h3 style={{ margin: '0 0 0.1rem 0', fontWeight: '900', fontSize: '1rem' }}>{totalHadir}</h3>
               <p style={{ margin: 0, fontSize: '0.5rem', color: 'var(--primary)', fontWeight: '800' }}>ATTEND</p>
            </div>
          </div>

          <div style={{ ...cardStyle, flex: 1, marginBottom: 0, padding: '0.65rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: '800' }}>Riwayat</h3>
            <div className="responsive-table">
            {history.length === 0 ? (
               <p style={{ color: 'var(--text-muted)' }}>Belum ada data history.</p>
            ) : (
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', tableLayout: 'fixed' }}>
                  <thead>
                     <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '0.35rem 0', width: '25%' }}>Tgl</th>
                        <th style={{ padding: '0.35rem 0', width: '55%' }}>Jam</th>
                        <th style={{ padding: '0.35rem 0', width: '20%', textAlign: 'right' }}>Sts</th>
                     </tr>
                  </thead>
                  <tbody>
                     {history.slice(0, 5).map(h => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                           <td style={{ padding: '0.25rem 0' }}>
                              {new Date(h.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                           </td>
                           <td style={{ padding: '0.25rem 0' }}>
                              {h.jam_masuk || '-'} — {h.jam_keluar || '-'}
                           </td>
                           <td style={{ padding: '0.4rem 0', textAlign: 'right' }}>
                              <span style={{ 
                                 padding: '0.2rem 0.4rem', 
                                 borderRadius: '4px', 
                                 fontSize: '0.7rem',
                                 fontWeight: '800',
                                 backgroundColor: h.status === 'Hadir' ? (h.terlambat ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'rgba(100, 116, 139, 0.1)',
                                 color: h.status === 'Hadir' ? (h.terlambat ? 'var(--danger)' : 'var(--success)') : 'var(--text-muted)'
                              }}>
                                 {h.status === 'Hadir' ? (h.terlambat ? 'LAT' : 'OK') : h.status}
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
    </div>
  )
}

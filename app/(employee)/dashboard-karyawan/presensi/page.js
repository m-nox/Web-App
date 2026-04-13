'use client'

import { useState, useEffect } from 'react'

export default function EmployeePresensiPage() {
  const [time, setTime] = useState(new Date())
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processLoading, setProcessLoading] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState(null)

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    fetchStatus()
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

  const handleClock = async () => {
    setProcessLoading(true)
    setFeedbackMsg(null)
    try {
      const res = await fetch('/api/absensi/clock', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: data.message })
        fetchStatus()
      } else {
        setFeedbackMsg({ type: 'error', text: data.error })
      }
    } catch (error) {
      setFeedbackMsg({ type: 'error', text: 'Terjadi kesalahan pada server.' })
    } finally {
      setProcessLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-muted)' }}>Memuat portal presensi...</p>
          <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { to { transform: rotate(360deg); } }' }} />
        </div>
      </div>
    )
  }

  const isAtOffice = status?.isAtOffice
  const attendance = status?.attendance
  const canClockIn = !attendance
  const canClockOut = attendance && !attendance.jam_keluar
  const alreadyDone = attendance && attendance.jam_keluar
  const isBeforeGoHomeTime = time.getHours() < 17 || (time.getHours() === 17 && time.getMinutes() < 3)
  const clockOutDisabled = canClockOut && isBeforeGoHomeTime

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.25rem', background: 'linear-gradient(45deg, var(--primary), #00d2ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Portal Presensi
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Lakukan pencatatan kehadiran Anda di sini.</p>
      </div>

      {/* Feedback Message */}
      {feedbackMsg && (
        <div style={{
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
          backgroundColor: feedbackMsg.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: feedbackMsg.type === 'success' ? '#166534' : '#991b1b',
          fontWeight: '600', fontSize: '0.9rem', textAlign: 'center',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {feedbackMsg.type === 'success' ? '✅ ' : '❌ '}{feedbackMsg.text}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: '@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }' }} />

      {/* Clock Widget */}
      <div className="card glass" style={{ textAlign: 'center', padding: '3rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-30px', left: '-30px', width: '120px', height: '120px', background: 'var(--primary)', filter: 'blur(60px)', opacity: 0.12 }}></div>
        <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '120px', height: '120px', background: '#60a5fa', filter: 'blur(60px)', opacity: 0.1 }}></div>

        <p style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>
          {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <h2 style={{ fontSize: '5rem', fontWeight: '800', margin: '0.5rem 0', fontFamily: 'monospace', textShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </h2>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          marginTop: '1rem', padding: '0.5rem 1.5rem', borderRadius: 'var(--radius-full)',
          backgroundColor: isAtOffice ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: isAtOffice ? '#166534' : '#991b1b', fontSize: '0.85rem', fontWeight: '600'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isAtOffice ? '#22c55e' : '#ef4444', animation: 'pulse 2s infinite' }}></div>
          {isAtOffice ? 'Terhubung Jaringan Kantor' : 'Di Luar Jangkauan Kantor'}
        </div>
        <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }' }} />
      </div>

      {/* Action Card */}
      <div className="card glass" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '1.5rem' }}>Status Kehadiran</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jam Masuk</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', color: attendance?.jam_masuk ? 'var(--success)' : 'var(--text-muted)' }}>
              {attendance?.jam_masuk?.substring(0, 5) || '--:--'}
            </p>
          </div>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Jam Keluar</p>
            <p style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'monospace', color: attendance?.jam_keluar ? 'var(--success)' : 'var(--text-muted)' }}>
              {attendance?.jam_keluar?.substring(0, 5) || '--:--'}
            </p>
          </div>
          <div style={{ padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.02)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Status</p>
            <p style={{
              fontSize: '0.9rem', fontWeight: '700',
              color: attendance?.terlambat ? 'var(--danger)' : (attendance?.status === 'Hadir' ? '#166534' : 'var(--text-muted)')
            }}>
              {attendance?.terlambat ? '⚠️ Terlambat' : (attendance?.status || '⏳ Menunggu')}
            </p>
          </div>
        </div>

        {alreadyDone ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', borderRadius: 'var(--radius-md)', background: 'rgba(34, 197, 94, 0.08)', color: '#166534', fontWeight: '600' }}>
            ✅ Kehadiran hari ini sudah tercatat lengkap. Selamat bekerja!
          </div>
        ) : (
          <>
            <button
              onClick={handleClock}
              disabled={!isAtOffice || processLoading || clockOutDisabled}
              className={`btn ${canClockOut ? '' : 'btn-primary'}`}
              style={{
                width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: '700',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: (!isAtOffice || clockOutDisabled) ? 0.5 : 1,
                cursor: (!isAtOffice || clockOutDisabled) ? 'not-allowed' : 'pointer',
                backgroundColor: canClockOut ? 'var(--warning)' : undefined,
                color: canClockOut ? 'white' : undefined,
                boxShadow: canClockOut ? '0 4px 14px rgba(245, 158, 11, 0.3)' : undefined
              }}
            >
              {processLoading ? 'Memproses...' : (canClockIn ? '🟢 Absen Masuk Sekarang' : '🔴 Absen Keluar Sekarang')}
            </button>
            {clockOutDisabled && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--warning)', textAlign: 'center', fontWeight: '500' }}>
                ⏰ Jam pulang pukul 17:03. Absen keluar belum tersedia.
              </p>
            )}
            {!isAtOffice && (
              <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#991b1b', textAlign: 'center', fontWeight: '500' }}>
                ⚠️ Hubungkan ke jaringan kantor untuk melakukan absen.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
